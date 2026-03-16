import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  return (
    <div className="sidebar d-flex flex-column">
      <div className="sidebar-brand">
        <i className="bi bi-building me-2"></i>
        <span>EAMS Admin</span>
      </div>

      <div className="px-2 mb-3">
        <small className="text-white-50 px-3">Welcome,</small>
        <div className="text-white px-3 fw-semibold">
          {admin.full_name || "Administrator"}
        </div>
      </div>

      <nav className="flex-grow-1">
        <NavLink to="/admin/dashboard" className="nav-link">
          <i className="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/login-report" className="nav-link">
          <i className="bi bi-person-check"></i>
          <span>Login Report</span>
        </NavLink>
        <NavLink to="/admin/employees" className="nav-link">
          <i className="bi bi-people"></i>
          <span>Employee Maintenance</span>
        </NavLink>
        <NavLink to="/admin/leave-management" className="nav-link">
          <i className="bi bi-calendar2-check"></i>
          <span>Leave Management</span>
        </NavLink>
        <NavLink to="/admin/daily-report" className="nav-link">
          <i className="bi bi-calendar-day"></i>
          <span>Daily Report</span>
        </NavLink>
        <NavLink to="/admin/monthly-report" className="nav-link">
          <i className="bi bi-calendar-month"></i>
          <span>Monthly Report</span>
        </NavLink>
      </nav>

      <div className="p-3">
        <button className="btn btn-outline-light w-100" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left me-2"></i>Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
