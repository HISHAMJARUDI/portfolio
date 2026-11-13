import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const Admin = lazy(() => import("./Admin.jsx"));

const isAdmin =
  window.location.pathname === "/admin" ||
  window.location.pathname === "/admin/";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={
        <div style={{
          padding: "80px",
          textAlign: "center"
        }}>
          Opening dashboard...
        </div>
      }>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
