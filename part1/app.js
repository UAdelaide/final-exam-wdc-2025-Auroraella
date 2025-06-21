// eslint-disable-next-line no-unused-vars
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mysql = require('mysql2/promise');
var app = express();

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Q5: SQL insert into
    const [userRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (userRows[0].count === 0) {
      await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('mina', 'mina@example.com', 'hashed000', 'walker'),
        ('mimi', 'mimi@example.com', 'hashed199', 'owner')
      `);
    }

    const [dogRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogRows[0].count === 0) {
      await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Milu', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'mimi'), 'Candy', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Apple', 'small')
      `);
    }

    const [walkRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walkRows[0].count === 0) {
      await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Milu' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-11 09:45:00', 60, 'Prospect', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Candy' AND owner_id = (SELECT user_id FROM Users WHERE username = 'mimi')), '2025-06-12 11:30:00', 30, 'Harbour Town', 'completed'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Apple' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-14 12:00:00', 40, 'Glenelg', 'open')
      `);
    }

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

// Q6 to 8
// API Dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
        SELECT d.name AS dog_name, d.size, u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });

  }
});

// API Walk Requests
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// API Walkers
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username                                            AS walker_username,
        COUNT(wr_ratings.rating)                              AS total_ratings,
        CASE
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      LEFT JOIN WalkRequests wr ON wr.request_id = r.request_id AND wr.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});


module.exports = app;
