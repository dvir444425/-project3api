const mongoose = require('mongoose');
const dotenv = require('dotenv'); // loads environment variables from a .env file into process.env

const app = require('./app');
dotenv.config({ path: './config.env' });

// setting the db information
const DB = process.env.DATABASE.replace(
	'<PASSWORD>',
	process.env.DATABASE_PASSWORD
);

// connecting to the Data Base
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connection successful! ✔️'));

// srtting the server's port if it wasn't already set
const port = process.env.PORT || 3000;

// launching the app
const server = app.listen(port, () => {
	console.log(`App running on port ${port}...`);
});
