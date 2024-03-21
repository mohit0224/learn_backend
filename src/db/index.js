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

        // console.log(`Error connecting to database :: ${error}`);
        // process.exit(1);
    }
};

export default dbConnection;
