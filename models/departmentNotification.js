const mongoose = require("mongoose");

const departmentNotificationSchema = new mongoose.Schema({
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    message: {
        type: String,
        required: true,
    },

    complaint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
        required: true,
    },

    isRead: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model("DepartmentNotification", departmentNotificationSchema);