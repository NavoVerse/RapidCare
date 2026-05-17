# RapidCare Windows App

This folder contains the Windows Desktop wrapper for the RapidCare platform. It uses Electron to run the Node.js backend server internally and present the web UI as a native desktop application window.

## Prerequisites
- Node.js (v14 or higher)
- npm

## How to run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the desktop application:
   ```bash
   npm start
   ```

## How to build an executable (.exe)

To package the application into a standalone Windows installer and executable:

```bash
npm run build
```

This will output the executable files in the `dist` folder.

## Architecture
- `main.js`: The Electron main process. It spawns the Node.js backend from the `../Backend` folder as a child process and waits for it to start on a port (usually `3000`). Once running, it loads the UI into a full-screen application window.
- `loading.html`: A minimal loading screen shown while the backend server initializes.
