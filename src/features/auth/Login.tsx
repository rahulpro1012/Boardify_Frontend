import  { useState } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../../app/store";
import { useAuth } from "./useAuth";
import { Navigate } from "react-router-dom";
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loading = useSelector((s: RootState) => s.auth.loading);
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const error = useSelector((s: RootState) => s.auth.error);
  if (token) return <Navigate to="/" replace />;
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
        className="w-full p-2 bg-blue-600 text-white rounded"
        disabled={loading}
        onClick={() => login(email, password)}
      >
        Sign in
      </button>
    </div>
  );
}
