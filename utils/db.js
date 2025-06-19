const mongoose = require("mongoose");

// const URL = "mongodb://localhost:27017/mern_store";

// mongoose.connect(URL);

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected");
    // mongoose.connect(URL);
  } catch (error) {
    console.error("MongoDb connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDb;
