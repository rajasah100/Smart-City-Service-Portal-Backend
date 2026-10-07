const mongoose = require("mongoose");

// Nagarpalika ko pahichan (website ko header/footer ma dekhine). Database ma euta matra document huncha
const siteSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true,
    },

    nameNe: { type: String, default: "स्मार्ट सिटी सेवा पोर्टल", trim: true },
    nameEn: { type: String, default: "Smart City Service Portal", trim: true },

    officeNe: { type: String, default: "डिजिटल नागरिक सेवा प्लेटफर्म", trim: true },
    officeEn: { type: String, default: "Digital Citizen Service Platform", trim: true },

    addressNe: { type: String, default: "भक्तपुर-३, बागमती प्रदेश, नेपाल", trim: true },
    addressEn: { type: String, default: "Bhaktapur-3, Bagmati Province, Nepal", trim: true },

    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    hotline: { type: String, default: "100", trim: true },

    // Karyalaya khulne samaya (About page)
    officeHoursNe: { type: String, default: "आइतबार - शुक्रबार, बिहान ९:०० - बेलुका ५:००", trim: true },
    officeHoursEn: { type: String, default: "Sunday - Friday, 9:00 AM - 5:00 PM", trim: true },

    // Home page ko "परिचय" section
    introNe: { type: String, default: "स्मार्ट सिटी सेवा पोर्टल नागरिकलाई छिटो, पारदर्शी र जवाफदेही सेवा दिन बनाइएको डिजिटल प्लेटफर्म हो। यस पोर्टलमार्फत नागरिकले घरबाटै गुनासो दर्ता गर्न, सूचना र कार्यक्रम हेर्न तथा आपतकालीन अवस्थामा तुरुन्त सहायता माग्न सक्नुहुन्छ।", trim: true },
    introEn: { type: String, default: "Smart City Service Portal is a digital platform built for fast, transparent and accountable public service. Through this portal, citizens can file complaints from home, read notices and events, and ask for help immediately in an emergency.", trim: true },

    // Social media (khali bhae footer ma icon dekhaudaina)
    facebook: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },

    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
