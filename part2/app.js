const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

function requireOwner(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/');
    }
    if (req.session.user.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
function requireWalker(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/');
    }
    if (req.session.user.role !== 'walker') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
// Middleware
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dogwalksecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.get('/owner-dashboard', requireOwner, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'owner-dashboard.html'));
});
app.get('/walker-dashboard', requireWalker, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'walker-dashboard.html'));
});
app.get('/index', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'owner') {
            return res.redirect('/owner-dashboard');
        }
        if (req.session.user.role === 'walker') {
            return res.redirect('/walker-dashboard');
        }
    }
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/', (req, res) => res.redirect('/index'));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes'); // Q17

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;
