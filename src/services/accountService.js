const fs = require('fs');
const path = require('path');
const os = require('os');
const { PATHS } = require('../constants');
const { copyDir, removeDir } = require('../utils/fsUtils');

class AccountService {
    static getAuthTokensPath() {
        switch (process.platform) {
            case 'win32':  return path.join(process.env.APPDATA, 'Antigravity', 'auth-tokens');
            case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity', 'auth-tokens');
            default:       return path.join(os.homedir(), '.config', 'Antigravity', 'auth-tokens');
        }
    }

    readConfig() {
        try {
            if (!fs.existsSync(PATHS.CONFIG_FILE)) return { accounts: [], active: null };
            return JSON.parse(fs.readFileSync(PATHS.CONFIG_FILE, 'utf8'));
        } catch {
            return { accounts: [], active: null };
        }
    }

    writeConfig(config) {
        fs.mkdirSync(path.dirname(PATHS.CONFIG_FILE), { recursive: true });
        fs.writeFileSync(PATHS.CONFIG_FILE, JSON.stringify(config, null, 2));
    }

    async switchAccount(targetId) {
        const config = this.readConfig();
        const picked = config.accounts.find(a => a.id === targetId);
        if (!picked) throw new Error('Account not found');

        const authPath = AccountService.getAuthTokensPath();
        const accountsDir = PATHS.ACCOUNTS_DIR;

        // Save current tokens
        if (config.active && fs.existsSync(authPath)) {
            copyDir(authPath, path.join(accountsDir, config.active));
        }

        // Load new tokens
        removeDir(authPath);
        copyDir(path.join(accountsDir, picked.id), authPath);

        config.active = picked.id;
        this.writeConfig(config);
        return picked;
    }

    addAccount(id, email, name) {
        const config = this.readConfig();
        const authPath = AccountService.getAuthTokensPath();
        
        if (!fs.existsSync(authPath)) {
            throw new Error('No active login. Sign in to Antigravity first.');
        }

        copyDir(authPath, path.join(PATHS.ACCOUNTS_DIR, id));
        config.accounts.push({ id, email, name });
        if (!config.active) config.active = id;
        
        this.writeConfig(config);
    }

    removeAccount(id) {
        const config = this.readConfig();
        removeDir(path.join(PATHS.ACCOUNTS_DIR, id));
        config.accounts = config.accounts.filter(a => a.id !== id);
        if (config.active === id) config.active = config.accounts[0]?.id || null;
        this.writeConfig(config);
    }

    renameAccount(id, newName) {
        const config = this.readConfig();
        const account = config.accounts.find(a => a.id === id);
        if (account) {
            account.name = newName;
            this.writeConfig(config);
        }
    }
}

module.exports = new AccountService();
