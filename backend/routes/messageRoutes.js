const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const LostItem = require("../models/LostItem");
const { protect } = require("../middleware/authMiddleware");


// ✅ Send Message (Protected)
router.post("/:itemId", protect, async (req, res) => {
  try {
    const { text } = req.body;

    // Check if item exists
    const item = await LostItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Optional: prevent chat if resolved
    if (item.status === "resolved") {
      return res.status(400).json({ message: "Item already resolved" });
    }

    const message = await Message.create({
      item: item._id,
      sender: req.user._id,
      text,
    });

    res.status(201).json(message);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ✅ Get Messages for an Item
router.get("/:itemId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ item: req.params.itemId })
      .populate("sender", "role name rollNumber")
      .sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;