const path = require('path');
const os = require('os');

module.exports = {
    COMMANDS: {
        ADD: 'antigravity-switcher.addAccount',
        SWITCH: 'antigravity-switcher.switchAccount',
        REMOVE: 'antigravity-switcher.removeAccount',
        RENAME: 'antigravity-switcher.renameAccount',
        SHOW_QUOTA: 'antigravity-switcher.showQuota',
        REFRESH_QUOTA: 'antigravity-switcher.refreshQuota',
        OPEN_PANEL: 'antigravity-switcher.openPanel',
        RESTART: 'workbench.action.reloadWindow'
    },
    PATHS: {
        ACCOUNTS_DIR: path.join(os.homedir(), '.antigravity-switcher', 'accounts'),
        CONFIG_FILE: path.join(os.homedir(), '.antigravity-switcher', 'config.json')
    },
    CONFIG_DEFAULTS: {
        REFRESH_INTERVAL_MS: 2 * 60 * 1000 // 2 minutes
    }
};
