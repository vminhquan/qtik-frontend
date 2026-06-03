import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/LoadingState";

const RoleRoute = ({ roles = [], redirectTo = "/booking" }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingState label="Đang kiểm tra quyền truy cập..." />;

  const userRole = currentUser?.role || "user";
  if (!roles.includes(userRole)) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
};

export default RoleRoute;
