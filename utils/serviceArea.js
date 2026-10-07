// Department ko sewa kshetra (serviceArea) sambandhi helper

// Admin bata aaeko data safa garne: tala ko taha mathi ko bina hudaina
const cleanServiceArea = (input = {}) => {
  const province = String(input.province || "").trim();
  const district = province ? String(input.district || "").trim() : "";
  const municipalities = district && Array.isArray(input.municipalities)
    ? [...new Set(input.municipalities.map((item) => String(item).trim()).filter(Boolean))]
    : [];

  return { province, district, municipalities };
};

// Yo department le yo thau ko gunaso herchha ki?
const coversLocation = (area = {}, location = {}) => {
  if (!area.province) return true;
  if (area.province !== location.province) return false;

  if (!area.district) return true;
  if (area.district !== location.district) return false;

  if (!area.municipalities?.length) return true;
  return area.municipalities.includes(location.municipality);
};

module.exports = { cleanServiceArea, coversLocation };
