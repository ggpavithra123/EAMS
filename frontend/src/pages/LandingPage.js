import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-hero">
      <div className="landing-card text-center">
        <div className="mb-4">
          <i
            className="bi bi-building-check"
            style={{ fontSize: "3.5rem", color: "#1a237e" }}
          ></i>
        </div>
        <h1 className="landing-title mb-2">EAMS</h1>
        <p className="landing-subtitle mb-4">
          Employee Attendance Management System
        </p>
        <p className="text-muted mb-4 small">
          Streamline your workforce attendance tracking with real-time insights
          and automated reporting.
        </p>
        <button
          className="btn-login-admin"
          onClick={() => navigate("/admin/login")}
        >
          <i className="bi bi-shield-lock me-2"></i>
          Admin Login
        </button>
        <button
          className="btn-login-employee"
          onClick={() => navigate("/employee/login")}
        >
          <i className="bi bi-person-badge me-2"></i>
          Employee Login
        </button>
        <p className="text-muted mt-4 small">
          &copy; {new Date().getFullYear()} Employee Attendance Management
          System
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
