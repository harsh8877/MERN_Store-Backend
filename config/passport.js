const passport = require("passport");
const Auth0Strategy = require("passport-auth0"); // Integration with Auth0 login

passport.use(
  new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL,
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user)); // saves user info to session
passport.deserializeUser((user, done) => done(null, user)); // retrieves user info from session

module.exports = passport;
