import dotenv from "dotenv";
import connectToDatabase from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
}
);

connectToDatabase()

.then(()=>{
    app.listen(process.env.PORT||8000 , () => {
        console.log(`Server is running on port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.error("Failed to connect to the database:", err);}
)



// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
//     }
//     catch(err){
//         console.error("Error connecting to MongoDB:", err);
//         throw err;
//     }
// })()