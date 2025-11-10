/*
  This file defines the base routes for the Conductor API.
  It handles requests made to the root endpoint ("/").
*/
import express from "express";
export const router = express.Router();
import {router as attendanceRouter} from "./attendance.js";

router.get("/", (req, res) => {
  res.send("Welcome to the Conductor API");
});

router.use("/attendance", attendanceRouter);
