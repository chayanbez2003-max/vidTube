import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const streamSchema = new mongoose.Schema({}, { strict: false });
const Stream = mongoose.model('Stream', streamSchema);

async function checkStreams() {
    try {
        await mongoose.connect(process.env.MONGODB_URI + '/videotube'); // Assuming videotube is the DB name based on typical setups, or read from env
        const streams = await Stream.find().sort({ createdAt: -1 }).limit(5);
        console.log("Recent streams:");
        streams.forEach(s => {
            console.log(`ID: ${s._id}, isLive: ${s.isLive}, streamKey: ${s.streamKey}, start: ${s.startedAt}, end: ${s.endedAt}, error: ${s.error || 'none'}`);
        });
        
        // Let's also check for any error logs or unhandled rejections if we can
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        process.exit();
    }
}
checkStreams();
