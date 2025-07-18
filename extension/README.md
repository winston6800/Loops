# Loop Burn Engine Chrome Extension

This folder contains the Chrome extension version of the Loop Burn Engine app.

## Build Instructions

1. **Install dependencies** (from the project root):
   ```
   npm install
   ```
2. **Build the extension popup**:
   ```
   npx webpack --config extension/webpack.config.js
   ```
   This will generate `extension/popup.js`.

## Load in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select the `extension` folder.
4. The extension will appear with the Loop Burn Engine popup.

## Notes
- You may need to add icons (`icon16.png`, `icon48.png`, `icon128.png`) to the `extension/` folder for the extension icon.
- The extension uses local storage, so your data is saved per browser profile. 