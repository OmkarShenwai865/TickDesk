import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roles }) {
    const token = localStorage.getItem("access");
    const role  = localStorage.getItem("role");

    if (!token) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(role)) {
        return <Navigate to="/tickets" replace />;
    }

    return children;
}

export default ProtectedRoute;
