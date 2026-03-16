import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("https://eams-zfwj.onrender.com/api/admin/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "admin");
      localStorage.setItem("user", JSON.stringify(data.admin));
      toast.success("Login successful!");
      navigate("/admin/dashboard");
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
            className="bi bi-shield-lock"
            style={{ fontSize: "3rem", color: "#1a237e" }}
          ></i>
          <h2 className="landing-title mt-2">Admin Login</h2>
          <p className="text-muted small">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Username</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                name="username"
                className="form-control"
                placeholder="Enter username"
                value={form.username}
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

          <button type="submit" className="btn-login-admin" disabled={loading}>
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

export default AdminLogin;
