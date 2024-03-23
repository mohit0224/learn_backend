import { Router } from "express";
import {
    loggedOut,
    loginUser,
    refreshUserToken,
    registerUser,
} from "../controllers/user.controllers.js";
import { upload, verifyJWT } from "../middlewares/index.js";

const router = Router();

// ? https:localhost:8000/api/v1/users
router.route("/").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

// ? https:localhost:8000/api/v1/users/login
router.route("/login").post(loginUser);

// ? https:localhost:8000/api/v1/users/logout
router.route("/logout").post(verifyJWT, loggedOut);

// ? https:localhost:8000/api/v1/users/refresh-token
router.route("/refresh-token").post(refreshUserToken);

export default router;
