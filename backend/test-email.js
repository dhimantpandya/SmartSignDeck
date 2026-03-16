const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const config = {
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    gmailClientId: process.env.GMAIL_CLIENT_ID,
    gmailClientSecret: process.env.GMAIL_CLIENT_SECRET,
    gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN,
  }
};

async function testGmailAPI() {
  console.log('--- Testing Gmail REST API ---');
  if (!config.email.gmailClientId || !config.email.gmailClientSecret || !config.email.gmailRefreshToken) {
    console.log('Skipping: Gmail OAuth2 credentials missing');
    return false;
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      config.email.gmailClientId,
      config.email.gmailClientSecret,
      "https://developers.google.com/oauthplayground"
    );
    oAuth2Client.setCredentials({ refresh_token: config.email.gmailRefreshToken });

    console.log('Refreshing token...');
    const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: config.email.gmailClientId,
      client_secret: config.email.gmailClientSecret,
      refresh_token: config.email.gmailRefreshToken,
      grant_type: "refresh_token",
    });

    if (refreshRes.data && refreshRes.data.access_token) {
      console.log('✅ Token refresh successful');
      
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      const subject = 'Gmail API Test';
      const to = config.email.user;
      const html = '<b>Testing Gmail API send</b>';
      
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: "${config.email.from}" <${config.email.user}>`,
        `To: ${to}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        ``,
        html,
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      console.log('Sending test email via Gmail API...');
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });
      console.log('✅ Gmail API Send successful! ID:', res.data.id);
      return true;
    }
  } catch (err) {
    console.error('❌ Gmail API Fail:', err.response?.data || err.message);
    return false;
  }
}

async function testSMTP() {
  console.log('\n--- Testing Standard SMTP ---');
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    console.log('Verifying SMTP connection...');
    await transport.verify();
    console.log('✅ SMTP Connection verified');
    
    console.log('Attempting to send test email to ' + config.email.user + '...');
    const info = await transport.sendMail({
      from: config.email.from,
      to: config.email.user,
      subject: 'SmartSignDeck Email Test',
      text: 'If you see this, SMTP is working!',
      html: '<b>If you see this, SMTP is working!</b>'
    });
    console.log('✅ Email sent! MessageId:', info.messageId);
    return true;
  } catch (err) {
    console.error('❌ SMTP Fail:', err.message);
    return false;
  }
}

async function run() {
  const gmailOk = await testGmailAPI();
  const smtpOk = await testSMTP();
  
  console.log('\n--- Results ---');
  console.log('Gmail API:', gmailOk ? 'WORKING' : 'FAILED');
  console.log('SMTP:', smtpOk ? 'WORKING' : 'FAILED');
  
  if (!gmailOk && !smtpOk) {
    console.log('\nSUGGESTION: Your Gmail App Password or OAuth tokens might be expired. Check if Multi-Factor Auth is enabled and generate a fresh App Password.');
  }
}

run();
