/*
  This file defines all API endpoints related to group data.
  It connects incoming requests to the groupController for processing.
*/
import express from "express";
import { getGroups } from "../controllers/groupController.js";

export const router = express.Router();
router.get("/", getGroups);
