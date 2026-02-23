const express = require("express");
const router = express.Router();

const LostItem = require("../models/LostItem");
const { protect } = require("../middleware/authMiddleware");

const Message = require("../models/Message");

// ✅ Add Lost Item (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const { itemName, description, location, facultyMediator } = req.body;

    const newItem = await LostItem.create({
      itemName,
      description,
      location,
      facultyMediator,
      submittedBy: req.user._id,
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Get All Lost Items
router.get("/", async (req, res) => {
  try {
    const items = await LostItem.find({ status: "active" })
        .populate("submittedBy", "role name rollNumber");

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Resolve Item (Faculty Only)
router.put("/:id/resolve", protect, async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can resolve items" });
    }

    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
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