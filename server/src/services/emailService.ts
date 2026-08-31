import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export const initEmailTransporter = async () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Generate Ethereal test account for seamless offline development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Initialized Ethereal Test Email Transporter:', testAccount.user);
    } catch (err) {
      console.warn('⚠️ Could not connect to Ethereal. Creating JSON simulation transporter.');
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
};

export const sendEmailNotification = async (params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> => {
  try {
    if (!transporter) {
      await initEmailTransporter();
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"InvoiceFlow" <notifications@invoiceflow.io>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
    });

    console.log(`✉️ Email dispatched to ${params.to}: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Email Preview URL: ${previewUrl}`);
    }
  } catch (err) {
    console.error('Failed to dispatch email notification:', err);
  }
};
