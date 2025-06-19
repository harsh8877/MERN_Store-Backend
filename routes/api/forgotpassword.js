const express = require("express");
const Signup = require("../../models/Signup");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Signup.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
    await user.save();

    const resetURL = `https://mern-store-frontend-seven.vercel.app/reset-password/${resetToken}`;

    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      from: '"Support Team" <support@example.com>',
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Hello ${user.fname},</h3>
        <p>You requested to reset your password.</p>
        <p><a href="${resetURL}">Click here to reset it</a></p>
        <p>If you didn't request this, ignore the email.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewURL = nodemailer.getTestMessageUrl(info);

    res.status(200).json({ message: "Reset email sent", previewURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Signup.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
