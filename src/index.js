import dotenv from "dotenv";
import dbConnection from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./.env" });

dbConnection()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`⚙️ server is running at :: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting to database :: ${error}`);
    process.exit(1);
  });
