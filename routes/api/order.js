const express = require("express");
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const authenticate = require("../../middlewares/auth");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/placeorder", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const userRole = decoded.role;

    const { items, status: requestedStatus } = req.body;
    console.log("Received order items : ", items);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const validItems = items.every(
      (item) => item.productId && item.quantity > 0 && item.price >= 0
    );

    if (!validItems) {
      return res.status(400).json({ error: "Invalid product data" });
    }

    // Add default status only if user is not admin
    const orderStatus =
      userRole === "admin" ? requestedStatus || "Pending" : "Not Processed";

    const newOrder = new Order({
      user: userId,
      items: items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      status: orderStatus,
    });

    const savedOrder = await newOrder.save();

    res.status(200).json({
      success: true,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Order placement failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/orders", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const taxRate = 0.05; // 5% tax

    const orders = await Order.find({ user: userId }).populate(
      "items.product",
      "name price file taxable" //  taxable is fetched
    );

    const formattedOrders = orders.map((order) => {
      const products = order.items.map((item) => {
        const price = item.price;
        const quantity = item.quantity;
        const subtotal = price * quantity;
        const taxable = item.product.taxable !== false; // true if not false

        return {
          _id: item.product._id,
          name: item.product.name,
          file: item.product.file,
          price,
          quantity,
          subtotal,
          taxable,
          status: item.status,
        };
      });

      const subtotal = products.reduce((acc, cur) => acc + cur.subtotal, 0); // all products in order

      const taxableSubtotal = products
        .filter((p) => p.taxable)
        .reduce((acc, cur) => acc + cur.subtotal, 0);

      const estimatedtax = taxableSubtotal * taxRate;
      const shipping = subtotal > 500 ? 0 : 25;
      const total = subtotal + estimatedtax + shipping;

      return {
        _id: order._id,
        items: products,
        subtotal,
        estimatedtax,
        shipping,
        total,
        createdAt: order.createdAt,
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/order/:id", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById({ _id: orderId, user: userId }).populate(
      "items.product"
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const productIds = order.items.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      file: item.product.file,
      quantity: item.quantity,
      texable: item.product.texable,
    }));

    const orderResponse = {
      ...order.toObject(),
      productIds,
    };

    console.log("Order fetched:", order);
    res.json(orderResponse);
  } catch (error) {
    console.error("Failed to fetch order", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.delete("/order/:id", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const orderId = req.params.id;

    const order = await Order.findByIdAndDelete({ _id: orderId, user: userId });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }
    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// router.put(
//   "/order/:orderId/item/:itemId/status",
//   authenticate,
//   async (req, res) => {
//     try {
//       const { orderId, itemId } = req.params;
//       const { status } = req.body;

//       const order = await Order.findByIdAndUpdate(orderId);
//       if (!order) return res.status(404).json({ error: "Order not found" });

//       const item = order.items.id(itemId);
//       if (!item) return res.status(404).json({ error: "Item not found" });

//       item.status = status;
//       await order.save();

//       res.status(200).json({ message: "Status updated", order });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to update item status" });
//     }
//   }
// );

router.get("/getuser", authenticate, async (req, res) => {
  const authHeader = req.headers.authorization;

  // 1. Check if token is provided
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token not provided" });
  }

  // 2. Extract token from header
  const token = authHeader.split(" ")[1];

  try {
    // 3. Decode token using your secret
    const decoded = jwt.verify(token, JWT_SECRET); // Replace with your actual secret key

    // 4. Get user from database
    const user = await Signup.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. Send user info (including role)
    res.status(200).json(user);
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
