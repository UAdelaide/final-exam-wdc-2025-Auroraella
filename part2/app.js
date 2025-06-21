const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();


function requireAuth(req, res, next) {
    if (!req.session.user) {
        if (req.path.endsWith('.html') || req.path === '/') {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
}
function requireOwner(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    if (req.session.user.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
function requireWalker(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    if (req.session.user.role !== 'walker') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'dogwalksecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, '/public'), {
    setHeaders: (res, paths) => {
        if (paths.endsWith('index.html')
            || paths.includes('/images/')
            || paths.includes('/stylesheets/')
            || paths.includes('/javascripts/')) {
            return;
        }
    }
}));
app.get('/owner-dashboard.html', requireOwner, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'owner-dashboard.html'));
});
app.get('/walker-dashboard.html', requireWalker, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'walker-dashboard.html'));
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes'); // Q17

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);


app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'owner') {
            return res.redirect('/owner-dashboard.html');
        } else if (req.session.user.role === 'walker') {
            return res.redirect('/walker-dashboard.html');
        }
    }
    res.redirect('/index.html');
}
);

// Export the app instead of listening here
module.exports = {
    app: app,
    requireAuth: requireAuth,
    requireOwner: requireOwner,
    requireWalker: requireWalker
};
