const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Admin = require("./models/Admin");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eams";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const existing = await Admin.findOne({ username: "admin" });
    if (existing) {
      console.log("Admin already exists. Username: admin, Password: admin123");
      process.exit(0);
    }

    const admin = new Admin({
      admin_id: "ADM-001",
      username: "admin",
      password: "admin123",
      full_name: "System Administrator",
    });

    await admin.save();
    console.log("Admin seeded successfully!");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
