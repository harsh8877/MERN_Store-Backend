const express = require("express");
const mongoose = require("mongoose");
const Products = require("../../models/Products");
const authenticate = require("../../middlewares/auth");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Order = require("../../models/Order");

const rootPath = path.resolve(__dirname, "../../");
const uploadsDir = path.join(rootPath, "uploads");

// // Multer set up
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.use("/uploads", express.static(uploadsDir));

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.json({
    fileName: req.file.filename,
    filePath: `/uploads/${req.file.filename}`,
  });
});

router.post("/product", upload.single("file"), async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      quantity,
      price,
      taxable,
      selectedProduct,
      selectedCategory,
      isActive,
    } = req.body;
    const file = req.file ? req.file.filename : null;

    if (
      !sku ||
      !name ||
      !description ||
      !quantity ||
      !price ||
      !taxable ||
      !selectedProduct ||
      !selectedCategory
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const newProduct = new Products({
      sku,
      name,
      description,
      quantity,
      price,
      taxable,
      selectedProduct,
      selectedCategory,
      file,
      isActive: isActive === "true" || isActive === "on",
    });

    await newProduct.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in backend:", err); // Log error to server console
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + err.message });
  }
});

router.get("/getproduct", async (req, res) => {
  try {
    const {
      page = 1, // Pagination
      limit = 20,
      search = "", // key based-Filtering
      sort = "createdAt_desc",
      brand, // brand based-Filtering
      category, // category based-Filtering
      maxPrice, // price and average rating
      minRating,
      maxRating,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const filter = {};

    // If brand is provided, filter by brand
    if (brand && brand.trim() !== "") {
      filter.selectedProduct = { $regex: brand, $options: "i" }; // Case-insensitive match
    }

    // If category is provided, filter by category
    if (category && category.trim() !== "") {
      filter.selectedCategory = { $regex: category, $options: "i" }; // Case-insensitive match
    }

    // Apply search text
    if (search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { selectedProduct: { $regex: search, $options: "i" } },
        { selectedCategory: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Safely parse and apply max price
    const maxPriceNum = parseFloat(maxPrice);
    if (!isNaN(maxPriceNum)) {
      filter.price = { $lte: maxPriceNum };
    }

    console.log("FILTER USED : ", JSON.stringify(filter, null, 2));

    // Sorting options
    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      createdAt_desc: { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    // Convert minRating and maxRating to numbers for filtering avgRating later
    // const minRatingNum = !isNaN(parseFloat(minRating))
    //   ? parseFloat(minRating)
    //   : 0;
    const minRatingNum = parseFloat(minRating);
    const maxRatingNum = parseFloat(maxRating);

    const countPipeline = [
      // step-1 : match documents
      { $match: filter },

      // step-2 :reviews collection
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },

      // step-3 : avgRating
      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0,
            ],
          },
        },
      },
    ];

    // Rating filter in count
    if (!isNaN(minRatingNum) || !isNaN(maxRatingNum)) {
      const ratingFilter = {};
      if (!isNaN(minRatingNum)) ratingFilter.$gte = minRatingNum;
      if (!isNaN(maxRatingNum)) ratingFilter.$lte = maxRatingNum;

      if (Object.keys(ratingFilter).length > 0) {
        countPipeline.push({ $match: { avgRating: ratingFilter } });
      }
    }

    countPipeline.push({ $count: "total" });

    const countResult = await Products.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limitNum);

    // Fetch pipeline
    const fetchPipeline = [...countPipeline];
    fetchPipeline.pop(); // Remove $count
    fetchPipeline.push(
      { $sort: sortBy },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum }
    );

    const products = await Products.aggregate(fetchPipeline);
    // if (total === 0) {
    //   console.warn("No products matched : ", filter);
    // }

    // Send response
    res.status(200).json({
      success: true,
      products,
      total,
      pages,
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.put(
  "/product/:id",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      const updatedData = { ...req.body };
      if (req.file) {
        updatedData.file = req.file.filename;
      }

      const product = await Products.findByIdAndUpdate(
        req.params.id,
        updatedData,
        { new: true }
      );

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Error updating product" });
    }
  }
);

router.get("/getproduct/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product : ", err);
    res.status(500).json({ message: "Error fetching product" });
  }
});

router.delete("/product/:id", authenticate, async (req, res) => {
  try {
    const deleted = await Products.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete error : ", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting product" });
  }
});

router.put(
  "/order/:orderId/item/:itemId/status",
  authenticate,
  async (req, res) => {
    try {
      const { orderId, itemId } = req.params;
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ error: "Item not found" });

      item.status = status;
      await order.save();

      res.status(200).json({ message: "Status updated", order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update item status" });
    }
  }
);

module.exports = router;
