import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles?.map((role) =>
    role.toLowerCase(),
  );

  if (
    normalizedAllowedRoles &&
    userRole &&
    !normalizedAllowedRoles.includes(userRole)
  ) {
    return (
      <Navigate to={userRole === "operator" ? "/operator" : "/"} replace />
    );
  }

  return <Outlet />;
};
