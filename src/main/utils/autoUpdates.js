const {autoUpdater} = require('electron-updater');
const {ipcMain} = require('electron');

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;

    // Disable auto-updater on Linux if no update files are configured
    // This prevents errors when running locally built packages
    if (process.platform === 'linux') {
      console.log('Auto-updater: Checking for Linux updates...');
    }

    autoUpdater.on('update-available', () => {
      console.log('Update available');
      mainWindow.webContents.send('update_available');
    });

    autoUpdater.on('update-not-available', () => {
      console.log('No updates available');
      mainWindow.webContents.send('update_not_available');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded');
      mainWindow.webContents.send('update_downloaded');
    });

    ipcMain.on('restart_app', () => { autoUpdater.quitAndInstall(); });

    autoUpdater.on('error', (error) => {
      console.log('Auto-updater error (this is normal for local builds):',
                  error.message);
      mainWindow.webContents.send('update_error', error);
    });

    // Check for updates with error handling
    autoUpdater.checkForUpdatesAndNotify().catch(error => {
      console.log('Update check failed (this is normal for local builds):',
                  error.message);
    });
  }
}

export default AppUpdater;