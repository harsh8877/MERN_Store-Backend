const express = require("express");
const Signup = require("../../models/Signup");
const authenticate = require("../../middlewares/auth");
const signupSchema = require("../../validators/signupValidator");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    // valid input data using zod
    const validation = signupSchema.safeParse(req.body);

    if (!validation.success) {
      const errorFields = validation.error.errors.reduce((acc, err) => {
        if (!acc[err.path[0]]) {
          acc[err.path[0]] = [];
        }
        acc[err.path[0]].push(err.message);
        return acc;
      }, {});

      return res.status(400).json(errorFields);
    }

    const { email, fname, lname, password, role } = req.body;
    const userExists = await Signup.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Signup({
      email,
      fname,
      lname,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Signup.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "22h",
      }
    );
    console.log("Generated Token:", token);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
