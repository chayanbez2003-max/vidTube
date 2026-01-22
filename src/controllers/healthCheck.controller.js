// steps:
// 1. check if db is connected
//2. check server is running
// 3. return health status

import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

 const healthCheck = asyncHandler(async(req ,res)=>{
    const dbState = mongoose.connection.readyState // 0-disconnected,1-connected,2-connecting,3-disconnecting
 
    const isDbConnected = dbState ===1

    const healthStatus ={
        status: isDbConnected ? "OK" : "NOT OK",
        timestamp : new Date().toISOString(),
        uptime: process.uptime(),
        services:{
            database: isDbConnected ? "Connected" : "Disconnected",
        }
    }

    return res.status(isDbConnected ? 200 : 503).json(

        new ApiResponse(
            isDbConnected ? 200 : 503,
            healthStatus,
            isDbConnected ? "Service is healthy" : "Service is unhealthy"
        )
    )
    

 })

 export {healthCheck}