import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";

function LeaveManagement() {
  const [data, setData] = useState({
    requests: [],
    summary: { pending: 0, approved: 0, rejected: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data: response } = await API.get("/admin/leave-requests");
      setData(response);
    } catch (error) {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openDecisionModal = (request) => {
    setSelectedRequest(request);
    setAdminComments("");
  };

  const closeDecisionModal = () => {
    if (processing) {
      return;
    }
    setSelectedRequest(null);
    setAdminComments("");
  };

  const handleDecision = async (status) => {
    if (!selectedRequest) {
      return;
    }

    setProcessing(true);
    try {
      const { data: response } = await API.patch(
        `/admin/leave-requests/${selectedRequest._id}`,
        {
          status,
          admin_comments: adminComments,
        },
      );

      toast.success(response.message);
      setSelectedRequest(null);
      setAdminComments("");
      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process leave");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Leave Management</h5>
            <small className="text-muted">
              Review employee leave requests and approve or reject them
            </small>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#fb8c00" }}
            >
              <div className="text-muted small">Pending Requests</div>
              <div className="fs-2 fw-bold text-warning">
                {data.summary.pending}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#2e7d32" }}
            >
              <div className="text-muted small">Approved Requests</div>
              <div className="fs-2 fw-bold text-success">
                {data.summary.approved}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card stat-card p-3"
              style={{ borderLeftColor: "#c62828" }}
            >
              <div className="text-muted small">Rejected Requests</div>
              <div className="fs-2 fw-bold text-danger">
                {data.summary.rejected}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <span>
              <i className="bi bi-calendar2-check me-2"></i>Leave Requests
            </span>
            <small>{data.requests.length} total request(s)</small>
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
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Comments</th>
                      <th>Status</th>
                      <th>Reviewed Comment</th>
                      <th>Applied On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No leave requests yet
                        </td>
                      </tr>
                    ) : (
                      data.requests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <div className="fw-semibold">
                              {request.full_name}
                            </div>
                            <small className="text-muted">
                              {request.emp_id}
                            </small>
                          </td>
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
                          <td>
                            {new Date(request.createdAt).toLocaleString()}
                          </td>
                          <td>
                            {request.status === "Pending" ? (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openDecisionModal(request)}
                              >
                                Review
                              </button>
                            ) : (
                              <span className="text-muted small">
                                Completed
                              </span>
                            )}
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

        {selectedRequest && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-clipboard-check me-2"></i>Review Leave
                    Request
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeDecisionModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <div className="fw-semibold">
                      {selectedRequest.full_name}
                    </div>
                    <small className="text-muted">
                      {selectedRequest.emp_id}
                    </small>
                  </div>
                  <div className="mb-2">
                    <strong>Date:</strong> {selectedRequest.leave_date}
                  </div>
                  <div className="mb-2">
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </div>
                  <div className="mb-3">
                    <strong>Employee Comment:</strong>{" "}
                    {selectedRequest.comments || "-"}
                  </div>
                  <label className="form-label fw-semibold">
                    Admin Comment
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={adminComments}
                    onChange={(event) => setAdminComments(event.target.value)}
                    placeholder="Add approval or rejection comments"
                  />
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={closeDecisionModal}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDecision("Rejected")}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : null}
                    Reject
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleDecision("Approved")}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : null}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveManagement;
