require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // Middleware to enable Cross-Origin Resource Sharing
const passport = require("passport"); // Authentication middleware
const session = require("express-session"); // Middleware for managing sessions

const app = express();
app.use(express.json());
app.use(cors());

require("./config/passport"); // Passport configuration

app.use(
  session({
    secret: process.env.SESSION_SECRET || "a very secret secret", // sign session ID cookies
    resave: false, // Don't save session if it hasn't changed
    saveUninitialized: false, // Don't create session
  })
);

app.use(passport.initialize());
app.use(passport.session());

const addressRoutes = require("./routes/api/address");
const categoryRoutes = require("./routes/api/category");
const merchantRoutes = require("./routes/api/merchant");
const brandRoutes = require("./routes/api/brand");
const userRoutes = require("./routes/api/users");
const wishlistRoutes = require("./routes/api/wishlist");
const reviewRoutes = require("./routes/api/reviews");
const orderRoutes = require("./routes/api/order");
const productRoutes = require("./routes/api/product");
const footerRoutes = require("./routes/api/footer");
const loginRoutes = require("./routes/api/login");
const forgotPasswordRoutes = require("./routes/api/forgotpassword");
const accountDetailsRoutes = require("./routes/api/accountdetails");
const accountSecurityRoutes = require("./routes/api/accountsecurity");
const googleRoutes = require("./routes/api/users");
const authRoutes = require("./routes/api/auth-routes");

// Connect to MongoDB
const connectDb = require("./utils/db");
connectDb();

// Mount API routes
app.use("/api", addressRoutes);
app.use("/api", categoryRoutes);
app.use("/api", merchantRoutes);
app.use("/api", brandRoutes);
app.use("/api", userRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", reviewRoutes);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);
app.use("/api", footerRoutes);
app.use("/api", loginRoutes);
app.use("/api", forgotPasswordRoutes);
app.use("/api", accountSecurityRoutes);
app.use("/api", accountDetailsRoutes);
app.use("/api", googleRoutes);
app.use("/api", authRoutes);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.send("MERN Store");
});

app.use("/api", require("./routes/api/auth-routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
