const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const sendEmail = require("../config/nodemailer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a newsletter
const createNewsletter = async (req, res) => {
  try {
    const { subject, description } = req.body;

    // Upload image to Cloudinary if file exists
    let imageUrl = "";
    if (req.file) {
      // Use Cloudinary's upload_stream to handle buffer uploads
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "newsletters" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Pass the buffer to the upload stream
        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    // Create a new newsletter
    const newNewsletter = new Newsletter({
      subject,
      description,
      imageUrl,
    });

    // Save the newsletter to the database
    await newNewsletter.save();

    // Fetch all users' emails
    const users = await User.find({}, "email");
    console.log("Users to send emails to:", users);

    // Prepare the email content
    const emailContent = `
      <h1>${subject}</h1>
      <p>${description}</p>
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="Newsletter Image" style="max-width: 100%;" />`
          : ""
      }
    `;
    console.log("Email Content:", emailContent);

    // Send the newsletter to all users
    const emailPromises = users.map((user) =>
      sendEmail(user.email, subject, emailContent).catch((error) => {
        console.error(`Failed to send email to ${user.email}:`, error);
      })
    );

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    // Respond with success message
    res.status(201).json({
      message: "Newsletter created and sent successfully",
      newNewsletter,
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    res.status(500).json({
      message: "Error creating newsletter",
      error: error.message,
    });
  }
};

// Get all newsletters with pagination
const getNewsletters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 newsletters per page
    const skip = (page - 1) * limit;

    // Fetch newsletters with pagination
    const newsletters = await Newsletter.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by latest first

    // Get total count of newsletters
    const totalCount = await Newsletter.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      newsletters,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    res.status(500).json({
      message: "Error fetching newsletters",
      error: error.message,
    });
  }
};

// Delete a newsletter
const deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({ message: "Newsletter not found" });
    }

    // Delete image from Cloudinary if exists
    if (newsletter.imageUrl) {
      const publicId = newsletter.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Newsletter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Newsletter deleted successfully" });
  } catch (error) {
    console.error("Error deleting newsletter:", error);
    res.status(500).json({
      message: "Error deleting newsletter",
      error: error.message,
    });
  }
};

module.exports = { createNewsletter, getNewsletters, deleteNewsletter };
