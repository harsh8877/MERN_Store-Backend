const express = require("express");
const Category = require("../../models/Category");
const authenticate = require("../../middlewares/auth");
const router = express.Router();

router.post("/category", authenticate, async (req, res) => {
  try {
    const { name, description, selectedProduct, isActive } = req.body;
    const newCategory = new Category({
      name,
      description,
      selectedProduct,
      isActive,
    });

    await newCategory.save();
    res.json({ success: true, message: "Category added successfully" });
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/getcategory", authenticate, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/category/:id", authenticate, async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

router.delete("/category/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
