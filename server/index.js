// Load environment variables FIRST, before any module reads process.env
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const os = require("os");

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const database = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");

// ---- Configuration check -------------------------------------------------
// Only these are needed to boot. Cloudinary / Razorpay / mail are optional
// locally: features that depend on them just won't work until you add keys.
const REQUIRED_ENV = ["MONGODB_URL", "JWT_SECRET", "CLIENT_URL"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    console.error("Copy server/.env.example to server/.env and fill them in.");
    process.exit(1);
}
if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    console.warn("[warn] Cloudinary not configured - image/video uploads will fail.");
}
if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
    console.warn("[warn] Razorpay not configured - course payments will fail.");
}
if (!process.env.BREVO_API_KEY && !(process.env.MAIL_USER && process.env.MAIL_PASS)) {
    console.warn("[warn] Mail not configured - emails (incl. signup OTP) will be printed in this console.");
}

const app = express();
const PORT = process.env.PORT || 4000;

// Behind Render/Railway/Heroku-style proxies (needed for secure cookies)
app.set("trust proxy", 1);

// ---- Middleware ----------------------------------------------------------
const allowedOrigins = process.env.CLIENT_URL.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: (origin, callback) => {
            // allow non-browser clients (curl, health checks) and whitelisted sites
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    })
);
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: os.tmpdir(),
    })
);

// ---- Services ------------------------------------------------------------
cloudinaryConnect();

// ---- Routes --------------------------------------------------------------
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

app.get("/", (req, res) => {
    return res.json({ success: true, message: "Server is up and running..." });
});

// Health check for hosting platforms
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// ---- Error handling ------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// Don't let one unhandled promise rejection take the whole API down
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

// ---- Start (only once the DB is reachable) --------------------------------
database.connect().then(() => {
    app.listen(PORT, () => console.log(`App is running at ${PORT}`));
});
