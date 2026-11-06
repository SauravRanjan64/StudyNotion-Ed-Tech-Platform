const nodemailer = require("nodemailer");

/**
 * Sends an email. Two transports:
 *   1. Brevo HTTP API  - used when BREVO_API_KEY is set. Works on hosts that block
 *      outbound SMTP (e.g. Render's free tier). Needs MAIL_FROM_EMAIL (a verified sender).
 *   2. SMTP (nodemailer) - used otherwise (MAIL_HOST / MAIL_PORT / MAIL_USER / MAIL_PASS).
 * Returns the provider response, or undefined if sending failed (error is logged).
 */
const sendViaBrevo = async (email, title, body) => {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            sender: {
                name: process.env.MAIL_FROM_NAME || "StudyNotion",
                email: process.env.MAIL_FROM_EMAIL,
            },
            to: [{ email: `${email}` }],
            subject: `${title}`,
            htmlContent: `${body}`,
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(`Brevo API ${res.status}: ${data.message || JSON.stringify(data)}`);
    }
    return data;
};

const sendViaSmtp = async (email, title, body) => {
    const port = Number(process.env.MAIL_PORT) || 587;
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    return transporter.sendMail({
        from: process.env.MAIL_FROM || `StudyNotion <${process.env.MAIL_USER}>`,
        to: `${email}`,
        subject: `${title}`,
        html: `${body}`,
    });
};

const mailConfigured = () =>
    !!process.env.BREVO_API_KEY || !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);

const mailSender = async (email, title, body) => {
    // Local-dev fallback: no mail provider configured -> print the email so
    // flows like signup OTP still work.
    if (!mailConfigured()) {
        const text = String(body).replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        console.log(`\n[DEV MAIL] To: ${email}\n[DEV MAIL] Subject: ${title}\n[DEV MAIL] ${text}\n`);
        return { devLogged: true };
    }
    try {
        const info = process.env.BREVO_API_KEY
            ? await sendViaBrevo(email, title, body)
            : await sendViaSmtp(email, title, body);
        console.log("Mail sent to", email);
        return info;
    } catch (error) {
        console.log("Mail error:", error.message);
    }
};

module.exports = mailSender;
