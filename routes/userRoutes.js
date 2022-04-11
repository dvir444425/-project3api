const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const router = express.Router();

router.route('/signup').post(authController.createUser);

router.route('/login').post(authController.loginUser);

// sends an email to the user to reset his password
router.route('/operations/resetPassword').post(authController.sendResetPasswordEmail);

// actually resets the password
router.route('/operations/resetPasswordViaWebForm').post(authController.resetPassword);

// ----------------------------------------------------------------
// Protect all routes after this middleware - have to be logged in
router.use(authController.protect);

router.route('/operations/uploadPhoto').post(userController.uploadUserPhoto, userController.updatePhotoField);

router.route('/:userId').patch(userController.updateUser).get(authController.getUserById);

// ----------------------------------------------------------------
// restrict the paths below to admin role only
router.use(authController.restrictTo());

// at this point, we are at /api/users
router.route('/operations/changeIsActive').patch(authController.changeUserIsActive);

// at this point, we are at /api/users
router.route('/').get(userController.getAllUsers);

// at this point, we are at /api/users
router.route('/:userId').delete(userController.deleteUser);

module.exports = router;
