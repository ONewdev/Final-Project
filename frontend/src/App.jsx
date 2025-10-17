import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomeRoutes from "./routes/HomeRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import UsersRoutes from "./routes/UsersRoutes";
import { ChatWidget } from "./components/ChatWidget";
import "./App.css";

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
    useEffect(() => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      document.body.style.fontFamily = "'Kanit', sans-serif";
      return () => {
        if (document.head.contains(link)) document.head.removeChild(link);
      };
    }, []);
  return (
    <>
      {!isAdmin && <ChatWidget />}
      <Routes>
        {/* Redirect root to /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Home routes */}
        <Route path="/*" element={<HomeRoutes />} />
        {/* Users routes */}
        <Route path="/users/*" element={<UsersRoutes />} />
        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </>
  );
}

export default App;
