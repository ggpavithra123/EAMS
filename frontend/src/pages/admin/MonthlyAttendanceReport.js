import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";

function MonthlyAttendanceReport() {
  const now = new Date();
  const [month, setMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState(String(now.getFullYear()));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `https://eams-zfwj.onrender.com/api/attendance/monthly?month=${month}&year=${year}`,
      );
      setRecords(data.records);

      // Build per-employee summary
      const emp_summary = {};
      data.records.forEach((r) => {
        if (!emp_summary[r.emp_id]) {
          emp_summary[r.emp_id] = {
            emp_id: r.emp_id,
            full_name: r.full_name,
            days_present: 0,
            late_count: 0,
            total_work_hours: 0,
            total_overtime: 0,
          };
        }
        emp_summary[r.emp_id].days_present += 1;
        emp_summary[r.emp_id].late_count += r.is_late ? 1 : 0;
        emp_summary[r.emp_id].total_work_hours += r.work_hours || 0;
        emp_summary[r.emp_id].total_overtime += r.overtime_hours || 0;
      });
      setSummary(emp_summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const exportCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Days Present",
      "Late Count",
      "Total Work Hours",
      "Total Overtime",
    ];
    const rows = Object.values(summary).map((s) => [
      s.emp_id,
      s.full_name,
      s.days_present,
      s.late_count,
      s.total_work_hours.toFixed(2),
      s.total_overtime.toFixed(2),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-attendance-${year}-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - i,
  );
  const summaryArr = Object.values(summary);

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Monthly Attendance Report</h5>
            <small className="text-muted">
              {monthNames[parseInt(month) - 1]} {year} — {records.length}{" "}
              records
            </small>
          </div>
          <button className="btn btn-success btn-sm" onClick={exportCSV}>
            <i className="bi bi-download me-1"></i>Export CSV
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex align-items-center gap-3">
            <label className="fw-semibold mb-0">Month:</label>
            <select
              className="form-select"
              style={{ width: 160 }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
            <label className="fw-semibold mb-0">Year:</label>
            <select
              className="form-select"
              style={{ width: 110 }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#1a237e" }}
            >
              <div className="text-muted small">Unique Employees</div>
              <div className="fs-2 fw-bold text-primary">
                {summaryArr.length}
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#4caf50" }}
            >
              <div className="text-muted small">Total Attendance Records</div>
              <div className="fs-2 fw-bold text-success">{records.length}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#f44336" }}
            >
              <div className="text-muted small">Total Late Instances</div>
              <div className="fs-2 fw-bold text-danger">
                {summaryArr.reduce((s, e) => s + e.late_count, 0)}
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#ff9800" }}
            >
              <div className="text-muted small">Total Work Hours</div>
              <div className="fs-2 fw-bold text-warning">
                {summaryArr
                  .reduce((s, e) => s + e.total_work_hours, 0)
                  .toFixed(1)}
                h
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-primary text-white">
            <i className="bi bi-calendar-month me-2"></i>
            Employee Summary — {monthNames[parseInt(month) - 1]} {year}
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
                      <th>Days Present</th>
                      <th>Late Instances</th>
                      <th>Total Work Hours</th>
                      <th>Total Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryArr.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No attendance data for this period
                        </td>
                      </tr>
                    ) : (
                      summaryArr.map((s) => (
                        <tr key={s.emp_id}>
                          <td>
                            <code>{s.emp_id}</code>
                          </td>
                          <td className="fw-semibold">{s.full_name}</td>
                          <td>
                            <span className="badge bg-primary">
                              {s.days_present} days
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${s.late_count > 0 ? "bg-warning text-dark" : "bg-success"}`}
                            >
                              {s.late_count}
                            </span>
                          </td>
                          <td>{s.total_work_hours.toFixed(2)}h</td>
                          <td>{s.total_overtime.toFixed(2)}h</td>
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

export default MonthlyAttendanceReport;
