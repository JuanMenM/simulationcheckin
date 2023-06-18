import express from 'express';

import pool from "./config/db.js";
import checkinRouter from './routes/checkin.Routes.js';

const app = express();
const port = 3000;

//routes
app.use("/", checkinRouter)
app.use("*", (req, res) => {
    console.log();
    res.json({message: "could not connect to db"});
});

//star server
app.listen(app.get("port"), () => {
    console.log("server is running on", app.get("port"));
});

//connect to database
pool.connect(console.log("Conncected to database"));
