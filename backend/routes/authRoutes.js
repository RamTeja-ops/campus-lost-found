const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const bcrypt = require('bcryptjs');

router.post("/signup", signup);
router.post("/login", login);

// ✅ Rankings endpoint
router.get("/rankings", protect, async (req, res) => {
  try {
    const users = await User.find({ points: { $gt: 0 } })
      .select("name rollNumber role points")
      .sort({ points: -1 });

    // For each user, count how many items they resolved
    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const resolvedCount = await LostItem.countDocuments({
          submittedBy: user._id,
          status: "resolved",
        });
        return {
          _id: user._id,
          name: user.name,
          rollNumber: user.rollNumber,
          role: user.role,
          points: user.points,
          resolvedCount,
        };
      })
    );

    res.json(usersWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/my-contributions
router.get('/my-contributions', protect, async (req, res) => {
  try {
    const items = await LostItem.find({
      submittedBy: req.user.id,
      status: 'resolved'
    }).sort({ updatedAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile / change password
router.put('/profile', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;