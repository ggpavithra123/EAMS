import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";

function DailyAttendanceReport() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/attendance/daily?date=${date}`);
      setRecords(data.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const exportCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Date",
      "Time In",
      "Time Out",
      "Late",
      "Under Time",
      "Work Hours",
      "Overtime",
      "Status",
    ];
    const rows = records.map((r) => [
      r.emp_id,
      r.full_name,
      r.log_date,
      r.time_in || "",
      r.time_out || "",
      r.is_late ? "Yes" : "No",
      r.under_time ? "Yes" : "No",
      r.work_hours,
      r.overtime_hours,
      r.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-attendance-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalWorkHours = records
    .reduce((sum, r) => sum + (r.work_hours || 0), 0)
    .toFixed(2);
  const lateCount = records.filter((r) => r.is_late).length;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Daily Attendance Report</h5>
            <small className="text-muted">
              View attendance for a specific date
            </small>
          </div>
          <button className="btn btn-success btn-sm" onClick={exportCSV}>
            <i className="bi bi-download me-1"></i>Export CSV
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex align-items-center gap-3">
            <label className="fw-semibold mb-0">Select Date:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: 200 }}
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#1a237e" }}
            >
              <div className="text-muted small">Total Present</div>
              <div className="fs-2 fw-bold text-primary">{records.length}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#f44336" }}
            >
              <div className="text-muted small">Late Arrivals</div>
              <div className="fs-2 fw-bold text-danger">{lateCount}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#4caf50" }}
            >
              <div className="text-muted small">Total Work Hours</div>
              <div className="fs-2 fw-bold text-success">{totalWorkHours}h</div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#ff9800" }}
            >
              <div className="text-muted small">Currently Online</div>
              <div className="fs-2 fw-bold text-warning">
                {records.filter((r) => r.status === "Online").length}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-primary text-white">
            <i className="bi bi-calendar-day me-2"></i>
            Attendance for{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Late</th>
                      <th>Under Time</th>
                      <th>Work Hours</th>
                      <th>Overtime</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <code>{r.emp_id}</code>
                          </td>
                          <td className="fw-semibold">{r.full_name}</td>
                          <td>{r.time_in || "-"}</td>
                          <td>{r.time_out || "-"}</td>
                          <td>
                            <span
                              className={`badge ${r.is_late ? "bg-warning text-dark" : "bg-success"}`}
                            >
                              {r.is_late ? "Late" : "On Time"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${r.under_time ? "bg-danger" : "bg-success"}`}
                            >
                              {r.under_time ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>{r.work_hours ? `${r.work_hours}h` : "-"}</td>
                          <td>
                            {r.overtime_hours ? `${r.overtime_hours}h` : "-"}
                          </td>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyAttendanceReport;
