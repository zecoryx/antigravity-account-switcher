const path = require('path');
const os = require('os');

const UI_CONFIG = {
    STATUS_BAR_PRIORITY_ACCOUNT: 100,
    STATUS_BAR_PRIORITY_QUOTA: 90,
    REFRESH_INTERVAL_MS: 2 * 60 * 1000 // 2 minutes
};

const PATHS = {
    ACCOUNTS_DIR: path.join(os.homedir(), '.antigravity-switcher', 'accounts'),
    CONFIG_FILE: path.join(os.homedir(), '.antigravity-switcher', 'config.json')
};

const COMMANDS = {
    ADD: 'antigravity-switcher.addAccount',
    SWITCH: 'antigravity-switcher.switchAccount',
    REMOVE: 'antigravity-switcher.removeAccount',
    RENAME: 'antigravity-switcher.renameAccount',
    SHOW_QUOTA: 'antigravity-switcher.showQuota',
    REFRESH_QUOTA: 'antigravity-switcher.refreshQuota',
    OPEN_PANEL: 'antigravity-switcher.openPanel',
    RESTART: 'workbench.action.reloadWindow'
};

module.exports = {
    UI_CONFIG,
    PATHS,
    COMMANDS
};
