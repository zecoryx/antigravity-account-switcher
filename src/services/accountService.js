const path = require('path');
const os = require('os');
const configRepository = require('../repositories/configRepository');
const tokenRepository = require('../repositories/tokenRepository');
const { isSafeId } = require('../utils/fsUtils');

class AccountService {
    static getAuthTokensPath() {
        switch (process.platform) {
            case 'win32':  return path.join(process.env.APPDATA, 'Antigravity', 'auth-tokens');
            case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity', 'auth-tokens');
            default:       return path.join(os.homedir(), '.config', 'Antigravity', 'auth-tokens');
        }
    }

    async readConfig() {
        return configRepository.read();
    }

    async switchAccount(targetId) {
        if (!isSafeId(targetId)) throw new Error('Security Error: Invalid account ID format');

        const config = await this.readConfig();
        const targetAccount = config.accounts.find(a => a.id === targetId);
        if (!targetAccount) throw new Error('Business Error: Target account not found in configuration');

        const authPath = AccountService.getAuthTokensPath();

        // Save current session if active
        if (config.active && tokenRepository.tokensExist(authPath)) {
            await tokenRepository.saveTokens(config.active, authPath);
        }

        // Load new session
        await tokenRepository.loadTokens(targetId, authPath);

        // Persist state
        config.active = targetId;
        await configRepository.write(config);
        
        return targetAccount;
    }

    async addAccount(id, email, name) {
        if (!isSafeId(id)) throw new Error('Security Error: Invalid ID format for new account');
        if (!email || !email.includes('@')) throw new Error('Validation Error: Invalid Gmail address');

        const authPath = AccountService.getAuthTokensPath();
        if (!tokenRepository.tokensExist(authPath)) {
            throw new Error('Business Error: No active Antigravity session found. Please sign in first.');
        }

        const config = await this.readConfig();
        if (config.accounts.find(a => a.id === id || a.email === email)) {
            throw new Error('Business Error: This account is already registered');
        }

        // Save session to permanent storage
        await tokenRepository.saveTokens(id, authPath);

        // Update config
        config.accounts.push({ id, email, name: name || email.split('@')[0] });
        if (!config.active) config.active = id;
        
        await configRepository.write(config);
    }

    async removeAccount(id) {
        if (!isSafeId(id)) throw new Error('Security Error: Invalid account ID format');

        const config = await this.readConfig();
        if (!config.accounts.find(a => a.id === id)) return;

        // Cleanup files
        await tokenRepository.deleteTokens(id);

        // Update config
        config.accounts = config.accounts.filter(a => a.id !== id);
        if (config.active === id) {
            config.active = config.accounts[0]?.id || null;
        }
        
        await configRepository.write(config);
    }

    async renameAccount(id, newName) {
        if (!newName || newName.trim().length === 0) throw new Error('Validation Error: Name cannot be empty');
        
        const config = await this.readConfig();
        const account = config.accounts.find(a => a.id === id);
        if (account) {
            account.name = newName.trim();
            await configRepository.write(config);
        }
    }
}

module.exports = new AccountService();
