// Koshi Province ko seed data (seeder.js le pryog garchha)
// Thau ko naam FrontEnd/src/data/nepalLocation.js sanga milne (English value)
// Phone/email namuna hun: vastavik office ko lagi admin bata badalnus

const PROVINCE = "Koshi Province";

// ===== Department: serviceArea anusar gunaso aauchha =====
const departments = [
  {
    key: "water",
    name: "Water Supply Department (Koshi)",
    email: "water.koshi@example.com",
    phone: "9800000101",
    address: "Biratnagar, Morang",
    description: "कोशी प्रदेशभरका खानेपानी आपूर्ति, पाइप चुहावट र पानीको गुणस्तर सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "", municipalities: [] },
  },
  {
    key: "electricity",
    name: "Electricity Service Department (Koshi)",
    email: "electricity.koshi@example.com",
    phone: "9800000102",
    address: "Biratnagar, Morang",
    description: "बिजुली अवरोध, सडक बत्ती, झरेको तार र ट्रान्सफर्मर सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "", municipalities: [] },
  },
  {
    key: "road",
    name: "Road & Drainage Department (Koshi)",
    email: "road.koshi@example.com",
    phone: "9800000103",
    address: "Itahari, Sunsari",
    description: "सडकमा खाल्डो, ढल थुनिएको, फुटपाथ र सडक अवरोध सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "", municipalities: [] },
  },
  {
    key: "transport",
    name: "Transport Management Department (Koshi)",
    email: "transport.koshi@example.com",
    phone: "9800000104",
    address: "Itahari, Sunsari",
    description: "सार्वजनिक यातायात, ट्राफिक, पार्किङ र बस बिसौनी सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "", municipalities: [] },
  },
  // Fohor: sahar anusar chhuttai (serviceArea ko udaharan)
  {
    key: "wasteBiratnagar",
    name: "Waste Management Department (Biratnagar)",
    email: "waste.biratnagar@example.com",
    phone: "9800000105",
    address: "Biratnagar, Morang",
    description: "विराटनगर महानगरपालिका भित्रको फोहोर संकलन र सरसफाइ सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "Morang", municipalities: ["Biratnagar Metropolitan City"] },
  },
  {
    key: "wasteSunsari",
    name: "Waste Management Department (Sunsari)",
    email: "waste.sunsari@example.com",
    phone: "9800000106",
    address: "Dharan, Sunsari",
    description: "सुनसरी जिल्लाभरको फोहोर संकलन र सरसफाइ सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "Sunsari", municipalities: [] },
  },
  {
    key: "wasteJhapa",
    name: "Waste Management Department (Jhapa)",
    email: "waste.jhapa@example.com",
    phone: "9800000107",
    address: "Birtamod, Jhapa",
    description: "झापा जिल्लाभरको फोहोर संकलन र सरसफाइ सम्बन्धी गुनासो हेर्छ।",
    serviceArea: { province: PROVINCE, district: "Jhapa", municipalities: [] },
  },
];

