/**
 * One-time migration script: base64 images in Firestore → Firebase Storage URLs
 *
 * Run from the functions/ directory:
 *   node migrate-images.js
 *
 * Requirements:
 *   - You must be logged in with Firebase CLI: firebase login
 *   - OR set GOOGLE_APPLICATION_CREDENTIALS to a service account key path
 */

const admin = require("firebase-admin");

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT_ID = "apsara-dd748";
const STORAGE_BUCKET = "apsara-dd748.firebasestorage.app";
// ─────────────────────────────────────────────────────────────────────────────

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Returns true if the value is a base64 data URL (not a real http URL).
 */
function isBase64(value) {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Uploads a base64 data URL to Firebase Storage and returns the public download URL.
 * @param {string} base64  - e.g. "data:image/jpeg;base64,/9j/..."
 * @param {string} path    - Storage path, e.g. "products/abc123/main.jpg"
 */
async function uploadBase64(base64, path) {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error(`Invalid base64 string at path: ${path}`);

  const mimeType = matches[1]; // e.g. "image/jpeg"
  const buffer = Buffer.from(matches[2], "base64");
  const ext = mimeType.split("/")[1] || "jpg";
  const fullPath = `${path}.${ext}`;

  const file = bucket.file(fullPath);
  await file.save(buffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  // Build the public URL
  const encodedPath = encodeURIComponent(fullPath).replace(/%2F/g, "%2F");
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
}

async function migrate() {
  console.log("Fetching all products from Firestore...");
  const snapshot = await db.collection("products").get();
  console.log(`Found ${snapshot.size} products.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // ── 1. Main imageUrl ────────────────────────────────────────────────────
    if (isBase64(data.imageUrl)) {
      console.log(`  [${doc.id}] Uploading imageUrl...`);
      try {
        updates.imageUrl = await uploadBase64(
          data.imageUrl,
          `products/${doc.id}/main`,
        );
        needsUpdate = true;
        console.log(`  [${doc.id}] imageUrl → ${updates.imageUrl}`);
      } catch (err) {
        console.error(`  [${doc.id}] ERROR uploading imageUrl:`, err.message);
      }
    }

    // ── 2. images map (color variants) ─────────────────────────────────────
    if (data.images && typeof data.images === "object") {
      const newImages = { ...data.images };
      let imagesChanged = false;

      for (const [colorKey, imgValue] of Object.entries(data.images)) {
        if (isBase64(imgValue)) {
          console.log(`  [${doc.id}] Uploading images.${colorKey}...`);
          try {
            const url = await uploadBase64(
              imgValue,
              `products/${doc.id}/colors/${colorKey}`,
            );
            newImages[colorKey] = url;
            imagesChanged = true;
            console.log(`  [${doc.id}] images.${colorKey} → ${url}`);
          } catch (err) {
            console.error(
              `  [${doc.id}] ERROR uploading images.${colorKey}:`,
              err.message,
            );
          }
        }
      }

      if (imagesChanged) {
        updates.images = newImages;
        needsUpdate = true;
      }
    }

    // ── 3. Apply updates ────────────────────────────────────────────────────
    if (needsUpdate) {
      await db.collection("products").doc(doc.id).update(updates);
      console.log(`  [${doc.id}] Firestore document updated.\n`);
      migrated++;
    } else {
      console.log(`  [${doc.id}] No base64 images found, skipping.\n`);
      skipped++;
    }
  }

  console.log("────────────────────────────────────");
  console.log(`Migration complete.`);
  console.log(`  Migrated : ${migrated} products`);
  console.log(`  Skipped  : ${skipped} products (already using URLs)`);
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
