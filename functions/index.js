const {
  onRequest,
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

const Stripe = require("stripe");

// Initialize Firebase Admin once at module level
admin.initializeApp();
const db = admin.firestore();

// Secrets

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// ─── createCheckoutSession ────────────────────────────────────────────────────
exports.createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY], region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }
    const userId = request.auth.uid;
    const {
      cartItems,
      customerInfo,
      shipping,
      shippingCarrier,
      shippingSpeed,
    } = request.data;

    if (!cartItems || cartItems.length === 0) {
      throw new HttpsError("invalid-argument", "Cart is empty.");
    }

    const secretKey = STRIPE_SECRET_KEY.value();
    if (!secretKey) {
      console.error("STRIPE_SECRET_KEY is not configured!");
      throw new HttpsError("internal", "Payment service is not configured.");
    }

    const stripe = new Stripe(secretKey);

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const shippingCost = Number(shipping || 0);
    const total = subtotal + shippingCost;

    // Save pending order to Firestore first
    const orderRef = db.collection("orders").doc();
    const orderId = orderRef.id;

    try {
      await orderRef.set({
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        subtotal,
        shipping: shippingCost,
        total,
        shippingCarrier: shippingCarrier || "",
        shippingSpeed: shippingSpeed || "",
        paymentMethod: "stripe",
        customer: {
          fullName: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
          email: customerInfo.email,
          phone: customerInfo.phone,
          houseNumber: customerInfo.houseNumber || "",
          street: customerInfo.street || "",
          city: customerInfo.city,
          province: customerInfo.province || "",
          country: customerInfo.country,
          postalCode: customerInfo.postalCode || "",
        },
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          imageUrl: item.imageUrl || "",
          category: item.category || "",
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize || "",
          selectedMaterial: item.selectedMaterial || "",
          variantKey: item.variantKey || "",
        })),
      });
    } catch (firestoreErr) {
      console.error("Failed to save pending order:", firestoreErr);
      throw new HttpsError(
        "internal",
        "Failed to save order. Please try again.",
      );
    }

    // Helper: only keep valid https image URLs (Stripe requires https)
    const safeImageUrl = (url) => {
      if (
        typeof url === "string" &&
        url.startsWith("https://") &&
        url.length <= 2048
      ) {
        return [url];
      }
      return [];
    };

    // Build Stripe line items (amounts in cents)
    const lineItems = cartItems.map((item) => {
      const desc = [
        item.category,
        item.selectedColor,
        item.selectedSize,
        item.selectedMaterial,
      ]
        .filter(Boolean)
        .join(" · ");

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name || "Product",
            ...(safeImageUrl(item.imageUrl).length > 0
              ? { images: safeImageUrl(item.imageUrl) }
              : {}),
            ...(desc ? { description: desc } : {}),
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Number(item.quantity),
      };
    });

    // Add shipping as a line item if > 0
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Shipping (${shippingCarrier || "Standard"} – ${shippingSpeed || "standard"})`,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    try {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        customer_email: customerInfo.email,
        success_url:
          "https://apsara-dd748.web.app/order-success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://apsara-dd748.web.app/checkout",
        metadata: {
          orderId,
          userId,
        },
      });

      // Store Stripe session ID on the order
      await orderRef.update({ stripeSessionId: session.id });

      return { url: session.url };
    } catch (stripeErr) {
      console.error(
        "Stripe session creation failed:",
        stripeErr.message,
        stripeErr,
      );
      // Clean up the pending order
      await orderRef.delete().catch(() => {});
      throw new HttpsError(
        "internal",
        `Payment session failed: ${stripeErr.message}`,
      );
    }
  },
);

// ─── stripeWebhook ────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(
  {
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    region: "us-central1",
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).send("Missing stripe-signature");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    let event;

    try {
      // req.rawBody is a Buffer provided by Firebase Functions v2
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error("No orderId in session metadata");
          break;
        }

        const orderSnap = await db.collection("orders").doc(orderId).get();
        const orderData = orderSnap.data();

        const batch = db.batch();

        batch.update(db.collection("orders").doc(orderId), {
          status: "paid",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent,
        });

        if (orderData?.items) {
          for (const item of orderData.items) {
            if (item.id) {
              batch.update(db.collection("products").doc(item.id), {
                stock: admin.firestore.FieldValue.increment(
                  -Number(item.quantity || 0),
                ),
              });
            }
          }
        }

        await batch.commit();
        console.log(`Order ${orderId} marked as paid, stock decremented.`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  },
);
