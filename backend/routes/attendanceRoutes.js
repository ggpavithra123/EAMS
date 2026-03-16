const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const {
  protectAdmin,
  protectEmployee,
} = require("../middleware/authMiddleware");

// Helper: get today's date string YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split("T")[0];

// Helper: get current time HH:MM:SS
const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false });

// Helper: compute work hours between time_in and time_out
const computeWorkHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;
  const [h1, m1] = timeIn.split(":").map(Number);
  const [h2, m2] = timeOut.split(":").map(Number);
  const diffMins = h2 * 60 + m2 - (h1 * 60 + m1);
  return Math.max(0, parseFloat((diffMins / 60).toFixed(2)));
};

// @route POST /api/attendance/time-in — employee clocks in
router.post("/time-in", protectEmployee, async (req, res) => {
  try {
    const emp_id = req.employee.emp_id;
    const log_date = getTodayDate();

    const approvedLeave = await Leave.findOne({
      employee_id: req.employee._id,
      leave_date: log_date,
      status: "Approved",
    });
    if (approvedLeave) {
      return res.status(400).json({
        message: "You are on approved leave for today",
      });
    }

    let record = await Attendance.findOne({ emp_id, log_date });
    if (record && record.time_in) {
      return res.status(400).json({ message: "Already clocked in today" });
    }

    const employee = await Employee.findOne({ emp_id });
    const shiftStart =
      employee.shift === "Morning"
        ? "08:00:00"
        : employee.shift === "Afternoon"
          ? "14:00:00"
          : "22:00:00";
    const currentTime = getCurrentTime();
    const is_late = currentTime > shiftStart;

    if (!record) {
      record = new Attendance({
        emp_id,
        full_name: employee.full_name,
        log_date,
        time_in: currentTime,
        status: "Online",
        is_late,
      });
    } else {
      record.time_in = currentTime;
      record.status = "Online";
      record.is_late = is_late;
    }

    await record.save();
    res.json({
      message: "Clocked in successfully",
      time_in: currentTime,
      is_late,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route POST /api/attendance/time-out — employee clocks out
router.post("/time-out", protectEmployee, async (req, res) => {
  try {
    const emp_id = req.employee.emp_id;
    const log_date = getTodayDate();

    const record = await Attendance.findOne({ emp_id, log_date });
    if (!record || !record.time_in) {
      return res
        .status(400)
        .json({ message: "No clock-in record found for today" });
    }
    if (record.time_out) {
      return res.status(400).json({ message: "Already clocked out today" });
    }

    const employee = await Employee.findOne({ emp_id });
    const shiftEnd =
      employee.shift === "Morning"
        ? "17:00:00"
        : employee.shift === "Afternoon"
          ? "23:00:00"
          : "06:00:00";
    const currentTime = getCurrentTime();
    const work_hours = computeWorkHours(record.time_in, currentTime);
    const under_time = currentTime < shiftEnd;
    const overtime_hours =
      currentTime > shiftEnd ? computeWorkHours(shiftEnd, currentTime) : 0;

    record.time_out = currentTime;
    record.status = "Offline";
    record.work_hours = work_hours;
    record.under_time = under_time;
    record.overtime_hours = overtime_hours;

    await record.save();
    res.json({
      message: "Clocked out successfully",
      time_out: currentTime,
      work_hours,
      overtime_hours,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/attendance/my — employee views own attendance
router.get("/my", protectEmployee, async (req, res) => {
  try {
    const emp_id = req.employee.emp_id;
    const records = await Attendance.find({ emp_id }).sort({ log_date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/attendance/today-status — employee today status
router.get("/today-status", protectEmployee, async (req, res) => {
  try {
    const emp_id = req.employee.emp_id;
    const log_date = getTodayDate();
    const record = await Attendance.findOne({ emp_id, log_date });

    const approvedLeave = await Leave.findOne({
      employee_id: req.employee._id,
      leave_date: log_date,
      status: "Approved",
    });
    if (approvedLeave && !record) {
      return res.json({
        emp_id,
        log_date,
        status: "On Leave",
        leave_reason: approvedLeave.reason,
      });
    }

    res.json(record || { emp_id, log_date, status: "Not Logged In" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/attendance/login-report — admin: online employees
router.get("/login-report", protectAdmin, async (req, res) => {
  try {
    const log_date = getTodayDate();
    const records = await Attendance.find({ log_date }).sort({ time_in: -1 });
    const online_count = records.filter((r) => r.status === "Online").length;
    res.json({ records, online_count, date: log_date });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/attendance/daily — admin: daily report
router.get("/daily", protectAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const log_date = date || getTodayDate();
    const records = await Attendance.find({ log_date }).sort({ emp_id: 1 });
    res.json({ records, date: log_date });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/attendance/monthly — admin: monthly report
router.get("/monthly", protectAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month
      ? String(month).padStart(2, "0")
      : String(now.getMonth() + 1).padStart(2, "0");
    const targetYear = year || now.getFullYear();
    const prefix = `${targetYear}-${targetMonth}`;

    const records = await Attendance.find({
      log_date: { $regex: `^${prefix}` },
    }).sort({ log_date: 1, emp_id: 1 });
    res.json({ records, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
