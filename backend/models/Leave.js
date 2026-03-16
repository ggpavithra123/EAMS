const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    leave_id: { type: String, unique: true },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    emp_id: { type: String, required: true },
    full_name: { type: String, required: true },
    leave_date: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    comments: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    admin_comments: { type: String, default: "", trim: true },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: true },
);

leaveSchema.index({ employee_id: 1, leave_date: 1 }, { unique: true });

leaveSchema.pre("save", function (next) {
  if (!this.leave_id) {
    this.leave_id = `LEV-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model("Leave", leaveSchema);
