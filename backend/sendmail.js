const nodemailer = require('nodemailer');

// config สำหรับของ gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '651463012@crru.ac.th', // your email
    pass: 'bopn ckyu bpek okbs' // your email password
  }
});


let mailOptions = {
  from: '651463012@crru.ac.th',                // sender
  to: 'koy40199@gmail.com',                // list of receivers
  subject: 'Hello from sender',              // Mail subject
  html: '<b>Do you receive this mail?</b>'   // HTML body
};

transporter.sendMail(mailOptions, function (err, info) {
   if(err)
     console.log(err)
   else
     console.log(info);
});