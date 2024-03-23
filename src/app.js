import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//! setup cors config
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// ! setup express json, urlencoded, static files config and cookie_parser config
app.use(express.json({ limit: "20kb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "20kb",
    })
);
app.use(express.static("public"));
app.use(cookieParser());

// ! import router ----------------------------------------------------------------
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

// ! routes declaration -----------------------------------------------------------
// ? https:localhost:8000/api/v1/users
app.use("/api/v1/users", userRouter);

// ? https:localhost:8000/api/v1/subscription
app.use("/api/v1/subscription", subscriptionRouter);

export default app;
