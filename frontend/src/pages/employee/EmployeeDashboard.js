import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../utils/api";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaveData, setLeaveData] = useState({
    leave_balance: 0,
    requests: [],
  });
  const [leaveForm, setLeaveForm] = useState({
    leave_date: new Date().toISOString().split("T")[0],
    reason: "",
    comments: "",
  });
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const { data } = await API.get("https://eams-zfwj.onrender.com/api/attendance/today-status");
      setTodayStatus(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await API.get("https://eams-zfwj.onrender.com/api/attendance/my");
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLeaveData = useCallback(async () => {
    try {
      const { data } = await API.get("https://eams-zfwj.onrender.com/api/employees/leave-requests/my");
      setLeaveData(data);
      setEmployee((currentEmployee) => {
        const nextEmployee = {
          ...currentEmployee,
          leave_balance: data.leave_balance,
        };
        localStorage.setItem("user", JSON.stringify(nextEmployee));
        return nextEmployee;
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTodayStatus(), fetchHistory(), fetchLeaveData()]).finally(
      () => setLoading(false),
    );
    const clockInterval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, [fetchTodayStatus, fetchHistory, fetchLeaveData]);

  const handleTimeIn = async () => {
    setActionLoading(true);
    try {
      const { data } = await API.post("https://eams-zfwj.onrender.com/api/attendance/time-in");
      toast.success(data.message + (data.is_late ? " (You are late)" : ""));
      await fetchTodayStatus();
      await fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Clock-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimeOut = async () => {
    setActionLoading(true);
    try {
      const { data } = await API.post("https://eams-zfwj.onrender.com/api/attendance/time-out");
      toast.success(`${data.message} — Worked ${data.work_hours}h`);
      await fetchTodayStatus();
      await fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Clock-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/employee/login");
  };

  const handleLeaveChange = (event) => {
    setLeaveForm({
      ...leaveForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();
    setLeaveSubmitting(true);
    try {
      const { data } = await API.post("https://eams-zfwj.onrender.com/api/employees/leave-requests", leaveForm);
      toast.success(data.message);
      setLeaveForm({
        leave_date: new Date().toISOString().split("T")[0],
        reason: "",
        comments: "",
      });
      await fetchLeaveData();
      await fetchTodayStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Leave application failed");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const getStatusCard = () => {
    if (todayStatus && todayStatus.status === "On Leave") {
      return {
        className: "status-on-leave",
        label: "Approved Leave",
        icon: "bi-calendar2-check",
      };
    }
    if (!todayStatus || todayStatus.status === "Not Logged In") {
      return {
        className: "status-not-started",
        label: "Not Clocked In",
        icon: "bi-clock",
      };
    }
    if (todayStatus.status === "Online") {
      return {
        className: "status-clocked-in",
        label: "Clocked In",
        icon: "bi-person-check",
      };
    }
    return {
      className: "status-clocked-out",
      label: "Clocked Out",
      icon: "bi-person-dash",
    };
  };

  const statusCard = getStatusCard();
  const approvedLeaves = leaveData.requests.filter(
    (request) => request.status === "Approved",
  ).length;
  const pendingLeaves = leaveData.requests.filter(
    (request) => request.status === "Pending",
  ).length;

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav
        className="navbar navbar-dark px-4"
        style={{ background: "linear-gradient(135deg, #00695c, #00897b)" }}
      >
        <span className="navbar-brand">
          <i className="bi bi-person-badge me-2"></i>
          Employee Attendance System
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">
            <i className="bi bi-person-circle me-1"></i>
            {employee.full_name}
            <span className="ms-2 badge bg-light text-dark">
              {employee.emp_id}
            </span>
          </span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {/* Clock */}
        <div className="text-center mb-4">
          <div className="clock-display">{clock.toLocaleTimeString()}</div>
          <div className="text-muted">
            {clock.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success"></div>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div
              className={`attendance-status-card ${statusCard.className} mb-4`}
            >
              <i
                className={`bi ${statusCard.icon} mb-2`}
                style={{ fontSize: "3rem" }}
              ></i>
              <h3 className="mb-1">{statusCard.label}</h3>
              {todayStatus && todayStatus.status === "On Leave" && (
                <p className="mb-0 opacity-75">
                  <i className="bi bi-chat-left-text me-1"></i>
                  {todayStatus.leave_reason}
                </p>
              )}
              {todayStatus && todayStatus.time_in && (
                <p className="mb-0 opacity-75">
                  <i className="bi bi-box-arrow-in-right me-1"></i>Time In:{" "}
                  {todayStatus.time_in}
                  {todayStatus.time_out && (
                    <span className="ms-3">
                      <i className="bi bi-box-arrow-right me-1"></i>Time Out:{" "}
                      {todayStatus.time_out}
                    </span>
                  )}
                </p>
              )}
              {todayStatus && todayStatus.work_hours > 0 && (
                <p className="mb-0 opacity-75 mt-1">
                  <i className="bi bi-clock me-1"></i>Work Hours:{" "}
                  {todayStatus.work_hours}h
                  {todayStatus.overtime_hours > 0 &&
                    ` | Overtime: ${todayStatus.overtime_hours}h`}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <button
                  className="btn btn-success w-100 py-3 fs-5"
                  onClick={handleTimeIn}
                  disabled={
                    actionLoading ||
                    (todayStatus &&
                      (todayStatus.time_in ||
                        todayStatus.status === "On Leave"))
                  }
                >
                  {actionLoading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                  )}
                  Clock In
                </button>
              </div>
              <div className="col-md-6">
                <button
                  className="btn btn-danger w-100 py-3 fs-5"
                  onClick={handleTimeOut}
                  disabled={
                    actionLoading ||
                    !todayStatus ||
                    !todayStatus.time_in ||
                    todayStatus.time_out ||
                    todayStatus.status !== "Online"
                  }
                >
                  {actionLoading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-box-arrow-right me-2"></i>
                  )}
                  Clock Out
                </button>
              </div>
            </div>

            {/* Employee Info */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card p-3 text-center">
                  <div className="text-muted small">Shift</div>
                  <div className="fw-bold fs-5">{employee.shift}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 text-center">
                  <div className="text-muted small">Contract Type</div>
                  <div className="fw-bold fs-5">{employee.contract_type}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 text-center border border-success-subtle">
                  <div className="text-muted small">Leave Balance</div>
                  <div className="fw-bold fs-5 text-success">
                    {leaveData.leave_balance} days
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 text-center">
                  <div className="text-muted small">Late This Month</div>
                  <div className="fw-bold fs-5 text-danger">
                    {
                      history.filter((r) => {
                        const d = new Date(r.log_date);
                        return (
                          d.getMonth() === new Date().getMonth() && r.is_late
                        );
                      }).length
                    }{" "}
                    times
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-lg-5">
                <div className="card leave-card h-100">
                  <div className="card-header leave-card-header">
                    <i className="bi bi-calendar-plus me-2"></i>Apply Leave
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center leave-balance-banner mb-3">
                      <div>
                        <div className="small text-muted">Available Leave</div>
                        <div className="fs-4 fw-bold text-success">
                          {leaveData.leave_balance} days
                        </div>
                      </div>
                      <div className="text-end small text-muted">
                        <div>{pendingLeaves} pending</div>
                        <div>{approvedLeaves} approved</div>
                      </div>
                    </div>

                    <form onSubmit={handleLeaveSubmit}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Select Date
                        </label>
                        <input
                          type="date"
                          name="leave_date"
                          className="form-control"
                          min={new Date().toISOString().split("T")[0]}
                          value={leaveForm.leave_date}
                          onChange={handleLeaveChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Reason</label>
                        <input
                          type="text"
                          name="reason"
                          className="form-control"
                          value={leaveForm.reason}
                          onChange={handleLeaveChange}
                          placeholder="e.g. Personal leave, Medical appointment"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Comments
                        </label>
                        <textarea
                          name="comments"
                          className="form-control"
                          rows="4"
                          value={leaveForm.comments}
                          onChange={handleLeaveChange}
                          placeholder="Add details for admin review"
                        />
                      </div>
                      <div className="small text-muted mb-3">
                        Leave can be availed only after admin approval. Each
                        approved leave deducts 1 day from your balance.
                      </div>
                      <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={
                          leaveSubmitting || leaveData.leave_balance <= 0
                        }
                      >
                        {leaveSubmitting ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="bi bi-send-check me-2"></i>
                        )}
                        Submit Leave Request
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card h-100">
                  <div className="card-header leave-card-header d-flex justify-content-between">
                    <span>
                      <i className="bi bi-journal-text me-2"></i>Leave Request
                      History
                    </span>
                    <small>Latest requests first</small>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Reason</th>
                            <th>Comments</th>
                            <th>Status</th>
                            <th>Admin Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveData.requests.length === 0 ? (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center text-muted py-4"
                              >
                                No leave requests yet
                              </td>
                            </tr>
                          ) : (
                            leaveData.requests.map((request) => (
                              <tr key={request._id}>
                                <td>{request.leave_date}</td>
                                <td>{request.reason}</td>
                                <td>{request.comments || "-"}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      request.status === "Approved"
                                        ? "bg-success"
                                        : request.status === "Rejected"
                                          ? "bg-danger"
                                          : "bg-warning text-dark"
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                </td>
                                <td>{request.admin_comments || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance History */}
            <div className="card">
              <div
                className="card-header"
                style={{ background: "#00695c", color: "white" }}
              >
                <i className="bi bi-clock-history me-2"></i>My Attendance
                History
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Work Hours</th>
                        <th>Late</th>
                        <th>Overtime</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-muted py-4"
                          >
                            No attendance records yet
                          </td>
                        </tr>
                      ) : (
                        history.map((r) => (
                          <tr key={r._id}>
                            <td>{r.log_date}</td>
                            <td>{r.time_in || "-"}</td>
                            <td>{r.time_out || "-"}</td>
                            <td>{r.work_hours ? `${r.work_hours}h` : "-"}</td>
                            <td>
                              <span
                                className={`badge ${r.is_late ? "bg-warning text-dark" : "bg-success"}`}
                              >
                                {r.is_late ? "Late" : "On Time"}
                              </span>
                            </td>
                            <td>
                              {r.overtime_hours > 0
                                ? `${r.overtime_hours}h`
                                : "-"}
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
