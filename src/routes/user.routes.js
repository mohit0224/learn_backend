import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/index.js";

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

export default router;
