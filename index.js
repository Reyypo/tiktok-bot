require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const { setupRolePanel, handleRoleInteraction } = require('./rolePanel');
const { startTikTokLiveChecker } = require('./tiktokLive');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'restarea_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/');
}

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', passport.authenticate('discord'));

app.get('/callback',
  passport.authenticate('discord', {
    failureRedirect: '/'
  }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', {
    user: req.user
  });
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server hidup');
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', async () => {
  console.log(`Discord bot online: ${client.user.tag}`);

  client.user.setPresence({
    status: 'online',
    activities: [{
      name: 'Wellcome',
      type: 3
    }]
  });

  await setupRolePanel(client);

  startTikTokLiveChecker(client);
});

client.on('interactionCreate', async interaction => {
  await handleRoleInteraction(interaction);
});

client.login(DISCORD_TOKEN);