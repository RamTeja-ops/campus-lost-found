const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Signup Controller
const signup = async (req, res) => {
  try {
    const { role, rollNumber, name, password } = req.body;

    // Basic validation
    if (!role || !password) {
      return res.status(400).json({ message: "Role and password are required" });
    }

    if (role === "student" && !rollNumber) {
      return res.status(400).json({ message: "Roll number is required for students" });
    }

    if (role === "faculty" && !name) {
      return res.status(400).json({ message: "Name is required for faculty" });
    }

    // Check if user already exists
    let existingUser;

    if (role === "student") {
      existingUser = await User.findOne({ rollNumber });
    } else {
      existingUser = await User.findOne({ name });
    }

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      role,
      rollNumber,
      name,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",
      userId: newUser._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const jwt = require("jsonwebtoken");

// Login Controller
const login = async (req, res) => {
  try {
    const { role, rollNumber, name, password } = req.body;

    let user;

    if (role === "student") {
      user = await User.findOne({ rollNumber });
    } else if (role === "faculty") {
      user = await User.findOne({ name });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { signup,login };