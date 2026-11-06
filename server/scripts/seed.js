/**
 * Seeds a fresh database:
 *   - default course categories (skips any that already exist)
 *   - an Admin account, if ADMIN_EMAIL and ADMIN_PASSWORD are set
 *
 * Usage (from /server):   npm run seed
 * Safe to run more than once.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Category = require("../models/Category");
const User = require("../models/User");
const Profile = require("../models/Profile");

const CATEGORIES = [
    { name: "Web Development", description: "HTML, CSS, JavaScript, React, Node.js and the modern web stack." },
    { name: "Data Science", description: "Python, statistics, machine learning and data analysis." },
    { name: "Mobile Development", description: "Build apps for Android and iOS." },
    { name: "DevOps & Cloud", description: "CI/CD, containers, Kubernetes and cloud platforms." },
    { name: "Programming Languages", description: "Learn Java, Python, C++, Go and more." },
    { name: "Design", description: "UI/UX, graphic design and product design." },
];

async function main() {
    if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is not set");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    for (const cat of CATEGORIES) {
        const exists = await Category.findOne({ name: cat.name });
        if (exists) {
            console.log(`  = category exists: ${cat.name}`);
        } else {
            await Category.create(cat);
            console.log(`  + category created: ${cat.name}`);
        }
    }

    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`  = admin/user already exists: ${ADMIN_EMAIL}`);
        } else {
            const profile = await Profile.create({
                gender: null,
                dateOfBirth: null,
                about: null,
                contactNumber: null,
            });
            await User.create({
                firstName: "Site",
                lastName: "Admin",
                email: ADMIN_EMAIL,
                password: await bcrypt.hash(ADMIN_PASSWORD, 10),
                accountType: "Admin",
                approved: true,
                additionalDetails: profile._id,
                image: "https://api.dicebear.com/5.x/initials/svg?seed=Site Admin",
            });
            console.log(`  + admin created: ${ADMIN_EMAIL}`);
        }
    } else {
        console.log("  (ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin creation)");
    }

    await mongoose.disconnect();
    console.log("Seed complete");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
