const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
  {
    emp_id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: { type: String, required: true },
    address: { type: String, required: true },
    contact_number: { type: String, required: true },
    email_address: { type: String, required: true, unique: true },
    contract_type: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
      default: "Full-Time",
    },
    shift: {
      type: String,
      enum: ["Morning", "Afternoon", "Night"],
      default: "Morning",
    },
    leave_balance: { type: Number, default: 10, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);
