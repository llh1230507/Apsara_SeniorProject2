const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

exports.sendTestEmail = onRequest(
  { secrets: [SENDGRID_API_KEY], region: "us-central1" },
  async (req, res) => {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY.value());

      await sgMail.send({
        to: "ricelover211@gmail.com",
        from: "rathana.ly812@gmail.com", // must be verified sender in SendGrid
        subject: "SendGrid test",
        text: "Hello from Firebase Functions (2nd gen) + SendGrid",
      });

      res.status(200).send("Email sent ✅");
    } catch (err) {
      console.error(err);
      res.status(500).send(err?.message || "Failed");
    }
  }
);
