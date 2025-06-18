const express = require("express");
const Merchant = require("../../models/Merchant");
const authenticate = require("../../middlewares/auth");
const router = express.Router();

router.post("/merchants", authenticate, async (req, res) => {
  try {
    const newMerchant = new Merchant(req.body);
    await newMerchant.save();
    res.status(201).json({ message: "Merchant saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving merchant", error });
  }
});

router.get("/getmerchants", authenticate, async (req, res) => {
  try {
    const merchants = await Merchant.find();
    res.json(merchants);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving merchants", error });
  }
});

router.put("/merchants/:id/disable", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await Merchant.findById(id);
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });

    merchant.disabled = !merchant.disabled;
    await merchant.save();

    res.status(200).json({ message: "Merchant status updated", merchant });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error });
  }
});

router.delete("/merchants/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await Merchant.findByIdAndDelete(id);
    res.status(200).json({ message: "Merchant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting merchant", error });
  }
});

module.exports = router;
