const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'dogwalksecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
function requireAuth(req, res, next) {
    if (!req.session.user) {
        if (req.path.endsWith('.html') || req.path === '/') {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
function requireOwner
// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes'); // Q17

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;
