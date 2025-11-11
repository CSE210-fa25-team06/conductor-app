/**
 * Journal Routes - Defines API endpoints for journal entries
 */

import express from "express";
import { createJournal } from "../controllers/journalController.js";

export const router = express.Router();

// POST /journal/create - Create a new journal entry
router.post("/create", createJournal);

export default router;