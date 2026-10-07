// Smart City AI sahayak: Groq (OpenAI-compatible) + tool calling.
// Tathya (suchana, vibhag, phone, gunaso ko avastha) sabai tool bata database bata; AI le aafai nabanaos.
const OpenAI = require("openai");
const { toolDefinitions, runTool, NATIONAL_HOTLINES } = require("./aiTools");

// Pahilo model hatyo/chalena bhae arko (Groq le purano model hatauchha)
const MODELS = [process.env.GROQ_MODEL, "openai/gpt-oss-120b", "qwen/qwen3.8-27b"].filter(Boolean);
const MAX_TOOL_ROUNDS = 4;

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = ({ user, language }) => `You are the official AI assistant of "Smart City Service Portal" (स्मार्ट सिटी सेवा पोर्टल), a citizen service portal in Nepal.
Today is ${new Date().toISOString().slice(0, 10)}. The website language is ${language === "en" ? "English" : "Nepali"}.
${user ? `The citizen is logged in as ${user.name}.` : "The citizen is not logged in (guest)."}

How to answer:
- Reply in the language the citizen writes in. Nepali (Devanagari) → reply in clear, polite Nepali. English → English. Romanized Nepali → reply in Nepali (Devanagari).
- Be short and practical: a few sentences or a short list. Use **bold** for key items and "- " for lists. No tables, no headings.
- Use tools for every fact about notices, departments, phone numbers, events, complaints and the office. Never invent names, numbers, dates or statuses. If a tool has no data, say so honestly.
- When you mention a portal page, call the open_page tool so the citizen gets a button. Never write tool names, links or placeholders like {{open_page}} or (open_page ...) in your text.
- Write phone numbers and registration numbers exactly as the tools give them, with English digits (e.g. 021-530103), even in a Nepali reply.

Complaints:
- If the citizen describes a civic problem (no water, power cut, pothole, garbage, broken street light, etc.), call get_departments, pick the department whose name and service area fit, then call draft_complaint with a clear title and description in the citizen's language. Ask one short question first only if the problem is too vague to write a description.
- After draft_complaint, reply with ONE or two short sentences (e.g. that the draft is ready and which department will receive it). Do not repeat the title, description or priority — the citizen sees them on a card with a button.
- You cannot submit complaints yourself. The citizen opens the pre-filled form, marks the location on the map, adds photos and submits.
- To check a complaint: logged-in citizens → get_my_complaints or track_complaint. If a tool says LOGIN_REQUIRED, ask them to log in (open_page login).

Emergencies:
- If someone's life or property is in danger (fire, accident, crime, serious illness), FIRST tell them to call immediately: Police 100, Fire 101, Ambulance 102. Then offer the Emergency page (open_page emergency). Keep it very short.

Stay on topic: city services, the portal and public information. Politely decline unrelated requests. Do not give medical or legal diagnoses.`;

// Model le kahile tool chalaunu satta text ma "open_page page=..." lekhchha: button banaune ra text bata hataune
const PAGE_PATHS = {
  complaint: "/complaint",
  my_complaints: "/user/complaints",
  emergency: "/emergency",
  notices: "/notices",
  events: "/events",
  services: "/services",
  about: "/about",
  login: "/login",
  register: "/register",
};
const PAGE_PLACEHOLDER = /(\[[^\]\n]*\]\s*)?[({]*\s*open_page\s*\(?\s*page\s*[=:]\s*["']?(\w+)["']?\s*\)?[)}]*/g;

const tidy = (text, actions) =>
  text
    .replace(PAGE_PLACEHOLDER, (match, label, page) => {
      if (PAGE_PATHS[page] && !actions.some((a) => a.page === page)) actions.push({ type: "open_page", page, path: PAGE_PATHS[page] });
      return "";
    })
    // Model le chhodeko "[button text]" matra bhaeko line
    .replace(/^\s*\[[^\]\n]{1,60}\]\s*$/gm, "")
    .replace(/[:：]\s*$/gm, (colon) => (colon.trim() ? "." : colon))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Frontend bata aaeko purano kurakani: role/text jaanch, lamo bhae katne
const cleanHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

// Model napaye (404) arko model; bigreko tool call (400 tool_use_failed) bhae tool bina ek choti pheri
const complete = async (messages, withTools, modelIndex = 0) => {
  try {
    return await client.chat.completions.create({
      model: MODELS[modelIndex],
      messages,
      ...(withTools ? { tools: toolDefinitions, tool_choice: "auto" } : {}),
      temperature: 0.3,
      max_tokens: 1200,
    });
  } catch (error) {
    if (error.status === 404 && modelIndex < MODELS.length - 1) return complete(messages, withTools, modelIndex + 1);
    if (withTools && error.status === 400) return complete(messages, false, modelIndex);
    throw error;
  }
};

const askAssistant = async ({ message, history, user, language }) => {
  const actions = [];
  const context = { user, actions };
  const messages = [
    { role: "system", content: systemPrompt({ user, language }) },
    ...cleanHistory(history),
    { role: "user", content: message },
  ];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const completion = await complete(messages, round < MAX_TOOL_ROUNDS);
    const reply = completion.choices[0].message;

    if (!reply.tool_calls?.length) {
      return { text: tidy(reply.content || "", actions), actions };
    }

    messages.push({ role: "assistant", content: reply.content || "", tool_calls: reply.tool_calls });

    for (const call of reply.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      const result = await runTool(call.function.name, args, context);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 6000) });
    }
  }

  return { text: "", actions };
};

module.exports = { askAssistant, NATIONAL_HOTLINES };
