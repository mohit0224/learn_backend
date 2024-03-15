import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) null;

    // if filepath is existing...
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    // if the file uploaded successfully...
    console.log("File uploaded successfully... :: ", response);

    return response;
  } catch (error) {
    // if the upload failed then delete/remove the file from temporary storage.
    fs.unlinkSync(filePath);

    return null;
  }
};

export default uploadOnCloudinary;
