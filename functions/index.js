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
        const custRequestId = session.metadata?.customizationRequestId;

        // ── Customization payment ──
        if (custRequestId) {
          const custRef = db
            .collection("customizationRequests")
            .doc(custRequestId);
          await custRef.update({
            status: "accepted",
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            stripePaymentIntent: session.payment_intent,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paidAmount: session.amount_total / 100,
          });
          console.log(
            `Customization ${custRequestId} paid → accepted. PI: ${session.payment_intent}`,
          );
          break;
        }

        // ── Regular product order ──
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

// ─── createCustomizationCheckout ──────────────────────────────────────────────
// Called by the customer when they accept a quote – creates a Stripe Checkout
// session for the quoted price and saves the shipping address.
exports.createCustomizationCheckout = onCall(
  { secrets: [STRIPE_SECRET_KEY], region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const { requestId, shippingAddress } = request.data;
    if (!requestId) {
      throw new HttpsError("invalid-argument", "Missing requestId.");
    }

    // Fetch the customization request
    const reqRef = db.collection("customizationRequests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      throw new HttpsError("not-found", "Customization request not found.");
    }

    const reqData = reqSnap.data();

    // Only allow payment on "quoted" status
    if (reqData.status !== "quoted") {
      throw new HttpsError(
        "failed-precondition",
        `Cannot pay for a request with status "${reqData.status}".`,
      );
    }

    // Ensure the caller owns this request
    if (reqData.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Not your request.");
    }

    const quotedPrice = Number(reqData.quotedPrice || 0);
    if (quotedPrice <= 0) {
      throw new HttpsError("failed-precondition", "Invalid quoted price.");
    }

    const secretKey = STRIPE_SECRET_KEY.value();
    if (!secretKey) {
      throw new HttpsError("internal", "Payment service is not configured.");
    }

    const stripe = new Stripe(secretKey);

    // Save the shipping address before payment
    await reqRef.update({
      shippingAddress: shippingAddress || null,
    });

    try {
      const categoryLabel = reqData.category || "Custom Product";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Custom Order – ${categoryLabel}`,
                description: reqData.details
                  ? reqData.details.substring(0, 200)
                  : "Customization request",
              },
              unit_amount: Math.round(quotedPrice * 100),
            },
            quantity: 1,
          },
        ],
        customer_email: reqData.email || reqData.userEmail,
        success_url: `https://apsara-dd748.web.app/my-customizations?payment=success&rid=${requestId}`,
        cancel_url: `https://apsara-dd748.web.app/my-customizations?payment=cancelled&rid=${requestId}`,
        metadata: {
          customizationRequestId: requestId,
          userId: request.auth.uid,
          type: "customization",
        },
      });

      // Save the Stripe session ID
      await reqRef.update({ stripeSessionId: session.id });

      return { url: session.url };
    } catch (stripeErr) {
      console.error("Stripe custom checkout failed:", stripeErr.message);
      throw new HttpsError(
        "internal",
        `Payment session failed: ${stripeErr.message}`,
      );
    }
  },
);

// ─── refundCustomization ──────────────────────────────────────────────────────
// Called by admin when approving a cancellation request (50% refund after 24h).
// Also callable by the request owner for self-cancel within 24h (full refund).
exports.refundCustomization = onCall(
  { secrets: [STRIPE_SECRET_KEY], region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const { requestId } = request.data;
    if (!requestId) {
      throw new HttpsError("invalid-argument", "Missing requestId.");
    }

    const reqRef = db.collection("customizationRequests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      throw new HttpsError("not-found", "Customization request not found.");
    }

    const reqData = reqSnap.data();

    // Check if caller is an admin
    const adminSnap = await db.collection("admins").doc(request.auth.uid).get();
    const isAdmin = adminSnap.exists;

    // Check if caller is the request owner
    const isOwner = reqData.userId === request.auth.uid;

    // Determine if within 24h
    const acceptedAt = reqData.acceptedAt?.toDate
      ? reqData.acceptedAt.toDate()
      : null;
    const now = new Date();
    const isWithin24h =
      acceptedAt && now.getTime() - acceptedAt.getTime() < 24 * 60 * 60 * 1000;

    // Authorization: admin can always refund; owner can only self-cancel within 24h
    if (!isAdmin && !isOwner) {
      throw new HttpsError(
        "permission-denied",
        "You don't have access to this request.",
      );
    }
    if (isOwner && !isAdmin && !isWithin24h) {
      throw new HttpsError(
        "permission-denied",
        "The 24-hour free cancellation window has expired. Please request cancellation for admin review.",
      );
    }

    if (!reqData.stripePaymentIntent) {
      throw new HttpsError(
        "failed-precondition",
        "No payment found for this request.",
      );
    }

    const quotedPrice = Number(reqData.quotedPrice || 0);
    const refundPercent = isWithin24h ? 100 : 50;
    const refundAmount = Math.round(quotedPrice * (refundPercent / 100) * 100); // in cents

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    try {
      const refund = await stripe.refunds.create({
        payment_intent: reqData.stripePaymentIntent,
        amount: refundAmount,
      });

      // Update the request doc
      await reqRef.update({
        status: "cancelled",
        cancellationRequested: false,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        refundPercent,
      });

      return {
        success: true,
        refundPercent,
        refundAmount: refundAmount / 100,
        refundId: refund.id,
      };
    } catch (err) {
      console.error("Refund failed:", err.message);
      throw new HttpsError("internal", `Refund failed: ${err.message}`);
    }
  },
);
