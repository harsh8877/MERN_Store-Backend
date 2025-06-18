const express = require("express");
const Products = require("../../models/Products");
const authenticate = require("../../middlewares/auth");
const router = express.Router();
const Signup = require("../../models/Signup");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/wishlist/toggle", authenticate, async (req, res) => {
  try {
    // Token Extraction & validation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET); // Use your actual JWT secret
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decoded.userId || decoded.id;

    // Product & User Validation
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "ProductId is required" });
    }

    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await Signup.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.wishlist.findIndex(
      (id) => id.toString() === productId.toString()
    );

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    console.error("Unexpected error:", err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

router.get("/wishlist", async (req, res) => {
  try {
    // Authorization & Token Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extracting & Verifying the token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Extracting userId from the decoded token
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: "User ID missing in token" });
    }

    // Fetching the User and Wishlist
    const user = await Signup.findById(userId).populate("wishlist");
    // .select("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
