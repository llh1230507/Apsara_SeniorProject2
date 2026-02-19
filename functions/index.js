const { onRequest, onCall } = require("firebase-functions/v2/https");
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
      throw new Error("unauthenticated");
    }
    const userId = request.auth.uid;
    const { cartItems, customerInfo } = request.data;

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );

    // Save pending order to Firestore first
    const orderRef = db.collection("orders").doc();
    const orderId = orderRef.id;

    await orderRef.set({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
      subtotal,
      paymentMethod: "stripe",
      customer: {
        fullName: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
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

    // Build Stripe line items (amounts in cents)
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          description: [
            item.category,
            item.selectedColor,
            item.selectedSize,
            item.selectedMaterial,
          ]
            .filter(Boolean)
            .join(" · "),
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Number(item.quantity),
    }));

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

        await db.collection("orders").doc(orderId).update({
          status: "paid",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent,
        });

        console.log(`Order ${orderId} marked as paid.`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  },
);
