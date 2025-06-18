const express = require("express");
const Brands = require("../../models/Brands");
const authenticate = require("../../middlewares/auth");
const router = express.Router();

router.post("/brand", authenticate, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    // Basic validation (optional)
    if (!name || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Name and description are required" });
    }

    // Create a new brand instance
    const newBrand = new Brands({
      name,
      description,
      isActive: isActive || false,
    });

    // Save the brand to the database
    await newBrand.save();

    res.status(200).json({
      success: true,
      message: "Brand added successfully",
      brand: newBrand,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding brand",
    });
  }
});

router.get("/getbrand", authenticate, async (req, res) => {
  try {
    const brands = await Brands.find();
    res.status(200).json(brands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching brands." });
  }
});

router.put("/brand/:id", authenticate, async (req, res) => {
  const { name, description, isActive } = req.body;
  const { id } = req.params;

  try {
    const updatedBrand = await Brands.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Brand updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating brand" });
  }
});

router.delete("/brand/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBrand = await Brands.findByIdAndDelete(id);

    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Brand deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting brand" });
  }
});

module.exports = router;
