import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";

function EmployeeLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emp_id: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("https://eams-zfwj.onrender.com/employees/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "employee");
      localStorage.setItem("user", JSON.stringify(data.employee));
      toast.success(`Welcome, ${data.employee.full_name}!`);
      navigate("/employee/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-hero">
      <div className="landing-card">
        <div className="text-center mb-4">
          <i
            className="bi bi-person-badge"
            style={{ fontSize: "3rem", color: "#00695c" }}
          ></i>
          <h2 className="mt-2" style={{ color: "#00695c", fontWeight: 800 }}>
            Employee Login
          </h2>
          <p className="text-muted small">Sign in to track your attendance</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Employee ID</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-person-badge"></i>
              </span>
              <input
                type="text"
                name="emp_id"
                className="form-control"
                placeholder="e.g. EMP-001"
                value={form.emp_id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-employee"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Signing in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            className="btn btn-link text-muted small"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLogin;
