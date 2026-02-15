import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

function formatDate(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qText, setQText] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const ref = collection(db, "users");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = qText.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const email = String(u.email || "").toLowerCase();
      const name = String(u.displayName || "").toLowerCase();
      const provider = String(u.provider || "").toLowerCase();
      const role = String(u.role || "").toLowerCase();
      return (
        email.includes(q) ||
        name.includes(q) ||
        provider.includes(q) ||
        role.includes(q)
      );
    });
  }, [users, qText]);

  const setRole = async (userId, role) => {
    await updateDoc(doc(db, "users", userId), { role });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  const removeUserDoc = async (userId) => {
    if (!window.confirm("Remove this user from Firestore list?")) return;
    await deleteDoc(doc(db, "users", userId));
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500">
            Lists users from Firestore collection <b>users</b>.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Search name/email/provider/role..."
            className="border rounded px-3 py-2 w-72"
          />
          <button
            type="button"
            onClick={fetchUsers}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading users...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Provider</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left w-56">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          N/A
                        </div>
                      )}

                      <div>
                        <p className="font-medium">
                          {u.displayName || "Unnamed user"}
                        </p>
                        <p className="text-xs text-gray-500 break-all">
                          UID: {u.uid || u.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 break-all">{u.email || "-"}</td>

                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      {u.provider || "-"}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.role === "admin"
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {u.role || "user"}
                    </span>
                  </td>

                  <td className="p-3">{formatDate(u.createdAt)}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      
                      <button
                        type="button"
                        onClick={() => removeUserDoc(u.id)}
                        className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>

                   
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
