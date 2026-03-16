import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";

function LoginReport() {
  const [data, setData] = useState({ records: [], online_count: 0, date: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await API.get("https://eams-zfwj.onrender.com/api/attendance/login-report");
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const exportCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Date",
      "Time In",
      "Time Out",
      "Status",
      "Late",
    ];
    const rows = data.records.map((r) => [
      r.emp_id,
      r.full_name,
      r.log_date,
      r.time_in || "",
      r.time_out || "",
      r.status,
      r.is_late ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `login-report-${data.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Login Report</h5>
            <small className="text-muted">
              Today's login activity — {data.date}
            </small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="online-badge">
              <i
                className="bi bi-circle-fill me-1"
                style={{ color: "#4caf50", fontSize: "0.6rem" }}
              ></i>
              {data.online_count} Currently Online
            </span>
            <button className="btn btn-success btn-sm" onClick={exportCSV}>
              <i className="bi bi-download me-1"></i>Export CSV
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#1a237e" }}
            >
              <div className="text-muted small">Total Logins Today</div>
              <div className="fs-2 fw-bold text-primary">
                {data.records.length}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#4caf50" }}
            >
              <div className="text-muted small">Currently Online</div>
              <div className="fs-2 fw-bold text-success">
                {data.online_count}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#f44336" }}
            >
              <div className="text-muted small">Late Arrivals</div>
              <div className="fs-2 fw-bold text-danger">
                {data.records.filter((r) => r.is_late).length}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <span>
              <i className="bi bi-person-check me-2"></i>Login Activity
            </span>
            <small>Auto-refreshes every 30s</small>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : (
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Late</th>
                    <th>Work Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        No login records for today
                      </td>
                    </tr>
                  ) : (
                    data.records.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <code>{r.emp_id}</code>
                        </td>
                        <td className="fw-semibold">{r.full_name}</td>
                        <td>{r.log_date}</td>
                        <td>{r.time_in || "-"}</td>
                        <td>{r.time_out || "-"}</td>
                        <td>
                          {r.is_late ? (
                            <span className="badge bg-warning text-dark">
                              Late
                            </span>
                          ) : (
                            <span className="badge bg-success">On Time</span>
                          )}
                        </td>
                        <td>{r.work_hours ? `${r.work_hours}h` : "-"}</td>
                        <td>
                          <span
                            className={`badge ${r.status === "Online" ? "bg-success" : "bg-secondary"}`}
                          >
                            <i
                              className={`bi bi-circle-fill me-1`}
                              style={{ fontSize: "0.5rem" }}
                            ></i>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginReport;
