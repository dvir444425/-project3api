const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const Schema = mongoose.Schema;
const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(router);

// connecting to the Data Base
const dbName = 'project4';
const dbPassword = 'Bie4ENNU9R2Ss6Jn';
const DB = `mongodb+srv://dviros:${dbPassword}@cluster0.uk9nn.mongodb.net/${dbName}?retryWrites=true&w=majority`;
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connection successful!'));
// ----------------------------------------------------------------

// // creating schema
// const userDataSchema = new mongoose.Schema(
// 	{
// 		_id: mongoose.Schema.Types.ObjectId,
// 		firstName: { type: String, required: true },
// 		lastName: { type: String, required: true },
// 		password: { type: String, required: true },
// 		email: { type: String, required: true },
// 		expireDate: { type: String, required: true },
// 		photo: { type: String, required: true },
// 		active: {
// 			type: Boolean,
// 			default: true,
// 			select: false,
// 		},
// 	},
// 	{ collection: 'users-collection' }
// );
// // using the schema we just created
// const UserData = mongoose.model('UserData', userDataSchema);
// // -----------------------------------------------------------------

// // Create a new user in the database
// router.post('/post-data', (req, res, next) => {
// 	const user = new UserData({
// 		_id: new mongoose.Types.ObjectId(), // it might not been needed
// 		firstName: req.body.firstName,
// 		lastName: req.body.lastName,
// 		password: req.body.password,
// 		email: req.body.email,
// 		expireDate: req.body.expireDate,
// 		photo: req.body.photo,
// 	});

// 	user
// 		.save()
// 		.then((result) => {
// 			console.log('✔️ Successfully created data! ✔️');
// 		})
// 		.catch((err) => {
// 			console.log(`error: ${err}`);
// 		});

// 	res.status(201).json({
// 		message: '✔️ Data posted successfully! ✔️',
// 		createdUser: user,
// 	});

// 	res.end();
// });
// // ----------------------------------------------------------------

// // read users list from the database
// router.get('/users', (req, res, next) => {
// 	UserData.find()
// 		.then((doc) => {
// 			res.status(200).json({
// 				message: '✔️ Users list was successfully found ! ✔️',
// 				results: doc.length,
// 				users: doc,
// 			});
// 		})
// 		.catch((err) => {
// 			console.log(`error: ${err}`);
// 		});
// });

// // read user by id from the database
// router.get('/users/:userId', (req, res, next) => {
// 	UserData.findById(req.params.userId)
// 		.exec()
// 		.then((doc) => {
// 			res.status(200).json({
// 				message: '✔️ User found successfully! ✔️',
// 				user: doc,
// 			});
// 		})
// 		.catch((err) => {
// 			console.log(`error: ${err}`);
// 		});
// });
// // -------------------------------------------------------------

// // update user information by Id in the database
// router.patch('/update-user/:userId', async (req, res, next) => {
// 	await UserData.findByIdAndUpdate(req.params.userId, req.body, {
// 		new: true, //now, the document that will be returned will be the new one
// 	})
// 		.exec()
// 		.then((result) => {
// 			res.status(200).json({
// 				message: '✔️ User updated successfully! ✔️',
// 				user: result,
// 			});
// 		})
// 		.catch((err) => {
// 			console.log(`error: ${err}`);
// 		});
// });
// // -------------------------------------------------------------

// remove a user from the database
// router.delete('/delete-user/:userId', (req, res, next) => {
// 	UserData.remove({ _id: req.params.userId })
// 		.exec()
// 		.then((result) => {
// 			res.status(200).json({
// 				message: '✔️ User deleted successfully! ✔️',
// 			});
// 		})
// 		.catch((err) => console.log(err));
// });
// // -------------------------------------------------------------

app.listen(3000, () => {
	console.log('App is running on port 3000!!');
});
