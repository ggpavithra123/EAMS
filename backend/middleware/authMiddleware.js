const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Employee = require("../models/Employee");

const protectAdmin = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Not authorized as admin" });
      }
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) {
        return res.status(401).json({ message: "Admin account not found" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

const protectEmployee = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "employee") {
        return res.status(403).json({ message: "Not authorized as employee" });
      }
      req.employee = await Employee.findById(decoded.id).select("-password");
      if (!req.employee) {
        return res.status(401).json({ message: "Employee account not found" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = { protectAdmin, protectEmployee };
