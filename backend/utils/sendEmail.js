// utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '651463012@crru.ac.th', // your email
    pass: 'bopn ckyu bpek okbs' // your email password
  }
});


async function sendEmail(to, subject, html) {
  console.log('sendEmail to:', to, 'subject:', subject,html); // ← ดู log ตรงนี้
  try {
    await transporter.verify(); // ตรวจสุขภาพ SMTP
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to, subject, html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('sendEmail error:', err); // ← ดู error ตรงนี้
    return false;
  }
}
module.exports = sendEmail;
