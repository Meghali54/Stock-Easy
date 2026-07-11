import cron from "node-cron";

// Schedules a self-ping every 14 minutes so Render's free tier never
// spins down the server due to inactivity (spin-down threshold is 15
// minutes of no incoming requests).
//
// The cron expression means: every 14 minutes, every hour, every day.
// It starts running as soon as the server boots.
//
// RENDER_EXTERNAL_URL is automatically injected by Render into every
// web service's environment. Locally it is undefined, so we skip the
// ping entirely in development (no need to keep localhost awake).

export const startKeepAlive = () => {
  const serviceUrl = process.env.RENDER_EXTERNAL_URL;

  if (!serviceUrl) {
    console.log("ℹ️  Keep-alive cron skipped (RENDER_EXTERNAL_URL not set — running locally)");
    return;
  }

  const pingUrl = `${serviceUrl}/api/ping`;
  console.log(`✅ Keep-alive cron started — pinging ${pingUrl} every 14 minutes`);

  cron.schedule("*/14 * * * *", async () => {
    try {
      const res = await fetch(pingUrl);
      const data = await res.json();
      console.log(`[keep-alive] ping OK at ${data.time}`);
    } catch (err) {
      console.error("[keep-alive] ping failed:", err.message);
    }
  });
};