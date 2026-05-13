import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header, Footer } from "./components";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Submissions from "./pages/Submissions";
import AdminPanel from "./pages/AdminPanel";
import ExpertScoring from "./pages/ExpertScoring";
import Gallery from "./pages/Gallery";
import Results from "./pages/Results";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Timeline from "./pages/Timeline";
import Compare from "./pages/Compare";
import MyScores from "./pages/MyScores";
import NotFound from "./pages/NotFound";
import "./styles.css";
import "./styles/animations.css";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [transition, setTransition] = useState<'idle' | 'exit' | 'enter'>('idle');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  useEffect(() => {
    setTransition('exit');
    const exitTimer = setTimeout(() => {
      setTransition('enter');
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition('idle');
        });
      });
    }, 250);
    return () => clearTimeout(exitTimer);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole(null);
    window.location.href = "/";
  };

  const showShell = isLoggedIn || !isHome;

  const pageClass = transition === 'exit' ? 'page-exit' : transition === 'enter' ? 'page-enter' : 'page-enter';

  return (
    <>
      {showShell && (
        <Header 
          showNav={true} 
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          theme={theme}
          onThemeToggle={toggleTheme}
          userRole={userRole}
        />
      )}
      <div className={showShell ? "container" : ""}>
        <div className={pageClass} key={transition === 'idle' ? location.pathname : transition}>
          <Routes location={location}>
            <Route path="/" element={isLoggedIn ? <Dashboard /> : <Landing isLoggedIn={isLoggedIn} onLogout={handleLogout} theme={theme} onThemeToggle={toggleTheme} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/submissions" element={<Submissions />} />
            {(userRole === "expert" || userRole === "admin" || userRole === "hq") && (
              <Route path="/gallery" element={<Gallery />} />
            )}
            <Route path="/results" element={<Results />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/my-scores" element={<MyScores />} />
            {(userRole === "expert" || userRole === "admin" || userRole === "hq") && (
              <Route path="/scoring/:id" element={<ExpertScoring />} />
            )}
            {(userRole === "admin" || userRole === "hq") && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
      {showShell && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
