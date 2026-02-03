import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const productRef = collection(db, "products");

export const createProduct = async (product) => {
  await addDoc(productRef, product);
};

export const getAllProducts = async () => {
  const snapshot = await getDocs(productRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateProduct = async (id, data) => {
  const ref = doc(db, "products", id);
  await updateDoc(ref, data);
};

export const deleteProduct = async (id) => {
  const ref = doc(db, "products", id);
  await deleteDoc(ref);
};