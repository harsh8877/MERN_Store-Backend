const express = require("express");
const Signup = require("../../models/Signup");
// const { authenticate } = require("passport");
const router = express.Router();

router.get("/getuser/:email", async (req, res) => {
  // const { email } = req.params;

  try {
    const email = req.params.email;
    const user = await Signup.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/updateuser/:email", async (req, res) => {
  try {
    console.log("Update Request Body:", req.body); // Log request body
    const email = req.params.email;
    const { fname, lname, phone } = req.body;

    const updatedUser = await Signup.findOneAndUpdate(
      { email },
      { fname, lname, phone },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error in updateuser route:", err); // Log the full error
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
