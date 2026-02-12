const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MONGODB connected successfully");
    } catch (error) {
        console.error("MONGODB connection failed", error.message);
        process.exit(1);
    }

};

// export connectDB
module.exports = connectDB;