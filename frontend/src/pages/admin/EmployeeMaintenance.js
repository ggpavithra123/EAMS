import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import API from "../../utils/api";
import { toast } from "react-toastify";

const INITIAL_FORM = {
  emp_id: "",
  password: "",
  full_name: "",
  address: "",
  contact_number: "",
  email_address: "",
  contract_type: "Full-Time",
  shift: "Morning",
  leave_balance: 10,
};

function EmployeeMaintenance() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const { data } = await API.get("https://eams-zfwj.onrender.com/api/employees");
      setEmployees(data);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setEditMode(false);
    setSelectedId(null);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setForm({
      emp_id: emp.emp_id,
      password: "",
      full_name: emp.full_name,
      address: emp.address,
      contact_number: emp.contact_number,
      email_address: emp.email_address,
      contract_type: emp.contract_type,
      shift: emp.shift,
      leave_balance: emp.leave_balance,
    });
    setEditMode(true);
    setSelectedId(emp._id);
    setShowModal(true);
  };

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "leave_balance"
          ? e.target.value === ""
            ? ""
            : Number(e.target.value)
          : e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editMode) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await API.put(`/employees/${selectedId}`, payload);
        toast.success("Employee updated successfully");
      } else {
        await API.post("/employees", form);
        toast.success("Employee created successfully");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete employee "${name}"? This cannot be undone.`))
      return;
    try {
      await API.delete(`/employees/${id}`);
      toast.success("Employee deleted");
      fetchEmployees();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email_address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="main-content flex-grow-1">
        <div className="top-bar">
          <div>
            <h5 className="mb-0 fw-bold">Employee Maintenance</h5>
            <small className="text-muted">Manage all employee records</small>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-person-plus me-2"></i>Add Employee
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="mb-3">
              <div className="input-group" style={{ maxWidth: 350 }}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Contract</th>
                      <th>Shift</th>
                      <th>Leave Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <code>{emp.emp_id}</code>
                          </td>
                          <td className="fw-semibold">{emp.full_name}</td>
                          <td>{emp.email_address}</td>
                          <td>{emp.contact_number}</td>
                          <td>
                            <span className="badge bg-info text-dark">
                              {emp.contract_type}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {emp.shift}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {emp.leave_balance} days
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${emp.is_active ? "bg-success" : "bg-danger"}`}
                            >
                              {emp.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => openEdit(emp)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(emp._id, emp.full_name)
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
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

        {/* Modal */}
        {showModal && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i
                      className={`bi ${editMode ? "bi-pencil" : "bi-person-plus"} me-2`}
                    ></i>
                    {editMode ? "Edit Employee" : "Add New Employee"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Employee ID *
                        </label>
                        <input
                          name="emp_id"
                          className="form-control"
                          value={form.emp_id}
                          onChange={handleChange}
                          required
                          disabled={editMode}
                          placeholder="e.g. EMP-001"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Password{" "}
                          {editMode && (
                            <small className="text-muted">
                              (leave blank to keep current)
                            </small>
                          )}
                        </label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          value={form.password}
                          onChange={handleChange}
                          required={!editMode}
                          placeholder="Enter password"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Full Name *
                        </label>
                        <input
                          name="full_name"
                          className="form-control"
                          value={form.full_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email_address"
                          className="form-control"
                          value={form.email_address}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Contact Number *
                        </label>
                        <input
                          name="contact_number"
                          className="form-control"
                          value={form.contact_number}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Address *
                        </label>
                        <input
                          name="address"
                          className="form-control"
                          value={form.address}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Contract Type
                        </label>
                        <select
                          name="contract_type"
                          className="form-select"
                          value={form.contract_type}
                          onChange={handleChange}
                        >
                          <option>Full-Time</option>
                          <option>Part-Time</option>
                          <option>Contract</option>
                          <option>Intern</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Shift</label>
                        <select
                          name="shift"
                          className="form-select"
                          value={form.shift}
                          onChange={handleChange}
                        >
                          <option>Morning</option>
                          <option>Afternoon</option>
                          <option>Night</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Leave Balance
                        </label>
                        <input
                          type="number"
                          min="0"
                          name="leave_balance"
                          className="form-control"
                          value={form.leave_balance}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                      ) : null}
                      {editMode ? "Update Employee" : "Create Employee"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeMaintenance;
