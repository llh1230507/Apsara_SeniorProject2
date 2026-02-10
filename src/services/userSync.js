import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

const cartKey = (item) =>
  item.variantKey ||
  `${item.id}|color=${item.selectedColor}|size=${item.selectedSize}|material=${item.selectedMaterial}`;

export async function syncLocalToFirestore(uid) {
  const localCart = JSON.parse(localStorage.getItem("cart")) || [];
  const localFavs = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!localCart.length && !localFavs.length) return;

  // Read existing remote cart so we can MERGE quantities
  const remoteCartSnap = await getDocs(collection(db, "users", uid, "cart"));
  const remoteQtyMap = new Map();
  remoteCartSnap.forEach((d) => {
    const data = d.data();
    remoteQtyMap.set(d.id, Number(data.quantity || 0));
  });

  const batch = writeBatch(db);

  // CART merge: remoteQty + localQty
  for (const item of localCart) {
    const key = cartKey(item);
    const ref = doc(db, "users", uid, "cart", key);
    const mergedQty = (remoteQtyMap.get(key) || 0) + Number(item.quantity || 0);

    batch.set(ref, { ...item, variantKey: key, quantity: mergedQty }, { merge: true });
  }

  // FAVORITES: doc id = product.id
  for (const p of localFavs) {
    const ref = doc(db, "users", uid, "favorites", p.id);
    batch.set(ref, { ...p, productId: p.id }, { merge: true });
  }

  await batch.commit();

  // clear local after successful sync
  localStorage.removeItem("cart");
  localStorage.removeItem("favorites");
}
