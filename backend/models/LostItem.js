const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    location: {
      type: String,
      required: true,
    },

    image: {
      type: String, // for now just store image path or URL
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    facultyMediator: {
      type: String, // name of faculty (only if student submitted)
    },

    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostItem", lostItemSchema);