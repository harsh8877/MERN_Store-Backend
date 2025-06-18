const express = require("express");
const Contactus = require("../../models/Contactus");
const Seller = require("../../models/Seller");
const authenticate = require("../../middlewares/auth");
const router = express.Router();

router.post("/contactus", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const newContact = new Contactus({ name, email, message });
    await newContact.save();
    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Error saving the message." });
  }
});

router.post("/seller", async (req, res) => {
  try {
    const seller = new Seller(req.body);
    await seller.save();
    res.status(201).send("Seller saved successfully");
  } catch (err) {
    res.status(500).send("Error saving seller");
  }
});

module.exports = router;
