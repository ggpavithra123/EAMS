import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";

function AdminDashboard() {
  const [stats, setStats] = useState({
    online_count: 0,
    total_today: 0,
    total_employees: 0,
  });
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loginRes, empRes] = await Promise.all([
          API.get("https://eams-zfwj.onrender.com/api/attendance/login-report"),
          API.get("https://eams-zfwj.onrender.com/api/employees"),
        ]);
        setStats({
          online_count: loginRes.data.online_count,
          total_today: loginRes.data.records.length,
          total_employees: empRes.data.length,
        });
        setRecentLogins(loginRes.data.records.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Dashboard</h5>
            <small className="text-muted">{today}</small>
          </div>
          <span className="online-badge">
            <i
              className="bi bi-circle-fill me-1"
              style={{ color: "#4caf50", fontSize: "0.6rem" }}
            ></i>
            {stats.online_count} Online
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <>
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div
                  className="card stat-card p-3"
                  style={{ borderLeftColor: "#1a237e" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted small">Total Employees</div>
                      <div className="fs-2 fw-bold text-primary">
                        {stats.total_employees}
                      </div>
                    </div>
                    <i className="bi bi-people-fill fs-1 text-primary opacity-25"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card stat-card p-3"
                  style={{ borderLeftColor: "#4caf50" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted small">Currently Online</div>
                      <div className="fs-2 fw-bold text-success">
                        {stats.online_count}
                      </div>
                    </div>
                    <i className="bi bi-person-check-fill fs-1 text-success opacity-25"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card stat-card p-3"
                  style={{ borderLeftColor: "#ff9800" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted small">Logged In Today</div>
                      <div className="fs-2 fw-bold text-warning">
                        {stats.total_today}
                      </div>
                    </div>
                    <i className="bi bi-calendar-check-fill fs-1 text-warning opacity-25"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header bg-primary text-white">
                <i className="bi bi-activity me-2"></i>Recent Login Activity
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogins.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No login activity today
                        </td>
                      </tr>
                    ) : (
                      recentLogins.map((r) => (
                        <tr key={r._id}>
                          <td>{r.emp_id}</td>
                          <td>{r.full_name}</td>
                          <td>{r.log_date}</td>
                          <td>{r.time_in || "-"}</td>
                          <td>{r.time_out || "-"}</td>
                          <td>
                            <span
                              className={`badge ${r.status === "Online" ? "bg-success" : "bg-secondary"}`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
