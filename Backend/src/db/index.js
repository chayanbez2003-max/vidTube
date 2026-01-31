import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectToDatabase = async () => {
    try{
        const connextionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`
        )
        console.log(`\n Connected to MongoDB successfully to database: ${connextionInstance.connection.host}`);
    }
    catch(err){
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
}
export default connectToDatabase;