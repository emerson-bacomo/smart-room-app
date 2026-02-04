import "dotenv/config";

export default ({ config }) => ({
    ...config,
    extra: {
        API_BASE_URL: "https://smart-room-app-backend.onrender.com",
        eas: {
            projectId: process.env.EAS_PROJECT_ID,
        },
    },
});
