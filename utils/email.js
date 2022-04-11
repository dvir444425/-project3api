const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const fs = require('fs');
const { promisify } = require('util');
const User = require('../models/userModel');

const readFile = promisify(fs.readFile);

module.exports = class Email {
	constructor(user, resetURL) {
		this.to = user.email;
		this.resetURL = resetURL;
		this.passwordResetToken = user.createPasswordResetToken;
		this.from = `Dviros Benhemos <${process.env.EMAIL_FROM}>`;
	}

	newTransport() {
		// creating the transport details
		return nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USERNAME,
				pass: process.env.GMAIL_PASSWORD,
			},
		});
	}

	// Send the actual email
	async send(template, subject) {
		const htmlFile = await fs.readFileSync(`${__dirname}/../public/${template}.html`, 'utf8');

		// 2) Define email options
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: subject,
			html: `${htmlFile} <h3>${this.resetURL}</h3>`,
		};

		// 3) Create a transport and send email
		await this.newTransport().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to the Dviros Family!');
	}

	async sendPasswordReset() {
		await this.send('passwordResetEmail', 'Your password reset token (valid for only 10 minutes)').catch((err) => {
			console.log(err);
		});
	}
};
