const mongoose = require('mongoose');
const validator = require('validator'); //validate the input contains onlt characters
const bcrypt = require('bcryptjs'); // used to encrypt the password
const crypto = require('crypto'); // encrypt data

// creating schema
const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: [true, 'A user must have a first name'],
			trim: true,
			minlength: [2, 'First name must contain more than 2 characters'],
			validate: [validator.isAlpha, 'First name must only contain characters'],
		},
		lastName: {
			type: String,
			required: [true, 'A user must have a last name'],
			trim: true,
			minlength: [2, 'Last name must contain more than 2 characters'],
			validate: [validator.isAlpha, 'Last name must only contain characters'],
		},
		password: {
			type: String,
			required: [true, 'Please provide a password'],
			minlength: 8,
			select: false,
		},
		email: {
			type: String,
			required: [true, 'Please provide your email'],
			unique: [true, 'This email address is already exists'],
			lowercase: true,
			validate: [validator.isEmail, 'Please provide a valid email address'],
		},
		expireDate: {
			type: Date,
			default: Date.now() + 1000 * 60 * 60 * 24 * 30, // 1 month from today
		},
		profileImage: {
			type: String,
			default: 'default.jpg',
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		isActive: {
			type: Boolean,
			default: true,
			select: false,
		},
		passwordChangedAt: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
	},
	{ collection: 'users-collection' }
);

// this middleware will run before any save action of userSchema
userSchema.pre('save', async function (next) {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next();

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12);

	next();
});

// update when was the password changed
userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.pre(/^find/, function (next) {
	// this points to the current query
	this.find({ active: { $ne: false } });
	next();
});

// checks if the entered password is correct
userSchema.methods.isPasswordCorrect = async function (enteredPassword, userRealPassword) {
	// using bcrypt method to check if the passwords are the same - if yes, returns true
	return await bcrypt.compare(enteredPassword, userRealPassword);
};

// when was the password changed
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

		return JWTTimestamp < changedTimestamp;
	}

	// False means NOT changed
	return false;
};

// if user expires, do not allow login. this functions checks the dates
userSchema.methods.isUserExpired = function (time) {
	if (this.expireDate) {
		const userExpireDate = parseInt(this.expireDate.getTime() / 1, 10);

		return time > userExpireDate;
	}
};

// using this token to be able to reset the password
userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

// using the schema we just created
const UserData = mongoose.model('UserData', userSchema);

module.exports = UserData;
