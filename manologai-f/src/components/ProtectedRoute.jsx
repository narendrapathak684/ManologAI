import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { PageSkeleton } from "./SkeletonBoneyard";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton titleWidth="w-64" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