// ===== Notice (department: mathi ko key) =====
const notices = [
  {
    department: "water",
    title: "खानेपानी आपूर्तिमा अस्थायी अवरोध हुने सम्बन्धी सूचना",
    description:
      "मुख्य पाइपलाइन मर्मत कार्य गरिने भएकाले विराटनगर महानगरपालिका वडा नं. ५, ६ र ७ मा आगामी शनिबार बिहान ८ बजेदेखि साँझ ५ बजेसम्म खानेपानी आपूर्ति बन्द रहने व्यहोरा सम्बन्धित सबैको जानकारीका लागि अनुरोध छ। आवश्यक पानी अग्रिम सञ्चय गरिदिनुहुन अनुरोध गरिन्छ।",
    ward: "5",
    municipality: "Biratnagar Metropolitan City",
    priority: "high",
    category: "notice",
  },
  {
    department: "water",
    title: "वर्षायाममा पानी उमालेर मात्र पिउन अनुरोध",
    description:
      "वर्षायाममा पानीजन्य रोगको जोखिम बढ्ने भएकाले धारा तथा इनारको पानी उमालेर वा शुद्धीकरण गरेर मात्र पिउनुहुन सबै नागरिकमा अनुरोध छ। पानीको रङ वा गन्धमा फरक देखिएमा स्मार्ट सिटी पोर्टलमार्फत गुनासो दर्ता गर्नुहोस्।",
    ward: "",
    municipality: "Dharan Sub-Metropolitan City",
    priority: "medium",
    category: "notice",
  },
  {
    department: "electricity",
    title: "विद्युत लाइन मर्मतका कारण बिजुली कटौती हुने सम्बन्धी सूचना",
    description:
      "इटहरी उपमहानगरपालिका वडा नं. ६ र ७ क्षेत्रमा विद्युत लाइन स्तरोन्नति कार्य हुने भएकाले आगामी आइतबार बिहान १० बजेदेखि दिउँसो २ बजेसम्म विद्युत आपूर्ति अवरुद्ध हुनेछ। असुविधाका लागि क्षमाप्रार्थी छौं।",
    ward: "6",
    municipality: "Itahari Sub-Metropolitan City",
    priority: "high",
    category: "notice",
  },
  {
    department: "electricity",
    title: "झरेको वा झुन्डिएको बिजुलीको तार नछुन अनुरोध",
    description:
      "हावाहुरी तथा वर्षाका कारण विद्युतका तार झर्ने वा झुन्डिने सम्भावना हुन्छ। यस्ता तार कुनै पनि हालतमा नछुनुहोस् र तुरुन्त पोर्टलमा गुनासो दर्ता गर्नुहोस् वा नजिकको कार्यालयमा खबर गर्नुहोस्।",
    ward: "",
    municipality: "Damak Municipality",
    priority: "medium",
    category: "notice",
  },
  {
    department: "road",
    title: "सडक मर्मतका कारण वैकल्पिक मार्ग प्रयोग गर्न अनुरोध",
    description:
      "दमक नगरपालिका वडा नं. ३ स्थित मुख्य सडकखण्डमा कालोपत्रे मर्मत कार्य भइरहेकाले एक हप्तासम्म सो सडकखण्डमा सवारी आवागमन बन्द रहनेछ। सवारी चालकहरूलाई वैकल्पिक मार्ग प्रयोग गर्न अनुरोध छ।",
    ward: "3",
    municipality: "Damak Municipality",
    priority: "medium",
    category: "notice",
  },
  {
    department: "road",
    title: "वर्षाअघि ढल सफाइ अभियान सञ्चालन सम्बन्धी सूचना",
    description:
      "वर्षायाममा डुबान रोक्न धरान उपमहानगरपालिकाका मुख्य ढलहरूको सफाइ अभियान सञ्चालन गरिँदैछ। ढलमा फोहोर नफाल्न र अभियानमा सहयोग गर्न सबै नागरिकमा अनुरोध छ।",
    ward: "",
    municipality: "Dharan Sub-Metropolitan City",
    priority: "low",
    category: "notice",
  },
  {
    department: "transport",
    title: "सार्वजनिक सवारीमा भाडादर सूची राख्न अनिवार्य",
    description:
      "यात्रुहरूको सुविधाका लागि सबै सार्वजनिक सवारी साधनमा स्वीकृत भाडादर सूची सबैले देख्ने ठाउँमा टाँस्नुपर्नेछ। बढी भाडा असुलेमा यात्रुले स्मार्ट सिटी पोर्टलमार्फत गुनासो दर्ता गर्न सक्नुहुनेछ।",
    ward: "",
    municipality: "Itahari Sub-Metropolitan City",
    priority: "medium",
    category: "press",
  },
  {
    department: "wasteBiratnagar",
    title: "फोहोर संकलन तालिका परिवर्तन सम्बन्धी सूचना",
    description:
      "विराटनगर महानगरपालिकाका सबै वडामा अबदेखि कुहिने फोहोर आइतबार, मंगलबार र बिहीबार तथा नकुहिने फोहोर सोमबार र शुक्रबार संकलन गरिनेछ। फोहोर छुट्याएर निर्धारित समयमा मात्र बाहिर राख्नुहुन अनुरोध छ।",
    ward: "",
    municipality: "Biratnagar Metropolitan City",
    priority: "medium",
    category: "notice",
  },
  {
    department: "wasteJhapa",
    title: "खुला ठाउँमा फोहोर जलाउन निषेध",
    description:
      "खुला ठाउँमा फोहोर जलाउँदा वायु प्रदूषण बढ्ने र स्वास्थ्यमा असर पर्ने भएकाले झापा जिल्लाभर फोहोर जलाउन निषेध गरिएको छ। फोहोर जलाएको देखिएमा पोर्टलमार्फत जानकारी गराउनुहोस्।",
    ward: "",
    municipality: "Birtamod Municipality",
    priority: "medium",
    category: "notice",
  },
  {
    department: "water",
    title: "खानेपानी पाइपलाइन विस्तार कार्यको बोलपत्र आह्वान",
    description:
      "इलाम नगरपालिकाका विभिन्न वडामा खानेपानी पाइपलाइन विस्तार कार्यका लागि इच्छुक योग्य फर्महरूबाट बोलपत्र आह्वान गरिएको छ। बोलपत्र फारम र विस्तृत शर्तहरू कार्यालयबाट प्राप्त गर्न सकिनेछ।",
    ward: "",
    municipality: "Ilam Municipality",
    priority: "low",
    category: "tender",
  },
  {
    department: "road",
    title: "स्मार्ट सिटी पोर्टलमार्फत अनलाइन गुनासो दर्ता सुरु",
    description:
      "अबदेखि कोशी प्रदेशका नागरिकले खानेपानी, बिजुली, सडक, यातायात र फोहोर व्यवस्थापन सम्बन्धी गुनासो घरबाटै अनलाइन दर्ता गर्न र दर्ता नम्बरबाट प्रगति हेर्न सक्नुहुनेछ।",
    ward: "",
    municipality: "Biratnagar Metropolitan City",
    priority: "low",
    category: "news",
  },
];

