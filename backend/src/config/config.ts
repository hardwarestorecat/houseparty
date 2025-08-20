import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/houseparty',
  },
  
  // JWT configuration
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-token-secret',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },
  
  // Mailjet configuration
  email: {
    host: process.env.MAILJET_HOST || 'in-v3.mailjet.com',
    port: parseInt(process.env.MAILJET_PORT || '587'),
    apiKey: process.env.MAILJET_API_KEY || '',
    secretKey: process.env.MAILJET_SECRET_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@houseparty.com',
  },
  
  // Agora configuration
  agora: {
    appId: process.env.AGORA_APP_ID || '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE || '',
    tokenExpiry: parseInt(process.env.AGORA_TOKEN_EXPIRY || '3600'),
  },
  
  // Firebase configuration
  firebase: {
    serverKey: process.env.FIREBASE_SERVER_KEY || '',
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

export default config;
