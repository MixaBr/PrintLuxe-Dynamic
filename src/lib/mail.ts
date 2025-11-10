
import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
}

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

export async function sendMail({ to, subject, text, html, from }: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    // Ensure we return a serializable object, not the full Error object
    return { success: false, error: (error as Error).message };
  }
}
