import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// setup cors config
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// setup express json, urlencoded, static files config and cookieparser config

app.use(express.json({ limit: "20kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

export { app };
