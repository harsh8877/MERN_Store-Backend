// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_jwt_secret_key_here";

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // process.env.JWT_SECRET = tamaru secret key
    req.user = decoded; // token ma je user ni info hati, ae req.user ma muki dai
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticateUser;
