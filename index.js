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
        await seedSuperAdmin();
        const Hospital = require("./src/models/Hospital");

const hospital = await Hospital.findOne(); 

await unitSeeds(hospital._id);
        app.listen(PORT, () => {
            console.log(`Server is listening on ${PORT}`);
        })
        
    } catch (error) {
        console.error("StartUP failed:", error.message);
        process.exit(1);
    }
};

startServer();
