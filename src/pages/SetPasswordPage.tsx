import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { BarChart, Lock, AlertCircle, CheckCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

// Password complexity helpers
const checks = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [inviteSession, setInviteSession] = useState<Session | null>(null);

  // Capture the URL hash type synchronously before the Supabase SDK clears it.
  // Supabase invite links contain `#access_token=...&type=invite` in the fragment.
  const tokenTypeRef = useRef<string | null>(
    new URLSearchParams(window.location.hash.substring(1)).get("type")
  );

  const { loginWithSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const tokenType = tokenTypeRef.current;

      // Block access if this page was not reached via an invite or recovery link.
      if (tokenType !== "invite" && tokenType !== "recovery") {
        setError(
          "This page is only accessible via an invitation link. Please request a new invitation."
        );
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError(
          "Invalid or expired invite link. Please request a new invitation."
        );
        return;
      }

      setInviteSession(session);
      setSessionReady(true);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!inviteSession) {
      setError("Session expired. Please request a new invitation.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        console.error("updateUser error:", updateError);
        throw new Error(
          "Failed to set password. Your invite link may have expired — please request a new invitation."
        );
      }

      // Re-fetch session which is now fully authenticated after password update
      const {
        data: { session: newSession },
      } = await supabase.auth.getSession();
      if (!newSession) {
        throw new Error("Session not found after password update.");
      }

      await loginWithSession(newSession);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          Verifying invite link...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center">
          <BarChart size={48} className="mx-auto text-primary-600" />
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to SalesDash
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set your password to complete your account setup.
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-6 shadow sm:rounded-lg">
          {error ? (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Minimum 12 characters"
                  />
                </div>
                {/* Complexity hints — shown once the user starts typing */}
                {password.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {checks.map(({ label, test }) => {
                      const passed = test(password);
                      return (
                        <li
                          key={label}
                          className={`flex items-center gap-1.5 text-xs ${
                            passed
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          <CheckCircle size={12} />
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Setting password..." : "Set Password & Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
