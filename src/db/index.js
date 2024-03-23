import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnection = async () => {
    try {
        const { connection } = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(
            `database connected successfully on host :: ${connection.host} !!`
        );
    } catch (error) {
        throw error.message;
    }
};

export default dbConnection;
