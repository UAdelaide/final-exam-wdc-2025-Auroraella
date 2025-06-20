var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { mkdtempSync } = require('fs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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

    // Q%; SQL insert into
    const [userRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (userRows[0].count === 0) {
      await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol', 'carol@example.com', 'hashed789', 'owner'),
        ('mina', 'mina@example.com', 'hashed000', 'walker'),
        ('mimi', 'mimi@example.com', 'hashed199', 'owner')
      `);
    }

    const [dogRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogRows[0].count === 0) {
      const [owners] = await db.execute("SELECT user_id, username FROM Users WHERE role='owner'");
      const alice = owners.find(u => u.username === 'alice123');
      const carol = owners.find(u => u.username === 'carol123');
      const mimi = owners.find(u => u.username === 'mimi');
      await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES
        (${alice.user_id}, 'Max', 'medium'),
        (${carol.user_id}, 'Bella', 'small'),
        (${alice.user_id}, 'Milu', 'large'),
        (${carol.user_id}, 'Candy', 'small'),
        (${mimi.user_id}, 'Apple', 'small'),
      `);
    }

    const [walkRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walkRows[0].count === 0) {
      const max = dogs.find(d => d.name === 'Max');
      const bella = dogs.find(d => d.name === 'Bella');
      const milu = dogs.find(d => d.name === 'Milu');
      const candy = dogs.find(d => d.name === 'Candy');
      const apple = dogs.find(d => d.name === 'Apple');
      await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        (${max.dog_id}, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        (${bella.dog_id}, '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        (${milu.dog_id}, '2025-06-11 09:45:00', 60, 'Prospect', 'open'),
        (${candy.dog_id}, '2025-06-12 11:30:00', 30, 'Harbour Town', 'completed'),
        (${apple.dog_id}, '2025-06-14 12:00:00', 40, 'Glenelg', 'open'),
      `);
    }

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Q6 to 8
// API Dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows]= await db.execute(`
        SELECT d.name AS dog_name, d.size, u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);

  } catch (err) {
   res.status(500).json({ error: 'Failed to fetch dogs'});

   }
});

// API Walk Requests
app.get('/api/walkrequests/open', async (req, res) => {

}):



module.exports = app;
