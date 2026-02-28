const functions = require("firebase-functions");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.refundStripePayment = functions.https.onCall(async (data, context) => {
  const { paymentIntentId, amount } = data;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // amount in cents, optional for full refund
    });
    return { success: true, refund };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
