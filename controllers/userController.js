const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer'); // uploading photo
// -------------------------------------------------------------

const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/img/users');
	},
	filename: (req, file, cb) => {
		const ext = file.mimetype.split('/')[1];
		cb(null, `${Date.now()}.${ext}`);
	},
});

// this part belongs to uploading photos
const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

exports.updatePhotoField = catchAsync(async (req, res, next) => {
	// 2) Filtered out unwanted fields names that are not allowed to be updated
	const filteredBody = filterObj(req.body, 'name', 'email');
	if (req.file) filteredBody.profileImage = req.file.filename;

	// 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: '✔️ File was successfully uploaded ! ✔️',
		data: {
			user: updatedUser,
		},
	});
});
// -------------------------------------------------------------

// read users list from the database
exports.getAllUsers = catchAsync(async (req, res, next) => {
	let query = User.find();
	const doc = await query;

	if (!doc) {
		return next(new AppError('No document found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		message: '✔️ Users list was successfully found ! ✔️',
		results: doc.length,
		users: doc,
	});
});
// -------------------------------------------------------------

// update user information by Id in the database
exports.updateUser = catchAsync(async (req, res, next) => {
	const doc = await User.findByIdAndUpdate(req.params.userId, req.body, {
		new: true, //now, the document that will be returned will be the new one
		runValidators: true,
	});

	if (!doc) {
		return next(new AppError('No document found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		message: '✔️ User updated successfully! ✔️',
		user: doc,
	});
});
// -------------------------------------------------------------

// remove a user from the database
exports.deleteUser = catchAsync(async (req, res, next) => {
	const doc = await User.findByIdAndDelete(req.params.userId);

	if (!doc) {
		return next(new AppError('No document found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		message: '✔️ User deleted successfully! ✔️',
		name: doc.firstName,
		lastName: doc.lastName,
		id: doc._id,
	});
});
// -------------------------------------------------------------
