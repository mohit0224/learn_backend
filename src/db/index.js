import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnection = async () => {
  try {
    const { connection } = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`database connected to ${connection.host} !!`);
  } catch (error) {
    console.log(`Error connecting to database :: ${error}`);
    process.exit(1);
  }
};

export default dbConnection;
