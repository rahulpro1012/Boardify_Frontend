// src/features/auth/Login.tsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // Use Hook, not Component
import { type RootState } from "../../app/store";
import { useAuth } from "./useAuth"; // Make sure this path is correct

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = useSelector((s: RootState) => s.auth.loading);
  const token = useSelector((s: RootState) => s.auth.token);
  const error = useSelector((s: RootState) => s.auth.error);

  // FIX: Use useEffect for the redirect, not a return statement
  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async () => {
    await login(email, password);
    // No need to navigate here, the useEffect above will catch the token change
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <input
        className="w-full p-2 border rounded mb-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 border rounded mb-4"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="w-full p-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
