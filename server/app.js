/*
  This file initializes and configures the Express application.
  It connects middleware, routes, and starts the HTTP server.
*/
import express from "express";
import { router as indexRouter } from "./routes/index.js";

const app = express();
app.use(express.json());
app.use(express.static("client"));
app.use("/", indexRouter);
app.use("/api", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
