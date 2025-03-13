const express = require("express");
const { getAllUsers, deleteUser } = require("../controllers/userController");
const router = express.Router();

// Routes without JWT authentication
router.get("/", getAllUsers);
router.delete("/:id", deleteUser);

module.exports = router;
