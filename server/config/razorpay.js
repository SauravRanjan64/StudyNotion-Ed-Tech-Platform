const Razorpay = require("razorpay");

let _instance = null;

// Created on first use (after dotenv has loaded) instead of at import time.
exports.getRazorpay = () => {
    if (!_instance) {
        if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
            throw new Error("RAZORPAY_KEY / RAZORPAY_SECRET are not configured");
        }
        _instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_SECRET,
        });
    }
    return _instance;
};
