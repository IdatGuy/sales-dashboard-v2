import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import Navbar from "../components/common/Navbar";
import { useNavigate } from "react-router-dom";

const InviteUserPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { availableStores } = useDashboard();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get stores the current user has access to
  const userStores = availableStores.filter((store) =>
    currentUser?.userStoreAccess?.some((access) => access.storeId === store.id)
  );
  const [storeId, setStoreId] = useState(userStores[0]?.id || "");

  if (
    !currentUser ||
    (currentUser.role !== "manager" && currentUser.role !== "admin")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        You do not have permission to view this page.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    // TODO: Replace with real invite logic (e.g. Supabase invite or email)
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(`Invitation sent to ${email} as ${role} for store ${storeId}`);
      setEmail("");
      setRole("employee");
      setStoreId(userStores[0]?.id || "");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-lg mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6">Invite New User</h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6"
        >
          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary-500 dark:bg-gray-700"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary-500 dark:bg-gray-700"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Store</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-primary-500 dark:bg-gray-700"
            >
              {userStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.location})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InviteUserPage;
