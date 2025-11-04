/*
  This file defines all API endpoints related to user data.
  It connects incoming requests to the userController for processing.
*/
import express from "express";
import { getUsers } from "../controllers/userController.js";

export const router = express.Router();
router.get("/", getUsers);
