import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const authToken = localStorage.getItem("authToken");

  if (!isLoggedIn || !authToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;