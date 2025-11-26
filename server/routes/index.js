/*
  This file defines the base routes for the Conductor API.
  It handles requests made to the root endpoint ("/").
*/
import express from "express";
import { router as usersRouter } from "./users.js";
import { router as groupsRouter } from "./groups.js";
import { router as journalsRouter } from "./journals.js";

export const router = express.Router();
import {router as attendanceRouter} from "./attendance.js";

router.get("/", (req, res) => {
  res.send("Welcome to the Conductor API");
});

// Mount sub-routers


router.use("/users", usersRouter
  // #swagger.tags = ['Users']
);

router.use("/groups", groupsRouter
  // #swagger.tags = ['Groups']
);

router.use("/journal", journalsRoute
  // #swagger.tags = ['Journals']
);

router.use("/attendance", attendanceRouter
  // #swagger.tags = ['Attendance']
);

