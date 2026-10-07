const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration
// Memory storage: Vercel ko filesystem read-only bhaeko le file disk ma save nagari sidhai Cloudinary ma pathaune
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Single Image Upload (Profile Avatar)
const avatarUpload = upload.single("avatar");

// Home content (janapratinidhi photo, slider, download file)
const contentUpload = upload.single("file");

// Municipality Logo Upload
const logoUpload = upload.single("logo");

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
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        filename_override: file.originalname,
        use_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);

        resolve(result);
      },
    );

    stream.end(file.buffer);
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
  logoUpload,
  contentUpload,
};
