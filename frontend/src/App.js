import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeMaintenance from "./pages/admin/EmployeeMaintenance";
import LoginReport from "./pages/admin/LoginReport";
import DailyAttendanceReport from "./pages/admin/DailyAttendanceReport";
import MonthlyAttendanceReport from "./pages/admin/MonthlyAttendanceReport";
import LeaveManagement from "./pages/admin/LeaveManagement";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/employee/login" element={<EmployeeLogin />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <PrivateRoute role="admin">
              <EmployeeMaintenance />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/login-report"
          element={
            <PrivateRoute role="admin">
              <LoginReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/leave-management"
          element={
            <PrivateRoute role="admin">
              <LeaveManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/daily-report"
          element={
            <PrivateRoute role="admin">
              <DailyAttendanceReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/monthly-report"
          element={
            <PrivateRoute role="admin">
              <MonthlyAttendanceReport />
            </PrivateRoute>
          }
        />

        {/* Employee Protected Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute role="employee">
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
