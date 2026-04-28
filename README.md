# StratumMail Mzansi

A modern email client for South African businesses, built with Expo for iOS, Android, and Web.

## Features

- **Quick Setup** - Add your email with just address and password; we auto-detect the correct IMAP/SMTP settings
- **Multi-Account** - Manage multiple email accounts from one app
- **Rich Signatures** - Create professional HTML signatures with clickable social icons
- **Compose & Send** - Full-featured email composition with attachment support
- **Cross-Platform** - Works on iOS, Android, and responsive web

## Tech Stack

- **Frontend**: Expo SDK 50+, React Native, TypeScript
- **Backend**: Node.js, Vercel Serverless Functions
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: PostgreSQL (Vercel Postgres)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/stratummail-mzansi.git
cd EmailApp

# Install dependencies
npm install

# Start development server
npx expo start
```

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Running on Web

```bash
npx expo start --web
```

### Building for Production

```bash
# Web build
npx expo export --platform web

# Mobile builds (requires EAS)
eas build --platform ios
eas build --platform android
```

## Deployment

### Vercel (Web + Backend)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy with `vercel deploy`

### Mobile Stores

- **iOS**: Use Expo EAS Build + Apple Developer Program
- **Android**: Use Expo EAS Build + Google Play Console

## Supported Email Providers

Auto-detection support for major South African hosting providers:
- Hetzner
- Afrihost
- Domains.co.za
- Absolute Hosting
- Xneelo
- And generic IMAP/SMTP fallback

## License

MIT License

## Support

For issues and feature requests, please open a GitHub issue.