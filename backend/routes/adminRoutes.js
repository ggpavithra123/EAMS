const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { protectAdmin } = require("../middleware/authMiddleware");

// @route POST /api/admin/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        admin_id: admin.admin_id,
        username: admin.username,
        full_name: admin.full_name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route POST /api/admin/seed — seed initial admin (run once)
router.post("/seed", async (req, res) => {
  try {
    const existing = await Admin.findOne({ username: "admin" });
    if (existing) return res.json({ message: "Admin already exists" });

    const admin = new Admin({
      admin_id: "ADM-001",
      username: "admin",
      password: "admin123",
      full_name: "System Administrator",
    });
    await admin.save();
    res.json({ message: "Admin seeded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/admin/leave-requests — admin views leave requests
router.get("/leave-requests", protectAdmin, async (req, res) => {
  try {
    const requests = await Leave.find().sort({
      status: 1,
      leave_date: 1,
      createdAt: -1,
    });

    const summary = {
      pending: requests.filter((request) => request.status === "Pending")
        .length,
      approved: requests.filter((request) => request.status === "Approved")
        .length,
      rejected: requests.filter((request) => request.status === "Rejected")
        .length,
    };

    res.json({ requests, summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route PATCH /api/admin/leave-requests/:id — admin approves or rejects leave
router.patch("/leave-requests/:id", protectAdmin, async (req, res) => {
  const { status, admin_comments } = req.body;

  try {
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected",
      });
    }

    const leaveRequest = await Leave.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending leave requests can be processed",
      });
    }

    if (status === "Approved") {
      const employee = await Employee.findById(leaveRequest.employee_id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (typeof employee.leave_balance !== "number") {
        employee.leave_balance = 10;
      }

      if (employee.leave_balance <= 0) {
        return res.status(400).json({
          message: "Employee has no leave balance remaining",
        });
      }

      employee.leave_balance -= 1;
      await employee.save();
    }

    leaveRequest.status = status;
    leaveRequest.admin_comments = admin_comments?.trim() || "";
    leaveRequest.reviewed_by = req.admin._id;
    leaveRequest.reviewed_at = new Date();
    await leaveRequest.save();

    const updatedEmployee = await Employee.findById(
      leaveRequest.employee_id,
    ).select("leave_balance");

    res.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      request: leaveRequest,
      leave_balance:
        typeof updatedEmployee?.leave_balance === "number"
          ? updatedEmployee.leave_balance
          : 10,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
