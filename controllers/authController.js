const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Register admin without password encryption
const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    // Create a new admin with plain text password
    admin = new Admin({ username, email, password, role: "admin" });
    await admin.save();

    res.status(201).json({ msg: "Admin registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login with JWT token generation
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find admin by email
    let admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Compare plain text passwords
    if (password !== admin.password) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Generate JWT token
    const payload = { admin: { id: admin.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = { register, login };
