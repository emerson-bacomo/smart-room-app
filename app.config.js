import "dotenv/config";

export default ({ config }) => ({
    ...config,
    extra: {
        API_BASE_URL: "https://smart-room-app-backend.onrender.com",
        MQTT_URL: "wss://smart-room-app-backend.onrender.com/mqtt",
        eas: {
            projectId: process.env.EAS_PROJECT_ID,
        },
    },
});