// ===== Event (organizerKey: ayojak department; nabhae portal nai ayojak. image: admin bata halne) =====
const events = [
  {
    title: "निःशुल्क स्वास्थ्य शिविर",
    description:
      "सामान्य स्वास्थ्य जाँच, रक्तचाप, मधुमेह परीक्षण र स्वास्थ्य परामर्श निःशुल्क उपलब्ध हुनेछ। जेष्ठ नागरिक, महिला र बालबालिकालाई प्राथमिकता दिइनेछ।",
    category: "Health Camp",
    location: { province: PROVINCE, district: "Sunsari", municipality: "Dharan Sub-Metropolitan City", ward: "8", tole: "भानुचोक", venue: "सामुदायिक भवन, भानुचोक" },
    startDate: "2026-10-25", startTime: "09:00", endDate: "2026-10-25", endTime: "16:00",
    maxParticipants: 0, isRegistrationRequired: false, isFeatured: true,
  },
  {
    title: "स्वैच्छिक रक्तदान कार्यक्रम",
    description: "रक्तदान गरौं, जीवन बचाऔं। १८ देखि ६० वर्ष उमेरका स्वस्थ नागरिकले रक्तदान गर्न सक्नुहुनेछ। रक्तदाताहरूलाई प्रमाणपत्र प्रदान गरिनेछ।",
    category: "Blood Donation",
    location: { province: PROVINCE, district: "Morang", municipality: "Biratnagar Metropolitan City", ward: "4", tole: "रोडसेस चोक", venue: "सामुदायिक भवन, रोडसेस चोक" },
    startDate: "2026-11-01", startTime: "10:00", endDate: "2026-11-01", endTime: "15:00",
    maxParticipants: 150, isRegistrationRequired: true, isFeatured: true,
  },
  {
    title: "सरसफाइ अभियान: सफा शहर, स्वस्थ नागरिक",
    description: "इटहरीका मुख्य बजार क्षेत्र र सार्वजनिक स्थलमा सामूहिक सरसफाइ अभियान सञ्चालन गरिँदैछ। सरसफाइ सामग्री कार्यक्रमस्थलमै उपलब्ध गराइनेछ।",
    category: "Environment",
    location: { province: PROVINCE, district: "Sunsari", municipality: "Itahari Sub-Metropolitan City", ward: "6", tole: "इटहरी चोक", venue: "इटहरी चोक" },
    startDate: "2026-10-18", startTime: "07:00", endDate: "2026-10-18", endTime: "11:00",
    maxParticipants: 0, isRegistrationRequired: false, isFeatured: false,
    organizerKey: "wasteSunsari",
  },
  {
    title: "डिजिटल साक्षरता तालिम",
    description: "मोबाइल र कम्प्युटरबाट अनलाइन सरकारी सेवा लिने, गुनासो दर्ता गर्ने र डिजिटल भुक्तानी सुरक्षित तरिकाले गर्ने सम्बन्धी एकदिने तालिम।",
    category: "Training",
    location: { province: PROVINCE, district: "Jhapa", municipality: "Damak Municipality", ward: "3", tole: "दमक बजार", venue: "नगर सभाहल" },
    startDate: "2026-11-20", startTime: "10:00", endDate: "2026-11-20", endTime: "16:00",
    maxParticipants: 60, isRegistrationRequired: true, isFeatured: true,
  },
  {
    title: "चिया किसानका लागि जैविक खेती तालिम",
    description: "चिया खेतीमा जैविक मल, रोग नियन्त्रण र गुणस्तर सुधार सम्बन्धी व्यावहारिक तालिम। इच्छुक किसानले अग्रिम दर्ता गर्नुहोला।",
    category: "Agriculture",
    location: { province: PROVINCE, district: "Ilam", municipality: "Ilam Municipality", ward: "2", tole: "", venue: "कृषि ज्ञान केन्द्र हल" },
    startDate: "2026-12-05", startTime: "10:00", endDate: "2026-12-06", endTime: "15:00",
    maxParticipants: 40, isRegistrationRequired: true, isFeatured: false,
  },
  {
    title: "सडक सुरक्षा सचेतना कार्यक्रम",
    description: "विद्यार्थी, सवारी चालक र नागरिकलाई ट्राफिक नियम, हेलमेट तथा सिटबेल्ट प्रयोग र सुरक्षित पैदल यात्रा सम्बन्धी सचेतना कार्यक्रम।",
    category: "Education",
    location: { province: PROVINCE, district: "Jhapa", municipality: "Birtamod Municipality", ward: "5", tole: "बिर्तामोड चोक", venue: "बिर्तामोड चोक" },
    startDate: "2026-12-12", startTime: "11:00", endDate: "2026-12-12", endTime: "14:00",
    maxParticipants: 0, isRegistrationRequired: false, isFeatured: false,
    organizerKey: "transport",
  },
  {
    title: "वृक्षारोपण कार्यक्रम",
    description: "हरियाली प्रवर्द्धनका लागि सार्वजनिक पार्क र सडक किनारमा वृक्षारोपण कार्यक्रम सम्पन्न भयो।",
    category: "Environment",
    location: { province: PROVINCE, district: "Morang", municipality: "Biratnagar Metropolitan City", ward: "9", tole: "", venue: "सार्वजनिक पार्क" },
    startDate: "2026-07-20", startTime: "08:00", endDate: "2026-07-20", endTime: "11:00",
    maxParticipants: 0, isRegistrationRequired: false, isFeatured: false,
    organizerKey: "wasteBiratnagar",
  },
];

