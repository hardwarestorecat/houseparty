# Firebase Push Notifications Migration Guide

This document explains the migration from the deprecated Firebase Server Key approach to the new FCM v1 API with OAuth2 authentication.

## Overview

Firebase has deprecated the use of server keys for push notifications. The new FCM v1 API uses OAuth2 authentication with service account credentials, providing better security and more features.

## Changes Made

### 1. New Firebase Service (`src/services/firebase.service.ts`)

Created a comprehensive Firebase service that handles:
- OAuth2 authentication using JWT tokens
- Access token management and refresh
- FCM v1 API integration
- Support for Android, iOS, and web platforms
- Batch processing for multiple notifications
- Topic-based notifications

### 2. Updated Configuration (`src/config/config.ts`)

Added support for Firebase service account credentials:
```typescript
firebase: {
  serverKey: process.env.FIREBASE_SERVER_KEY || '', // Deprecated
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
}
```

### 3. Refactored Notifications Utils (`src/utils/notifications.ts`)

Updated all notification functions to use the new Firebase service:
- `sendPushNotification()` - Single device notifications
- `sendMultiplePushNotifications()` - Multiple device notifications
- `notifyFriends()` - Notify user's friends

### 4. Environment Configuration

Updated `.env.example` with the new Firebase service account configuration.

## Setup Instructions

### 1. Generate Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Configure Environment Variables

Add the service account JSON to your environment:

```bash
# Option 1: As a JSON string (recommended for production)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# Option 2: As a file path (for development)
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
```

### 3. Install Dependencies

The new service requires the Google Auth Library:

```bash
npm install google-auth-library
```

### 4. Update Your Code

The existing notification functions remain the same, but now use the new FCM v1 API internally:

```typescript
import { sendPushNotification, sendMultiplePushNotifications, notifyFriends } from '../utils/notifications';

// These functions work the same as before
await sendPushNotification(token, title, body, data);
await sendMultiplePushNotifications(tokens, title, body, data);
await notifyFriends(userId, title, body, data);
```

## Key Features

### 1. OAuth2 Authentication
- Automatic token refresh
- Secure JWT-based authentication
- No more server keys

### 2. Platform-Specific Configuration
- Android: High priority, custom notification channels
- iOS: APS payload with sound and badge
- Web: WebPush support

### 3. Enhanced Error Handling
- Detailed error logging
- Retry mechanisms
- Service initialization checks

### 4. Batch Processing
- Concurrent notification sending
- Rate limiting protection
- Progress tracking

## Migration Checklist

- [ ] Generate Firebase service account key
- [ ] Update environment variables
- [ ] Install `google-auth-library` dependency
- [ ] Test notifications with new service
- [ ] Remove old server key (optional, kept for backward compatibility)
- [ ] Update deployment configuration

## Testing

To test the new Firebase service:

1. Set up the service account credentials
2. Start the server
3. Check logs for "Firebase service account initialized successfully"
4. Send a test notification
5. Verify the notification is received

## Troubleshooting

### Common Issues

1. **"Firebase service account not configured"**
   - Ensure `FIREBASE_SERVICE_ACCOUNT` environment variable is set
   - Verify the JSON format is valid

2. **"Failed to get Firebase access token"**
   - Check service account permissions
   - Ensure Firebase Messaging API is enabled

3. **"Push notification error"**
   - Verify FCM token is valid
   - Check device registration status
   - Review error logs for specific details

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
DEBUG=houseparty:* npm run dev
```

## Security Considerations

1. **Service Account Security**
   - Store service account credentials securely
   - Use environment variables, not hardcoded values
   - Rotate keys regularly

2. **Token Management**
   - Access tokens are cached and refreshed automatically
   - Tokens expire after 1 hour
   - Service handles refresh transparently

3. **Data Privacy**
   - All notification data is encrypted in transit
   - No sensitive data is logged
   - Follows Firebase security best practices

## Performance

The new service includes several performance optimizations:

- **Token Caching**: Access tokens are cached and reused
- **Batch Processing**: Multiple notifications sent concurrently
- **Rate Limiting**: Built-in delays to avoid API limits
- **Connection Pooling**: Reuses HTTP connections

## Future Enhancements

Planned improvements:
- Topic subscription management
- Advanced targeting options
- Analytics integration
- Message scheduling
- A/B testing support

## Support

For issues or questions:
1. Check the Firebase Console for API quotas and errors
2. Review server logs for detailed error messages
3. Consult Firebase documentation for FCM v1 API
4. Test with Firebase's message testing tools
