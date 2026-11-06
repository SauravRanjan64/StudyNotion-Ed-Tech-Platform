const mongoose = require("mongoose");

exports.connect = () => {
    return mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => console.log("DB Connection Established Successfully"))
        .catch((error) => {
            console.log("DB Connection Failed");
            console.log(error);
            process.exit(1);
        });
};
