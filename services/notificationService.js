const { messaging } = require("../config/firebase");

const sendPushNotification = async({
  token,
  title,
  body,
  data = {},
}) => {
    try {
        const message = { token, notification: { title, body }, data,};

        const response = await messaging.send("message");

        return response;
    } catch (error) {
        console.error("Notification Error:", error.message);

        throw error;
    }
};

module.exports = { sendPushNotification };
