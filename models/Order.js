const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: "Not Processed", // default status
        // enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"], // optional enum
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
