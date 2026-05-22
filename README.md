# Money Management App 💰

A mobile application built with React Native and Expo for managing personal finances, tracking transactions, and generating financial reports.

## Features

- 📊 **Transaction Management** - Track income and expenses with detailed categorization
- 📈 **Financial Reports** - Visualize spending patterns and generate comprehensive reports
- 👤 **Multiple Accounts** - Manage transactions across different bank accounts
- 🔐 **Secure Storage** - PIN-protected access and encrypted data storage
- 🎨 **Modern UI** - Clean, intuitive interface with theme customization
- 📱 **Mobile-First** - Optimized for iOS and Android devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or use Expo Go app)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/RayZigShaw/MoneyManagementApp.git
   cd MoneyManagementApp
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

4. Open the app
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your mobile device

## Project Structure

```
app/
├── _layout.tsx          # Navigation layout
├── _lib/               # Utilities and context
│   ├── _AppContext.tsx
│   ├── _ThemeContext.tsx
│   └── theme.ts
├── _services/          # Business logic
│   ├── _db-service.ts
│   ├── _backup-service.ts
│   └── _safe-storage.ts
├── components/         # Reusable UI components
├── accounts/           # Account management screens
├── home.tsx           # Home screen
├── transactions.tsx   # Transactions screen
├── reports.tsx        # Reports screen
└── settings.tsx       # Settings screen
```

## Tech Stack

- **React Native** - Mobile app framework
- **Expo** - Build and deployment platform
- **TypeScript** - Type-safe JavaScript
- **SQLite** - Local database
- **React Navigation** - Navigation management

## Scripts

```bash
# Start development server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on GitHub.
