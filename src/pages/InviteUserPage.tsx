import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { supabase } from "../lib/supabase";
import Navbar from "../components/common/Navbar";
import { useNavigate } from "react-router-dom";

const InviteUserPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { availableStores } = useDashboard();
  const navigate = useNavigate();

  const isManager = currentUser?.role === "manager";
  const isAdmin = currentUser?.role === "admin";

  // availableStores is already filtered to the current user's store access
  const userStores = availableStores.filter((store) =>
    currentUser?.userStoreAccess?.some((access) => access.storeId === store.id)
  );

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "admin">(
    "employee"
  );
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser || (!isManager && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        You do not have permission to view this page.
      </div>
    );
  }

  const handleStoreToggle = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedStoreIds.length === 0) {
      setError("Please select at least one store.");
      return;
    }

    setIsLoading(true);
    try {
      // Verify the Supabase session is active before calling the Edge Function.
      // If missing, supabase.functions.invoke() falls back to the anon key → 401.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await logout();
        navigate("/login");
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "invite-user",
        {
          body: {
            email,
            name,
            role,
            storeIds: selectedStoreIds,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess(
        `Invitation sent to ${email}. They will receive an email to set their password.`
      );
      setEmail("");
      setName("");
      setRole("employee");
      setSelectedStoreIds([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitation.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
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
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md px-3 py-2">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            {isManager ? (
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                Employee — managers can only invite employees
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "employee" | "manager" | "admin")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Store Access
            </label>
            {userStores.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No stores available.
              </p>
            ) : (
              <div className="space-y-2">
                {userStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => handleStoreToggle(store.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">
                      {store.name}
                      {store.location ? ` — ${store.location}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
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
