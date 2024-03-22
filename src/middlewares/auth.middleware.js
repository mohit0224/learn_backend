import User from "../models/user.model.js";
import { apiError, asyncHandler } from "../utils/index.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // get token from request
        const token =
            req.cookies?.access_token ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new apiError(401, "Unauthorized request !!");

        // validate token
        const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN);

        // get user by token
        const user = await User.findById(verifyToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) throw new apiError(401, "Invalid access request !!");

        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error.message || "Invalid access request !!");
    }
});

export default verifyJWT;
