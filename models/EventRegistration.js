const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: {
            type:  mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        participants: {
            type: Number,
            default: 1,
            min: 1,
        },

        status: {
            type: String,
            enum: ["Registered", "Cancelled", "Attended"],
            default: "Registered",
        }
    }, { timestamps: true}
);

eventRegistrationSchema.index(
    { event: 1, user: 1},
    { unique: true}
);

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema
);