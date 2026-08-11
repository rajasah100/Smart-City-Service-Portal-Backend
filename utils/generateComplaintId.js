const generateComplaintId = () => {
  const year = new Date().getFullYear();
  return `SCP-${year}-${Date.now()}`;
};

module.exports = generateComplaintId;