// ===== Rastriya aapatkalin number (pura Nepal ma chalne) =====
const emergencyServices = [
  { name: "Nepal Police", type: "police", phone: "100", address: "Nationwide" },
  { name: "Fire Brigade", type: "fire", phone: "101", address: "Nationwide" },
  { name: "Ambulance Service", type: "ambulance", phone: "102", address: "Nationwide" },
  { name: "Traffic Police", type: "traffic", phone: "103", address: "Nationwide" },
  { name: "Child Helpline", type: "other", phone: "1098", address: "Nationwide" },
  { name: "Women Helpline", type: "other", phone: "1145", address: "Nationwide" },

  // ===== Koshi Pradesh ka vastavik sewa (naksa ma dekhine) =====
  // Location: OpenStreetMap (Overpass/Nominatim). Aspatal ko phone: aspatal ko official website,
  // Wikipedia wa sarkari suchi bata jaanchieko matra. Prahari/damkal ma rastriya number (100/101/103),
  // jun jaha bata pani najik ko karyalaya ma jodincha. Number pakka nabhaeka aspatal rakhieko chhaina.

  // Aspatal
  { name: "Koshi Hospital", type: "hospital", phone: "021-530103", address: "Biratnagar, Morang", lat: 26.4595, lng: 87.28534 },
  { name: "Nobel Medical College Teaching Hospital", type: "hospital", phone: "021-460736", address: "Biratnagar, Morang", lat: 26.49, lng: 87.27035 },
  { name: "Birat Medical College Teaching Hospital", type: "hospital", phone: "021-421063", address: "Tankisinwari, Biratnagar, Morang", lat: 26.52338, lng: 87.27892 },
  { name: "B.P. Koirala Institute of Health Sciences (BPKIHS)", type: "hospital", phone: "025-525555", address: "Dharan, Sunsari", lat: 26.81233, lng: 87.26941 },
  { name: "Provincial Hospital Bhadrapur", type: "hospital", phone: "023-523024", address: "Bhadrapur, Jhapa", lat: 26.55708, lng: 88.08808 },
  { name: "B&C Medical College Teaching Hospital", type: "hospital", phone: "023-542242", address: "Birtamod, Jhapa", lat: 26.64471, lng: 87.99746 },
  { name: "AMDA Hospital", type: "hospital", phone: "023-580186", address: "Damak-2, Jhapa", lat: 26.6746, lng: 87.68833 },
  { name: "AMDA Mechi Hospital", type: "hospital", phone: "023-564550", address: "Dhulabari, Mechinagar, Jhapa", lat: 26.667, lng: 88.09462 },
  { name: "Ilam Hospital", type: "hospital", phone: "027-520044", address: "Ilam", lat: 26.90919, lng: 87.9267 },
  { name: "Dhankuta District Hospital", type: "hospital", phone: "9852061641", address: "Dhankuta-7, Dhankuta", lat: 26.97207, lng: 87.3436 },

  // Prahari (100)
  { name: "District Police Office, Morang", type: "police", phone: "100", address: "Biratnagar, Morang", lat: 26.47479, lng: 87.28836 },
  { name: "Itahari Police Station", type: "police", phone: "100", address: "Itahari, Sunsari", lat: 26.66241, lng: 87.27725 },
  { name: "District Police Office, Jhapa", type: "police", phone: "100", address: "Bhadrapur, Jhapa", lat: 26.56886, lng: 88.07251 },
  { name: "Area Police Office, Birtamod", type: "police", phone: "100", address: "Birtamod, Jhapa", lat: 26.64286, lng: 87.99611 },
  { name: "Damak Police Station", type: "police", phone: "100", address: "Damak, Jhapa", lat: 26.66032, lng: 87.70028 },
  { name: "Dhankuta Police Station", type: "police", phone: "100", address: "Dhankuta", lat: 26.97534, lng: 87.34368 },
  { name: "District Police Office, Udayapur", type: "police", phone: "100", address: "Gaighat, Udayapur", lat: 26.79743, lng: 86.69702 },
  { name: "District Police Office, Khotang", type: "police", phone: "100", address: "Diktel, Khotang", lat: 27.21174, lng: 86.79261 },
  { name: "District Police Office, Solukhumbu", type: "police", phone: "100", address: "Salleri, Solukhumbu", lat: 27.50618, lng: 86.58462 },

  // Traffic (103) ra damkal (101)
  { name: "District Traffic Police Office, Morang", type: "traffic", phone: "103", address: "Biratnagar, Morang", lat: 26.45441, lng: 87.27974 },
  { name: "Traffic Police, Itahari", type: "traffic", phone: "103", address: "Itahari, Sunsari", lat: 26.66514, lng: 87.26432 },
  { name: "Dharan Fire Brigade", type: "fire", phone: "101", address: "Dharan, Sunsari", lat: 26.80177, lng: 87.27342 },
];

module.exports = { departments, notices, events, emergencyServices };
