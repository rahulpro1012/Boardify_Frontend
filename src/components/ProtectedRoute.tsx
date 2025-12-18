// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../app/store";

interface Props {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const token = useSelector((state: RootState) => state.auth.token);

  // If there is no token, kick them out to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there IS a token, render the protected content
  return children ? <>{children}</> : <Outlet />;
}
