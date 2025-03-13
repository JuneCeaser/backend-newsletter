const express = require("express");
const {
  createNewsletter,
  getNewsletters,
  deleteNewsletter,
} = require("../controllers/newsletterController");
const multer = require("multer");
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size to 5MB
  },
});

// Routes
router.post("/", upload.single("image"), createNewsletter);
router.get("/", getNewsletters);
router.delete("/:id", deleteNewsletter);

module.exports = router;
