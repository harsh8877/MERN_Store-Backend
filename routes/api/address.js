const express = require("express");
const Address = require("../../models/Address");
const authenticate = require("../../middlewares/auth");
const router = express.Router();
// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET;

// Address Add Data
router.post("/address", authenticate, async (req, res) => {
  const { address, city, state, country, zipcode, isDefault } = req.body;

  try {
    // const token = req.headers.authorization?.split(" ")[1];

    // if (!token) {
    //   res.status(401).json({ message: "Access denied. No token provided." });
    // }

    // const decoded = jwt.verify(token, JWT_SECRET);
    const userId = req.user.userId;

    const newAddress = new Address({
      address,
      city,
      state,
      country,
      zipcode,
      isDefault,
      userId, // Associate address with user
    });
    await newAddress.save();
    res
      .status(201)
      .json({ success: true, message: "Address added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to add address." });
  }
});

router.get("/getaddress", authenticate, async (req, res) => {
  try {
    // const token = req.headers.authorization?.split(" ")[1];

    // if (!token) {
    //   return res
    //     .status(401)
    //     .json({ message: "Access denied. No token provided." });
    // }

    // const decoded = jwt.verify(token, JWT_SECRET);
    const userId = req.user.userId;

    const address = await Address.find({ userId });
    res.status(200).json(address);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve address" });
  }
});

router.put("/address/:id", authenticate, async (req, res) => {
  try {
    const updated = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
    res.json({ success: true, updated });
  } catch (error) {
    resconsole.error("Update Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update address", error });
  }
});

router.delete("/address/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAddress = await Address.findByIdAndDelete(id);
    if (deletedAddress) {
      return res.json({
        success: true,
        message: "Address deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete address" });
  }
});

module.exports = router;
