const express = require("express");
const Signup = require("../../models/Signup");
const router = express.Router();
const jwt = require("jsonwebtoken");

// server/routes/saveGoogleUser.js
router.post("/save-google-user", async (req, res) => {
  try {
    const { name, email, password, sub } = req.body;

    if (!email || !sub) {
      return res.status(400).json({ message: "Missing email or Google ID" });
    }

    let user = await Signup.findOne({ email });

    if (!user) {
      const [fname, ...lnameParts] = name.split(" ");
      const lname = lnameParts.join(" ") || "Unknown";

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      user = new Signup({
        fname,
        lname,
        email,
        password: hashedPassword,
        googleId: sub,
        // picture,
        provider: "google",
        role: "member",
      });

      await user.save();
    }

    // Optional: generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "member",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "User saved", token, role: user.role });
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getuser", async (req, res) => {
  const authHeader = req.headers.authorization;

  // 1. Check if token is provided
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token not provided" });
  }

  // 2. Extract token from header
  const token = authHeader.split(" ")[1];

  try {
    // 3. Decode token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your actual secret key

    // 4. Get user from database
    const user = await Signup.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. Send user info (including role)
    res.status(200).json(user);
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

router.get("/getusers", async (req, res) => {
  try {
    const users = await Signup.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
});

// router.get(
//   "/login",
//   passport.authenticate("auth0", {
//     scope: "openid email profile",
//   }),
//   (req, res) => {
//     res.redirect("/");
//   }
// );

// router.get("/callback", (req, res, next) => {
//   passport.authenticate("auth0", (err, user, info) => {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return res.redirect("/login");
//     }
//     req.logIn(user, (err) => {
//       if (err) {
//         return next(err);
//       }
//       const returnTo = req.session.returnTo;
//       delete req.session.returnTo;
//       res.redirect(returnTo || "/");
//     });
//   })(req, res, next);
// });

// Logout route
// router.get("/logout", (req, res) => {
//   req.logOut();

//   let returnTo = req.protocol + "://" + req.hostname;
//   const port = req.connection.localPort;

//   if (port !== undefined && port !== 80 && port !== 443) {
//     returnTo =
//       process.env.NODE_ENV === "production"
//         ? `${returnTo}/`
//         : `${returnTo}:${port}/`;
//   }

//   const logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);

//   const searchString = querystring.stringify({
//     client_id: process.env.AUTH0_CLIENT_ID,
//     returnTo: returnTo,
//   });
//   logoutURL.search = searchString;

//   res.redirect(logoutURL);
// });

module.exports = router;
