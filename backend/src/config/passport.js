import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

/**
 * Configures the Passport Google OAuth 2.0 strategy.
 *
 * Flow:
 *  1. Frontend redirects the browser to GET /api/auth/google/redirect
 *  2. Backend (this strategy) redirects to Google's consent screen
 *  3. Google redirects back to GET /api/auth/google/callback with a code
 *  4. Passport exchanges the code for a profile (name, email, googleId, photo)
 *  5. The verify callback below upserts a User document:
 *       - First-time sign-in -> creates a new shop_owner with shopId: null
 *       - Returning sign-in   -> loads the existing user (owner or staff)
 *  6. The route handler (authController.googleCallback) issues our own
 *     JWT and redirects the browser back to the frontend with it.
 *
 * NOTE: passport-session is intentionally NOT used for the app itself -
 * sessions are only used transiently during the OAuth handshake. Once
 * the callback fires, we issue a stateless JWT exactly like the rest
 * of the app and never touch req.session again.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const name = profile.displayName || email?.split("@")[0] || "User";
        const avatarUrl = profile.photos?.[0]?.value || "";

        if (!email) {
          return done(new Error("Google account did not return an email address"), null);
        }

        let user = await User.findOne({ email });

        if (!user) {
          // First-time Google sign-in -> create a new shop_owner with
          // no shop yet. They'll be routed to the onboarding wizard.
          user = await User.create({
            shopId: null,
            name,
            email,
            authProvider: "Google",
            googleId,
            avatarUrl,
            role: "shop_owner",
          });
        } else {
          // Returning user - keep googleId/avatar in sync, but never
          // touch role/shopId here (those are managed elsewhere).
          let changed = false;
          if (!user.googleId) { user.googleId = googleId; changed = true; }
          if (avatarUrl && user.avatarUrl !== avatarUrl) { user.avatarUrl = avatarUrl; changed = true; }
          if (changed) await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Required by passport even though we don't use persistent login
// sessions for the app - only for the brief OAuth handshake itself.
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
