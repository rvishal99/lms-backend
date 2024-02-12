import nodemailer from 'nodemailer';


export const sendEmail = async (email, subject, message) => {

    //* create reusable transporter obj using default SMTP transport
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        },
    });

    // mailtrap

    //* send email with defined transport object

    await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL, //* sender's address,
        to: email, //* receivers's address,
        subject: subject,
        html: message, //* html body
    });
};