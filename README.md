# House Party

A user-to-user live stream mobile app for Android and iOS that allows friends to join video chats when they "enter the house".

## Features

- Real-time video chat with up to 10 users simultaneously
- Push notifications when friends enter the house
- Automatic video chat joining via notifications
- Contact import and friend management
- Invitation system for users not currently in the app

## Tech Stack

### Backend
- Node.js with Express (TypeScript)
- MongoDB Atlas
- Socket.io for real-time presence
- Custom JWT authentication
- Vercel for hosting

### Mobile
- React Native for cross-platform development
- Agora.io SDK for video streaming
- Firebase Cloud Messaging for push notifications

## Project Structure

```
houseparty/
├── backend/           # TypeScript Express backend
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/    # MongoDB models
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/            # React Native mobile app
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/  # Video, notifications, etc.
│   │   ├── store/     # State management
│   │   └── utils/
│   ├── android/
│   ├── ios/
│   └── package.json
│
└── package.json       # Root package.json for shared scripts
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account
- Agora.io account
- Firebase project (for push notifications)

### Installation

1. Clone the repository
```bash
git clone https://github.com/hardwarestorecat/houseparty.git
cd houseparty
```

2. Install dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Mobile dependencies
cd ../mobile
npm install
```

3. Set up environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your MongoDB connection string, JWT secret, etc.

# Mobile
cp mobile/.env.example mobile/.env
# Edit .env with your API URL, Agora App ID, etc.
```

4. Start development servers
```bash
# Backend
cd backend
npm run dev

# Mobile
cd ../mobile
npm run start
```

## Development

### Backend
```bash
cd backend
npm run dev
```

### Mobile
```bash
cd mobile
npm run start
```

## Deployment

### Backend
The backend is deployed to Vercel.

### Mobile
The mobile app can be built for Android and iOS using the standard React Native build process.

## License
[MIT](LICENSE)

