/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";

export const sendEmail = async (payload: any) => {
  const { send_to, sent_by, content, subject } = payload;
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    secure: true,
    auth: {
      user: process.env.GOOGLE_USER,
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: sent_by,
    to: send_to,
    subject: subject,
    html: content,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email has been sent to ${send_to}`, info);
    return "success";
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
