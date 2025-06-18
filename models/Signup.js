const mongoose = require("mongoose");
const { required } = require("../validators/signupValidator");

const signupSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: () => {
        return this.provider !== "email";
      },
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // phone: {
    //   type: String,
    //   required: true,
    // },
    role: {
      type: String,
      enum: ["admin", "merchant", "member"],
      required: true,
      default: "member",
    },
    provider: {
      type: String,
      enum: ["email", "google"],
      default: "google",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // ensures Google users without googleId don't cause unique errors
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Products" }],

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Signup", signupSchema);
