const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// creating a jwt token. (id is the payload)(second part is the secret key)(third pard is when will the token expire)
const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	res.status(statusCode).json({
		status: '✔️ Successfully loged in! ✔️',
		id: user._id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		token: token,
	});
};
// ----------------------------------------------------------------

// Create a new user in the database
exports.createUser = catchAsync(async (req, res, next) => {
	const newUser = await User.create(req.body);

	res.status(201).json({
		status: 'success',
		message: '✔️ Successfully created user! ✔️',
		createdUser: {
			id: newUser._id,
			firstName: newUser.firstName,
			lastName: newUser.lastName,
			email: newUser.email,
			expireDate: newUser.expireDate,
			profileImage: newUser.profileImage,
			role: newUser.role,
			isActive: newUser.isActive,
		},
	});

	await new Email(newUser).sendWelcome();
});
// ----------------------------------------------------------------

// Logs-in the user to the system
exports.loginUser = catchAsync(async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	// check if email and password exist
	if (!email || !password) {
		return next(new AppError('Please enter email and password to login', 400));
	}

	// check if user exist and password is correct
	const user = await User.findOne({ email: email }).select('+password'); // The exlucde always but include sometimes prevents the password from being returned
	// console.log(`✔️ ${signToken(user._id)} ✔️`);

	// check if the entered password and exist password are the same. if there is no data in user, or passwords don't match, returns an AppError
	if (!user || !(await user.isPasswordCorrect(password, user.password))) {
		return next(new AppError('Email or password is incorrect'));
	}

	// check if user expired. if yes, login isn't allowed
	if (user.isUserExpired(Date.now()) == true) {
		// set the isActive status
		user.isActive = false;

		await user.save();

		return next(new AppError('User is expired! Please contact system administrator'));
	}

	// check if isActive false. if false, login isn't allowed
	if (user.isActive == false) {
		return next(new AppError('User is not active! Please contact system administrator'));
	}

	// we get here if everything is ok
	createSendToken(user, 200, res);
});
// ----------------------------------------------------------------

// send the user email reset password
exports.sendResetPasswordEmail = catchAsync(async (req, res, next) => {
	const user = {
		email: req.body.email,
	};
	// check if email and password exist
	if (!user.email) {
		return next(new AppError('Please enter email to reset your password', 400));
	}

	// currentUser.resetPassword
	const currentUser = await User.findOne({ email: req.body.email }).select('+password'); // The exlucde always but include sometimes prevents the password from being returned

	// 2) Generate the random reset token
	const resetToken = currentUser.createPasswordResetToken();
	await currentUser.save({ validateBeforeSave: false });

	// 3) Send it to user's email
	try {
		const resetURL = `${req.protocol}://${req.get('host')}/public/passwordResetPage.html/${resetToken}`;
		await new Email(currentUser, resetURL).sendPasswordReset();

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!',
		});
	} catch (err) {
		currentUser.passwordResetToken = undefined;
		currentUser.passwordResetExpires = undefined;
		await currentUser.save({ validateBeforeSave: false });

		return next(new AppError('There was an error sending the email. Try again later!'), 500);
	}
});
// ----------------------------------------------------------------

// Resets the user's password when providing an email address
exports.resetPasswordOld = catchAsync(async (req, res, next) => {
	const email = req.body.email;
	const newPassword = req.body.newPassword;

	// check if email exists
	if (!email || !newPassword) {
		return next(new AppError('Please enter email and new password', 400));
	}

	// check if user exist and password is correct
	const user = await User.findOne({ email: email }).select('+password'); // The exlucde always but include sometimes prevents the password from being returned

	// setting the new password
	user.password = newPassword;
	await user.save();

	res.sendFile(`http://127.0.0.1:3000/public/passwordResetPage.html`);
});
// ----------------------------------------------------------------

// Resets the user's password from web page using the token
exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on the token
	const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});

	// 2) If token has not expired, and there is user, set the new password
	if (!user) {
		return next(new AppError('Token is invalid or has expired', 400));
	}
	user.password = req.body.newPassword;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();

	// // 4) Log the user in, send JWT
	// createSendToken(user, 200, res);

	res.sendfile(`public/passwordWasReset.html`);
});
// ----------------------------------------------------------------

// changes user's status (active: true/false)
exports.changeUserIsActive = catchAsync(async (req, res, next) => {
	const email = req.body.email;
	const newIsActive = req.body.isActive;

	// check if email and isActive exists
	if (!email || !newIsActive) {
		return next(new AppError('Please enter email and isActive status', 400));
	}

	// check if user exist
	const user = await User.findOne({ email: email }).select('+password'); // The exlucde always but include sometimes prevents the password from being returned

	// set the isActive status
	user.isActive = newIsActive;

	await user.save();

	// we get here if everything is ok
	res.status(200).json({
		status: 'success',
		message: '✔️ User active status was set successfully! ✔️',
		isActive: user.isActive,
	});
});
// ----------------------------------------------------------------

// protect routs - only available with jwt token(when logged in)
exports.protect = catchAsync(async (req, res, next) => {
	// getting the token and checking if logged in
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(new AppError('You are not logged in! Please log in to get access.', 401));
	}

	// Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

	// Check if user still exists
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(new AppError('The user belonging to this token does no longer exist.', 401));
	}

	// Check if user changed password after the token was issued
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(new AppError('User recently changed password! Please log in again.', 401));
	}

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	res.locals.user = currentUser;
	next();
});
// -------------------------------------------------------------

// read user by id from the database
exports.getUserById = catchAsync(async (req, res, next) => {
	let query = User.findById(req.params.userId);
	const doc = await query;
	// const loggedInEmail = superProtect();
	// console.log(loggedInEmail);

	if (!doc) {
		return next(new AppError('No document found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		message: '✔️ User found successfully! ✔️',
		users: doc,
	});
});
// -------------------------------------------------------------

// restricting the routes for a specific role only(admin)
exports.restrictTo = () => {
	// currentLoggedIn();
	return (req, res, next) => {
		// roles ['admin', 'lead-guide']. role='user'
		if (req.user.role !== 'admin') {
			return next(new AppError('You do not have permission to perform this action.(not admin)', 403));
		}
		next();
	};
};
// -------------------------------------------------------------
