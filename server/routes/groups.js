/*
  This file defines all API endpoints related to group data.
  It connects incoming requests to the groupController for processing.
*/
const express = require("express");
const { getGroups } = require("../controllers/groupController");

const router = express.Router();

router.get("/", getGroups
/**
 * @swagger
 * #swagger.summary = 'Get all groups'
 * #swagger.description = 'Returns the list of groups.'
 * #swagger.responses[200] = { description: "Group list" }
*/
);

module.exports = router;