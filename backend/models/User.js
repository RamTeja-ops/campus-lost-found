const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["student", "faculty"],
    required: true,
  },

  rollNumber: {
    type: String,
    unique: true,
    sparse: true,
  },

  name: {
    type: String,
    unique: true,
    sparse: true,
  },

  password: {
    type: String,
    required: true,
  },

  points: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);