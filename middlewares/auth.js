const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// middleware/auth.js

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // storedecoded token
    // next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }

  next();
}

module.exports = authenticate;
