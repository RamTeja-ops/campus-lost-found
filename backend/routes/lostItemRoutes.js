const express = require("express");
const router = express.Router();

const LostItem = require("../models/LostItem");
const { protect } = require("../middleware/authMiddleware");

const Message = require("../models/Message");
const User = require("../models/User");

const upload = require("../config/multer");

// ✅ Add Lost Item (Protected)
router.post(
  "/",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      const { itemName, description, location, dateFound, facultyMediator } =
        req.body;

      // Validate required fields
      if (!itemName || !description || !location || !dateFound) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // If student submits → facultyMediator required
      if (req.user.role === "student" && !facultyMediator) {
        return res.status(400).json({
          message: "Faculty mediator is required for students",
        });
      }

      // Image required
      if (!req.file) {
        return res.status(400).json({
          message: "Image is required",
        });
      }

      const newItem = new LostItem({
        itemName,
        description,
        location,
        dateFound,
        facultyMediator:
          req.user.role === "student" ? facultyMediator : null,
        image: req.file.filename,
        submittedBy: req.user._id,
      });

      const savedItem = await newItem.save();

      res.status(201).json(savedItem);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get All Active Lost Items
router.get("/", async (req, res) => {
  try {
    const items = await LostItem.find({ status: "active" })
      .populate("submittedBy", "role name rollNumber");

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Resolve Item (Faculty Only) + Award Points
router.put("/:id/resolve", protect, async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can resolve items" });
    }

    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // ── Award points to the person who submitted the item ──
    const submitter = await User.findById(item.submittedBy);

    if (submitter) {
      // Count how many items this user has resolved so far
      const resolvedCount = await LostItem.countDocuments({
        submittedBy: submitter._id,
        status: "resolved",
      });

      // 1st to 5th resolved → 5 points, 6th onwards → 10 points
      const pointsToAdd = resolvedCount < 5 ? 5 : 10;

      submitter.points = (submitter.points || 0) + pointsToAdd;
      await submitter.save();
    }

    // 🧹 Delete all messages related to this item
    await Message.deleteMany({ item: item._id });

    // Mark item resolved
    item.status = "resolved";
    await item.save();

    res.json({ message: "Item resolved and chat deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;