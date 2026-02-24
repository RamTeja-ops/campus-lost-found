const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    dateFound: {
      type: Date,
      required: true,
    },

    image: {
      type: String, // will store image filename
      required: true,
    },

    facultyMediator: {
      type: String, // required only if student submits
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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