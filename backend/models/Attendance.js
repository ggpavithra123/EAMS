const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    at_log_id: { type: String, unique: true },
    emp_id: { type: String, required: true },
    full_name: { type: String },
    log_date: { type: String, required: true },
    time_in: { type: String, default: null },
    time_out: { type: String, default: null },
    is_late: { type: Boolean, default: false },
    under_time: { type: Boolean, default: false },
    overtime_hours: { type: Number, default: 0 },
    work_hours: { type: Number, default: 0 },
    status: { type: String, enum: ["Online", "Offline"], default: "Offline" },
  },
  { timestamps: true },
);

attendanceSchema.pre("save", function (next) {
  if (!this.at_log_id) {
    this.at_log_id = `ATL-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);
