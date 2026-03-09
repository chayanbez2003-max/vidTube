import mongoose , { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    videoFile:{
        type: {
            url: String,
            public_id: String
        }, //cloudinary url
        required: true
    },
    thumbnail: {
        type: {
            url: String,
            public_id: String
        }, //cloudinary url (optional for live streams)
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        default: '',
    },
    duration:{
        type: Number,
        default: 0
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    category: {
        type: String,
        enum: [
            'education', 'entertainment', 'gaming', 'music', 
            'news', 'sports', 'technology', 'travel', 
            'comedy', 'howto', 'science', 'other'
        ],
        default: 'other'
    },
    trendingScore: {
        type: Number,
        default: 0
    },
    totalWatchTime: {
        type: Number,
        default: 0  
    }

}, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate);
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Video= mongoose.model('Video', videoSchema)