import mongoose, { Schema } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url.
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url.
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: Video,
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required !!"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// ? how to encrypt the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  // ! this line of code check the password field is filled by user or not.
  // !If user fill the field then execute next line of code otherwise return next.

  this.password = await bcrypt.hash(this.password, 10); // ! this code encrypt the password
  next();
});

// ? how to decrypt the password
// ! schema.methos allows to create new methods to do some functionality
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
