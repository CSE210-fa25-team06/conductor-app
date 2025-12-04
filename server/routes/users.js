/*
  This file defines all API endpoints related to user data.
  It connects incoming requests to the userController for processing.
*/

const { requirePermission } = require('../middleware/role-checker');
const PERMISSIONS = require('../config/permissions/permissions')

const express = require("express");
const { getUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", requirePermission(PERMISSIONS.VIEW_CLASS_DIRECTORY), getUsers);

module.exports = router;
