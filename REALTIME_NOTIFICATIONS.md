# 🚨 Real-Time Notifications System

## Overview

SmartCall now features a comprehensive real-time notifications system using WebSockets (Socket.IO) that provides instant updates to staff and managers when shift-related events occur.

## Architecture

### Backend Components

#### 1. Socket.IO Server (`server.js`)
- Custom Next.js server with integrated Socket.IO
- Handles WebSocket connections and room management
- Manages user authentication and role-based notifications

#### 2. Socket Utilities (`src/lib/socket.ts`)
- **NotificationData Interface**: Defines notification structure
- **SocketUser Interface**: User authentication data
- **Notification Functions**:
  - `notifyNewShift()`: Alerts all staff when new shifts are created
  - `notifyShiftAccepted()`: Alerts managers when shifts are accepted
  - `notifyShiftCancelled()`: Alerts all users when shifts are cancelled

#### 3. Enhanced API Routes
- **`/api/callout`**: Now sends real-time notifications to staff when new shifts are created
- **`/api/shift/accept`**: Now sends real-time notifications to managers when shifts are accepted

### Frontend Components

#### 1. Socket Hook (`src/hooks/useSocket.ts`)
- React hook for managing WebSocket connections
- Handles authentication, connection status, and notification management
- Provides clean interface for components to receive real-time updates

#### 2. Notification Components
- **`NotificationToast.tsx`**: Beautiful, animated notification cards
- **`NotificationContainer.tsx`**: Manages multiple notifications with positioning
- **`ConnectionStatus.tsx`**: Shows live connection status indicator

#### 3. Dashboard Integration
- **Staff Dashboard**: Receives new shift notifications with toast alerts
- **Manager Dashboard**: Receives shift acceptance notifications
- Both dashboards show connection status and notification overlays

## Features

### 🔔 New Shift Notifications (Staff)
When a manager logs a new call-out:
- **Real-time alert** sent to all staff members
- **Toast notification** with shift details (skill, time, requester)
- **Auto-refresh** of available shifts list
- **Visual indicators** with icons and color coding

### ✅ Shift Acceptance Notifications (Manager)
When staff accepts a shift:
- **Real-time alert** sent to all managers
- **Toast notification** showing who accepted the shift
- **Auto-refresh** of call-out logs to show updated status
- **Success indicators** with staff member details

### 📱 Connection Status
- **Live indicator** showing WebSocket connection status
- **Animated icons** (Wifi/WifiOff) with status colors
- **Automatic reconnection** handling
- **Visual feedback** for connection state changes

### 🎨 Beautiful UI/UX
- **Smooth animations** using Framer Motion
- **Consistent styling** with existing design system
- **Mobile responsive** notification positioning
- **Auto-dismiss** with progress indicators
- **Stack management** (max 5 notifications visible)

## Technical Implementation

### WebSocket Rooms
Users are automatically assigned to role-based rooms:
- `role:STAFF` - All staff members
- `role:MANAGER` - All managers
- `user:{userId}` - Individual user rooms (for future features)

### Notification Flow

#### New Shift Creation:
1. Manager submits call-out form
2. API creates shift and call-out log
3. `notifyNewShift()` sends notification to `role:STAFF` room
4. All connected staff receive real-time notification
5. Staff dashboards auto-refresh and show toast

#### Shift Acceptance:
1. Staff clicks "Accept Shift" button
2. API updates shift status and logs
3. `notifyShiftAccepted()` sends notification to `role:MANAGER` room
4. All connected managers receive real-time notification
5. Manager dashboards auto-refresh and show toast

### Error Handling
- **Connection failures** gracefully handled with offline indicators
- **Reconnection logic** automatically restores functionality
- **Fallback polling** still works if WebSockets fail
- **Toast notifications** complement real-time alerts

## Configuration

### Server Setup
The custom server runs on the same port as Next.js but with Socket.IO integration:

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### Environment Variables
- `NODE_ENV`: Controls CORS origins for Socket.IO
- `PORT`: Server port (defaults to 3000)

### Socket.IO Settings
- **Path**: `/api/socket`
- **CORS**: Configured for localhost (dev) and production domains
- **Credentials**: Enabled for session cookie authentication

## Usage Examples

### Receiving Notifications in Components
```typescript
const { notifications, isConnected, removeNotification } = useSocket({
  user: {
    userId: user.id,
    role: user.role,
    email: user.email
  },
  onNotification: (notification) => {
    // Handle real-time notification
    toast.success(notification.message);
  }
});
```

### Displaying Notifications
```jsx
<NotificationContainer 
  notifications={notifications}
  onDismiss={removeNotification}
  position="top-right"
  maxNotifications={3}
/>
```

### Connection Status
```jsx
<ConnectionStatus isConnected={isConnected} />
```

## Benefits

### For Staff
- **Instant awareness** of new shift opportunities
- **No page refreshing** needed to see new shifts
- **Rich details** in notifications (time, skill, requester)
- **Better user experience** with smooth animations

### For Managers
- **Real-time updates** when shifts are filled
- **Immediate feedback** on call-out effectiveness
- **Reduced manual checking** of shift status
- **Professional notification system**

### For System
- **Scalable architecture** using Socket.IO rooms
- **Efficient communication** only sends relevant notifications
- **Fallback compatibility** with existing polling system
- **Production ready** with proper error handling

## Future Enhancements

Potential additions to the notification system:
- **Push notifications** for mobile browsers
- **Email notifications** for offline users
- **Notification history** and read/unread status
- **Custom notification preferences** per user
- **Shift reminders** before scheduled times
- **Escalation notifications** for unfilled urgent shifts

## Testing

To test the real-time notifications:

1. **Open two browser windows**:
   - One as a manager (`/manager/dashboard`)
   - One as a staff member (`/staff/shifts`)

2. **Create a new call-out** as manager:
   - Click "Log New Call-Out"
   - Fill in shift details
   - Submit the form
   - Watch for notification on staff window

3. **Accept the shift** as staff:
   - Click "Accept Shift" on available shift
   - Watch for notification on manager window

4. **Verify connection status**:
   - Look for green "Live" indicator when connected
   - Disconnect internet to see red "Offline" indicator

The system provides a seamless, professional real-time experience that significantly enhances the SmartCall platform's usability and responsiveness. 