const OpenAI = require("openai");

const { getLatestNotices, getAllDepartments } = require("./aiTools");

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const generateAIResponse = async (message, user) => {
  try {
    const userMessage = message.toLowerCase();

    // Complaint Guideline

    if (
      userMessage.includes("complaint") ||
      userMessage.includes("register complaint") ||
      userMessage.includes("file complaint") ||
      userMessage.includes("submit complaint") ||
      userMessage.includes("गुनासो") ||
      userMessage.includes("उजुरी")
    ) {
      return {
        success: true,
        message: `I can help you with complaint registration.

Follow these steps:

1. Open the Complaint Page.
2. Fill in your personal information.
3. Select the appropriate department.
4. Enter the complaint title and description.
5. Upload supporting images (optional).
6. Select the complaint location on the map.
7. Review your information.
8. Submit the complaint.

Click the button below to open the Complaint Registration page.`,
        action: "open_complaint_page",
      };
    }

    // Latest Notices

    if (
      userMessage.includes("notice") ||
      userMessage.includes("latest notice") ||
      userMessage.includes("latest notices") ||
      userMessage.includes("news") ||
      userMessage.includes("सूचना") ||
      userMessage.includes("आजको सूचना")
    ) {
      const notices = await getLatestNotices();

      if (!notices.length) {
        return "No notices are available at the moment.";
      }

      const noticeText = notices
        .map(
          (notice, index) => `
${index + 1}. ${notice.title}

${notice.description || "No description"}

Priority: ${notice.priority || "Normal"}
`,
        )
        .join("\n");

      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content: `
You are the official AI Assistant of Smart City Service Portal.

The notices below are fetched from the official database.

Rules:
- Reply in the user's language.
- Do not invent any notice.
- Summarize clearly.
- Keep the response short and readable.
            `,
          },
          {
            role: "user",
            content: `
User Question:
${message}

Available Notices:

${noticeText}
            `,
          },
        ],

        temperature: 0.3,
        max_tokens: 500,
      });

      return completion.choices[0].message.content;
    }

    // All Departments

    if (
      userMessage.includes("all departments") ||
      userMessage.includes("department list") ||
      userMessage.includes("departments") ||
      userMessage.includes("list of departments") ||
      userMessage.includes("विभाग") ||
      userMessage.includes("विभागहरूको सूची")
    ) {
      const departments = await getAllDepartments();

      if (!departments.length) {
        return "No departments found.";
      }

      const departmentList = departments
        .map(
          (dept, index) => `
${index + 1}. ${dept.name}

📞 Phone : ${dept.phone || "N/A"}

📧 Email : ${dept.email || "N/A"}

📍 Address : ${dept.address || "N/A"}

📝 ${dept.description || ""}
`,
        )
        .join("\n");

      return departmentList;
    }

    // Single Department Contact

    if (
      userMessage.includes("water") ||
      userMessage.includes("road") ||
      userMessage.includes("health") ||
      userMessage.includes("electricity") ||
      userMessage.includes("waste") ||
      userMessage.includes("transport") ||
      userMessage.includes("पानी") ||
      userMessage.includes("सडक") ||
      userMessage.includes("स्वास्थ्य") ||
      userMessage.includes("फोहोर") ||
      userMessage.includes("यातायात")
    ) {
      const departments = await getAllDepartments();

      const department = departments.find((dept) => {
        const name = dept.name.toLowerCase();

        return (
          userMessage.includes(name) ||
          userMessage.includes(name.replace(" department", "")) ||
          userMessage.includes(name.replace(" office", ""))
        );
      });

      if (!department) {
        return "Department not found.";
      }

      return `
🏢 Department : ${department.name}

📞 Phone : ${department.phone || "N/A"}

📧 Email : ${department.email || "N/A"}

📍 Address : ${department.address || "N/A"}

📝 Description : ${department.description || "N/A"}
`;
    }

    // Default AI Chat

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
You are the official AI Assistant of Smart City Service Portal.

Rules:
- Reply in the same language as the user.
- If the user asks in Nepali, answer in Nepali.
- If the user asks in English, answer in English.
- Keep answers short, clear and helpful.

You can help with:
• Government Services
• Notices
• Departments
• Emergency Services
• Ward Information
• Municipality Information
• Public Services

IMPORTANT:
- Never register complaints inside the AI chat.
- If the user wants to file or register a complaint, tell them to use the Complaint page.
- Never invent notices or department information.
- If you don't know something, politely say so.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],

      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Groq Error:", error);
    throw error;
  }
};

module.exports = generateAIResponse;
