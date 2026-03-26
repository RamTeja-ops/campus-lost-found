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
    const { date } = req.query;
    const filter = { status: "active" };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.dateFound = { $gte: start, $lt: end };
    }

    const items = await LostItem.find(filter)
      .populate("submittedBy", "role name rollNumber");

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Resolve Item (Faculty Only) + Award Points
router.put('/:id/resolve', protect, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can resolve items' });
    }

    const { foundById } = req.body; // ← who actually found the item

    if (!foundById) {
      return res.status(400).json({ message: 'Please select who found the item' });
    }

    const item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Award points to the selected finder
    const finder = await User.findById(foundById);
    if (finder) {
      const resolvedCount = finder.points > 0
        ? Math.floor(finder.points / 5)
        : 0;
      finder.points += resolvedCount >= 5 ? 10 : 5;
      await finder.save();
    }

    // Delete all messages for this item
    await Message.deleteMany({ item: req.params.id });

    // Mark item resolved
    item.status = 'resolved';
    await item.save();

    res.json({ message: 'Item resolved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;