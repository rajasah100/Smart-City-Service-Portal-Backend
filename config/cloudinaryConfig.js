const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Single Image Upload (Profile Avatar)
const avatarUpload = upload.single("avatar");

// Single Event Banner Upload
const eventUpload = upload.single("image");

// Multiple Images Upload (Complaints)
const multerMiddleware = upload.array("images", 5);

// Single Attachment Upload (Notice Image / PDF)
const noticeUpload = upload.single("attachment");

// Upload Single File to Cloudinary
const uploadFileToCloudinary = (file) => {
  let resourceType = "image";

  if (file.mimetype === "application/pdf") {
    resourceType = "raw";
  } else if (file.mimetype.startsWith("video")) {
    resourceType = "video";
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file.path,
      {
        resource_type: resourceType,
        use_filename: true,
      },
      (error, result) => {
        fs.unlink(file.path, () => {});

        if (error) return reject(error);

        resolve(result);
      },
    );
  });
};

// Upload Multiple Files
const uploadMultipleFilesToCloudinary = async (files) => {
  const uploadedFiles = [];

  for (const file of files) {
    const result = await uploadFileToCloudinary(file);

    uploadedFiles.push({
      url: result.secure_url,
      publicId: result.public_id,
    });
  }

  return uploadedFiles;
};


module.exports = {
  cloudinary,
  avatarUpload,
  multerMiddleware,
  uploadFileToCloudinary,
  uploadMultipleFilesToCloudinary,
  noticeUpload,
  eventUpload,
};
