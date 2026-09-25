require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_real_chile_rp',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/');
});

app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            loggedIn: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                avatar: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

let cedulas = {};

app.post('/api/cedula/guardar', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('No autorizado');
    const data = req.body;
    cedulas[req.user.id] = {
        rut: `${Math.floor(10000000 + Math.random() * 80000000)}-${Math.floor(Math.random() * 9)}`,
        nombre: data.nombre,
        fecha: data.fecha,
        nacionalidad: data.nacionalidad,
        trabajo: data.trabajo
    };
    res.json({ ok: true, cedula: cedulas[req.user.id] });
});

app.get('/api/cedula/mi-cedula', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('No autorizado');
    res.json(cedulas[req.user.id] || null);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
                                                                             
