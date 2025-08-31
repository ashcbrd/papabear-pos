# Papa Bear POS - Mobile App (Android)

This is the mobile Android version of your Papa Bear Point of Sale system, converted from Next.js web app to native Android using Capacitor.

## 🏗️ Architecture Changes

### Original Web App → Mobile App Conversion:

1. **API Routes → Client-Side Data Layer**
   - Removed all `/api/*` routes
   - Replaced with local SQLite database using `@capacitor-community/sqlite`
   - Created `DatabaseService` class for data operations

2. **SSR → Static Export**
   - Changed from server-side rendering to static export
   - All data is now managed client-side
   - Offline-first approach with local storage fallback

3. **Web Storage → SQLite**
   - Local SQLite database for mobile devices
   - Web localStorage fallback for browser testing
   - Automatic data seeding with sample products

## 📱 Mobile Features

- **Offline Operation**: Full functionality without internet connection
- **Local Database**: SQLite for data persistence
- **Touch-Optimized**: Mobile-friendly UI/UX
- **Native Performance**: Runs as native Android app

## 🚀 Development Workflow

### Prerequisites
- Node.js 18+ installed
- Android Studio (for Android development)
- Android SDK and build tools

### Available Scripts

```bash
# Regular web development
npm run dev                 # Start Next.js dev server
npm run build              # Build for web

# Mobile development  
npm run build:mobile       # Build and sync for mobile
npm run android           # Open Android project in Android Studio
npm run android:run       # Build and run on Android device/emulator
npm run android:build     # Build Android APK
```

### Development Steps

1. **Web Development**
   ```bash
   npm run dev
   ```

2. **Build for Mobile**
   ```bash
   npm run build:mobile
   ```

3. **Run on Android**
   ```bash
   npm run android:run
   ```

## 📁 Project Structure

```
papabear-pos/
├── lib/
│   ├── database.ts          # SQLite database service
│   ├── data-context.tsx     # React context for data management
│   └── seed-data.ts         # Sample data for initialization
├── components/
│   └── loading-screen.tsx   # Mobile loading screen
├── android/                 # Native Android project (auto-generated)
├── out/                     # Static export output
├── capacitor.config.ts      # Capacitor configuration
└── next.config.ts          # Next.js static export config
```

## 🗄️ Database Schema

The mobile app uses SQLite with the same schema as the original Prisma setup:

- **Products** & **Variants**
- **Addons**, **Ingredients**, **Materials**
- **Orders** & **Order Items**
- **Stock Management**

## 📊 Data Management

### Automatic Data Seeding
- Sample products, addons, ingredients loaded on first run
- Data persists across app sessions
- Web fallback uses localStorage

### Offline-First Design
- All operations work without internet
- No server dependencies
- Local data storage and processing

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)
```typescript
{
  appId: 'com.papabear.pos',
  appName: 'Papa Bear POS', 
  webDir: 'out',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      // ... other SQLite settings
    }
  }
}
```

### Next.js Config (`next.config.ts`)
```typescript
{
  output: 'export',           # Static export for mobile
  trailingSlash: true,
  images: { unoptimized: true }
}
```

## 🐛 Troubleshooting

### Build Issues
- Ensure all API routes are removed from `app/api/`
- Check that `output: 'export'` is set in Next.js config
- Verify static export compatibility

### Android Issues  
- Make sure Android Studio is properly installed
- Check Android SDK and build tools versions
- Ensure device/emulator is properly connected

### Database Issues
- Database automatically initializes with sample data
- Falls back to localStorage on web platforms
- Check console for database initialization logs

## 📋 Testing

### Web Testing
```bash
npm run dev
# Test in browser with localStorage fallback
```

### Android Testing
```bash
npm run android:run
# Deploys to connected device/emulator
```

## 🎯 Key Features Retained

- ✅ **POS Terminal**: Touch-friendly order creation
- ✅ **Admin Panel**: Product, inventory, order management  
- ✅ **Dashboard**: Sales analytics and reporting
- ✅ **Order Management**: Queue system for orders
- ✅ **Inventory**: Stock tracking and management
- ✅ **Receipt Generation**: Order confirmations

## 🔄 Future Enhancements

- **Cloud Sync**: Optional cloud backup/sync capability
- **Printer Integration**: Receipt printer support
- **Barcode Scanning**: Product scanning functionality  
- **Multi-Store**: Support for multiple store locations
- **Online Orders**: Integration with delivery platforms

## ⚠️ Important Notes

- This is a **complete conversion** from web to mobile
- All server dependencies have been **removed**
- The app runs **entirely offline** on the device
- Sample data is **automatically loaded** on first run
- Database operations are **client-side only**

Your Papa Bear POS system is now ready to run as a native Android application! 🎉