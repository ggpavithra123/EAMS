const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const {
  protectAdmin,
  protectEmployee,
} = require("../middleware/authMiddleware");

const getTodayDate = () => new Date().toISOString().split("T")[0];
const getLeaveBalance = (employee) =>
  typeof employee.leave_balance === "number" ? employee.leave_balance : 10;

// @route POST /api/employees/login
router.post("/login", async (req, res) => {
  const { emp_id, password } = req.body;
  try {
    const employee = await Employee.findOne({ emp_id, is_active: true });
    if (!employee)
      return res.status(401).json({ message: "Invalid credentials" });

    if (typeof employee.leave_balance !== "number") {
      employee.leave_balance = 10;
      await employee.save();
    }

    const isMatch = await employee.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee._id, role: "employee", emp_id: employee.emp_id },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.json({
      token,
      employee: {
        id: employee._id,
        emp_id: employee.emp_id,
        full_name: employee.full_name,
        shift: employee.shift,
        contract_type: employee.contract_type,
        leave_balance: getLeaveBalance(employee),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/employees/leave-requests/my — employee views leave requests
router.get("/leave-requests/my", protectEmployee, async (req, res) => {
  try {
    const requests = await Leave.find({ employee_id: req.employee._id }).sort({
      leave_date: -1,
      createdAt: -1,
    });

    res.json({
      leave_balance: getLeaveBalance(req.employee),
      requests,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route POST /api/employees/leave-requests — employee applies for leave
router.post("/leave-requests", protectEmployee, async (req, res) => {
  const { leave_date, reason, comments } = req.body;

  try {
    if (!leave_date || !reason?.trim()) {
      return res.status(400).json({
        message: "Leave date and reason are required",
      });
    }

    if (leave_date < getTodayDate()) {
      return res.status(400).json({
        message: "Leave can only be applied for today or a future date",
      });
    }

    if (getLeaveBalance(req.employee) <= 0) {
      return res.status(400).json({
        message: "No leave balance remaining",
      });
    }

    const existingRequest = await Leave.findOne({
      employee_id: req.employee._id,
      leave_date,
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "A leave request already exists for that date",
      });
    }

    const leaveRequest = new Leave({
      employee_id: req.employee._id,
      emp_id: req.employee.emp_id,
      full_name: req.employee.full_name,
      leave_date,
      reason: reason.trim(),
      comments: comments?.trim() || "",
    });

    await leaveRequest.save();

    res.status(201).json({
      message: "Leave request submitted for admin approval",
      request: leaveRequest,
      leave_balance: getLeaveBalance(req.employee),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A leave request already exists for that date",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/employees — get all employees (admin only)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const employees = await Employee.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/employees/:id
router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route POST /api/employees — create employee (admin only)
router.post("/", protectAdmin, async (req, res) => {
  const {
    emp_id,
    password,
    full_name,
    address,
    contact_number,
    email_address,
    contract_type,
    shift,
    leave_balance,
  } = req.body;
  try {
    const parsedLeaveBalance =
      leave_balance === undefined || leave_balance === ""
        ? 10
        : Number(leave_balance);

    const existing = await Employee.findOne({
      $or: [{ emp_id }, { email_address }],
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Employee ID or email already exists" });

    const employee = new Employee({
      emp_id,
      password,
      full_name,
      address,
      contact_number,
      email_address,
      contract_type,
      shift,
      leave_balance: Number.isNaN(parsedLeaveBalance) ? 10 : parsedLeaveBalance,
    });
    await employee.save();
    res.status(201).json({
      message: "Employee created successfully",
      emp_id: employee.emp_id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route PUT /api/employees/:id — update employee (admin only)
router.put("/:id", protectAdmin, async (req, res) => {
  const {
    full_name,
    address,
    contact_number,
    email_address,
    contract_type,
    shift,
    is_active,
    password,
    leave_balance,
  } = req.body;
  try {
    const parsedLeaveBalance =
      leave_balance === undefined || leave_balance === ""
        ? undefined
        : Number(leave_balance);

    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    employee.full_name = full_name || employee.full_name;
    employee.address = address || employee.address;
    employee.contact_number = contact_number || employee.contact_number;
    employee.email_address = email_address || employee.email_address;
    employee.contract_type = contract_type || employee.contract_type;
    employee.shift = shift || employee.shift;
    if (!Number.isNaN(parsedLeaveBalance) && parsedLeaveBalance !== undefined) {
      employee.leave_balance = parsedLeaveBalance;
    }
    if (typeof is_active !== "undefined") employee.is_active = is_active;
    if (password) employee.password = password;

    await employee.save();
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route DELETE /api/employees/:id — delete employee (admin only)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
