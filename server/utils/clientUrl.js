// First entry of CLIENT_URL (it may be a comma-separated list for CORS), no trailing slash.
module.exports = () =>
    (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "");
