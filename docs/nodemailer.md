# BloodLink Nodemailer Notes

Nodemailer must run on a trusted backend, not inside the Expo mobile app.

## Recommended usage

- Use Supabase Auth for OTP and login flows.
- Use Nodemailer only for backend-triggered transactional email:
  - welcome emails
  - password/help messages
  - admin notifications
  - donation or request status summaries
- Store SMTP secrets as backend environment variables without the `EXPO_PUBLIC_` prefix.

## Environment variables

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=BloodLink <bloodlink.app26@gmail.com>
```

## Minimal backend sender

```ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = (to: string, subject: string, html: string) =>
  transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
```

Do not import this code from React Native screens or services.
