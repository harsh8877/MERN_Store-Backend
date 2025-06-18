const express = require("express");
const router = express.Router();
const Signup = require("../../models/Signup");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/reset-password", async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  const headerToken = req.headers.authorization;
  const userToken = headerToken.split(" ")[1];

  const hashedToken = crypto
    .createHash("sha256")
    .update(token ?? userToken)
    .digest("hex");

  try {
    if (userToken) {
      const verifyToken = jwt.verify(userToken, process.env.JWT_SECRET);
      console.log(verifyToken);

      const user = await Signup.findOne({
        _id: verifyToken.userId.toString(),
      });

      console.log("user=>", user);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(200).json({ message: "Password reset successfully" });
    } else {
      const user = await Signup.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      console.log("user", user);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(200).json({ message: "Password reset successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
