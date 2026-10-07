const { messaging } = require("../config/firebase");

// FCM data ko sabai value string hunu parcha
const toStringData = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)]),
  );

const sendPushNotification = async({
  token,
  title,
  body,
  data = {},
}) => {
    try {
        const message = { token, notification: { title, body }, data: toStringData(data) };

        const response = await messaging.send(message);

        return response;
    } catch (error) {
        console.error("Notification Error:", error.message);

        throw error;
    }
};

// Dherai device ma ekai patak pathaune. Kaam nagarne (expired) token haru return garcha
const sendPushToMany = async ({
  tokens,
  title,
  body,
  link,
  data = {},
  urgent = false,
}) => {
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];

  if (uniqueTokens.length === 0) return { invalidTokens: [] };

  const response = await messaging.sendEachForMulticast({
    tokens: uniqueTokens,
    notification: { title, body },
    data: toStringData(data),
    webpush: {
      headers: urgent ? { Urgency: "high" } : {},
      notification: {
        icon: "/logo.png",
        // SOS notification user le band nagare samma screen ma basos
        requireInteraction: urgent,
        tag: data.sosId ? `sos-${data.sosId}` : undefined,
        renotify: urgent,
      },
      fcmOptions: link ? { link } : undefined,
    },
  });

  const invalidTokens = [];

  response.responses.forEach((result, index) => {
    const code = result.error?.code;

    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      invalidTokens.push(uniqueTokens[index]);
    }
  });

  return { invalidTokens };
};

module.exports = { sendPushNotification, sendPushToMany };
