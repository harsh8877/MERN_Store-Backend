const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Signup = require("../../models/Signup");

const router = express.Router();

// Start Google login via Auth0
// 1. Redirect user to Auth0 login
router.get(
  "/auth/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  })
);

// Auth0 callback
// 2. Auth0 redirects here after login
router.get(
  "/auth/callback",
  passport.authenticate("auth0", {
    failureRedirect: "/auth/login",
  }),
  async (req, res) => {
    const { name, emails, photos, id } = req.user;

    // Check if emails is valid
    if (!emails || !emails[0]) {
      return res.status(400).json({ message: "Email is missing" });
    }

    // Check or Save to DB
    let user = await Signup.findOne({ email: emails[0].value });
    if (!user) {
      const [fname, ...lnameRest] = name.split(" ");
      const lname = lnameRest.join(" ") || "Unknown";

      // If user doesn't exist, create a new one
      user = new Signup({
        fname,
        lname,
        email: emails[0].value,
        googleId: id,
        picture: photos ? photos[0].value : "", // Optional: Handle missing picture
        provider: "google",
        role: "member",
      });
      await user.save();
    }

    // Issue JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || "member" },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Redirect with token (or send JSON token)
    res.redirect(
      `http://localhost:5173/dashboard/accountdetails?token=${token}`
    );
  }
);

// Return token from redirect
router.get("/success", (req, res) => {
  const token = req.query.token;
  res.json({ token });
});

module.exports = router;
