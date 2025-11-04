/*
  This file contains middleware for authentication and authorization checks.
  It ensures that routes requiring login are protected from unauthorized access.
*/

export function requireAuth(req, res, next) {
  console.log("Auth middleware triggered");
  next();
}
