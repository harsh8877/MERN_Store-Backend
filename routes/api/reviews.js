const express = require("express");
const Review = require("../../models/Review");
const authenticate = require("../../middlewares/auth");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/addreview", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { product, title, comment, rating, recommend } = req.body;

    const review = new Review({
      product,
      title,
      comment,
      rating,
      recommend,
      user: userId,
    });

    await review.save();
    res.status(201).json({ message: "Review added successfully" });
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err });
  }
});

router.get("/getreviews", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const reviews = await Review.find({ user: userId });
    res.json(reviews);
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error });
  }
});

router.delete("/deletereviews/:id", authenticate, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error });
  }
});

module.exports = router;
