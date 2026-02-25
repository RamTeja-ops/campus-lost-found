const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const LostItem = require("../models/LostItem");

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

module.exports = router;