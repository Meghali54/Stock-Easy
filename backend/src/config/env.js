import dotenv from "dotenv";

// Loading dotenv here, in its own file that gets imported first inside
// server.js, guarantees process.env is fully populated BEFORE any other
// module (like passport.js, which reads GOOGLE_CLIENT_ID at import time)
// gets evaluated. ES module imports run top-to-bottom in the order they
// appear, so as long as this import is the very first line in server.js,
// every other import that follows can safely rely on process.env being ready.
dotenv.config();