const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); // used to limit number of requests from the same api
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');

const userRouter = require('./routes/userRoutes');
const app = express();

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());
app.use(cors());

app.get('/public/passwordResetPage.html/:id', (req, res) => {
	res.sendFile(`${__dirname}/public/passwordResetPage.html`);
});

app.get('http://127.0.0.1:3000/public/passwordWasReset.html', (req, res) => {
	res.sendFile(`${__dirname}/public/passwordWasReset.html`);
});

app.use('/api/users', userRouter);

module.exports = app;
