const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const reviewSchema = new mongoose.Schema({
    bookId: {
        type: ObjectId,
        required: true,
        ref: 'Book'

    },

    reviewedBy: {
        type: String,
        reqiured: true,
        default: 'Guest',
        trim: true

    },

    reviewedAt: {
        type: Date,
        default: Date.now
        
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        trim: true

    },

    review: {
        type: String,
        trim: true
    },

    isDeleted: {
        type: Boolean,
        default: false

    },

}, { timestamps: true })

module.exports = mongoose.model("Review", reviewSchema) //reviews