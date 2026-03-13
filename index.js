require("dotenv").config();
require("./src/services/insuranceChecker");
const connectDB = require("./src/config/connectDB");
const seedSuperAdmin = require("./src/services/superAdmin.seed");
const unitSeeds = require("./src/services/seedUnits");
const app = require("./src/app");
const PORT = process.env.PORT || 3004;


const startServer = async () => {
    try {
        await connectDB();
        await unitSeeds();
        await seedSuperAdmin();
        app.listen(PORT, () => {
            console.log(`Server is listening on ${PORT}`);
        })
        
    } catch (error) {
        console.error("StartUP failed:", error.message);
        process.exit(1);
    }
};

startServer();
