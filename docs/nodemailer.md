# BloodLink Nodemailer Setup

Nodemailer must run on a trusted backend, not inside the Expo mobile app.

## Recommended usage

- Use Supabase Auth for OTP and login flows.
- Use Nodemailer only for backend-triggered transactional email:
  - welcome emails
  - password/help messages
  - admin notifications
  - donation or request status summaries
- Store SMTP secrets as backend environment variables without the `EXPO_PUBLIC_` prefix.
- Treat SMTP app passwords and `EMAIL_API_KEY` values as secrets. If a real value was ever copied into an example file, rotate it before using the sender account again.

## Local setup

1. Create a Gmail app password for the sender account.
2. Copy `server/.env.example` to `server/.env`.
3. Fill in the real SMTP values in `server/.env`.
4. Run the email API from the `server` folder:

```sh
npm run dev
```

5. Point the Expo app to the API with `EXPO_PUBLIC_API_URL`.

For local development:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

For Android Emulator, use:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

For a physical phone, use your computer's LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

Restart Expo after changing `EXPO_PUBLIC_` variables.

## Backend environment variables

```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
EMAIL_API_KEY=replace-with-a-long-random-server-secret
EMAIL_RATE_LIMIT_MAX=30
EMAIL_RATE_LIMIT_WINDOW_MS=60000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-backend-email@gmail.com
SMTP_PASS=replace-with-your-smtp-app-password
SMTP_FROM="BloodLink <your-backend-email@gmail.com>"
```

## API contract

The email API only accepts backend-owned templates and requires `EMAIL_API_KEY`.
Do not expose that key through `EXPO_PUBLIC_` variables, bundle it in the Expo app,
or call the email API directly from untrusted client flows in production. Trigger
email from trusted backend actions only.

Requests must use this shape:

```http
POST /email/send
X-Email-API-Key: <EMAIL_API_KEY>
Content-Type: application/json

{
  "to": "recipient@example.com",
  "template": "welcome",
  "data": {
    "name": "Juan"
  }
}
```

The backend rejects arbitrary `subject`, `html`, or `text` fields. The old
generic `/send-email` route returns `410 Gone`. Add new transactional email
behavior by adding a named server-side template.

## Trusted backend usage

```ts
await fetch(`${process.env.EMAIL_API_URL}/email/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Email-API-Key': process.env.EMAIL_API_KEY,
  },
  body: JSON.stringify({
    to: 'recipient@example.com',
    template: 'welcome',
    data: {
      name: 'Juan',
    },
  }),
});
```

## Backend sender

```ts
const buildWelcomeEmail = (name: string) => {
  return {
    subject: 'Welcome to BloodLink',
    text: `Hi ${name}, welcome to BloodLink.`,
    html: `<p>Hi ${name}, welcome to BloodLink.</p>`,
  };
}
```

Do not import backend sender code from React Native screens or services.
