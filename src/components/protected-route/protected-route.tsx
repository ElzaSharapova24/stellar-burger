import { Navigate, useLocation } from "react-router";
import { getAuthData, getIsAuthChecked } from "../../services/selectors";
import Loader from "../loader";
import React from "react";
import { useSelector } from "../../services/hooks";

interface ProtectedRouteProps extends React.PropsWithChildren {
  children: React.ReactNode;
  onlyUnAuth?: boolean;
}

const ProtectedRoute = ({ children, onlyUnAuth }: ProtectedRouteProps) => {
  const location = useLocation();
  const authData = useSelector(getAuthData);
  const isAuthCheck = useSelector(getIsAuthChecked);

  if (!isAuthCheck) {
    console.log("Waiting for user authentication check...");
    return <Loader />;
  }

  if (onlyUnAuth && authData) {
    const from = location.state?.from || { pathname: "/" };
    console.log("Navigating from login-page to index");
    return <Navigate replace to={from} />;
  }

  if (!onlyUnAuth && !authData) {
    console.log("Navigating from page to login-page");
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  console.log("Rendering component");
  return <>{children}</>;
};

export default ProtectedRoute;