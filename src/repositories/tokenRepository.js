const fsSync = require('fs');
const path = require('path');
const { PATHS } = require('../constants');
const { copyDir, removeDir, isSafeId } = require('../utils/fsUtils');

class TokenRepository {
    async saveTokens(id, authPath) {
        if (!isSafeId(id)) throw new Error('Invalid account ID for token storage');
        if (!fsSync.existsSync(authPath)) return false;

        try {
            const dest = path.join(PATHS.ACCOUNTS_DIR, id);
            await copyDir(authPath, dest);
            return true;
        } catch (error) {
            throw new Error(`Failed to save auth tokens: ${error.message}`);
        }
    }

    async loadTokens(id, authPath) {
        if (!isSafeId(id)) throw new Error('Invalid account ID for token retrieval');
        
        try {
            const src = path.join(PATHS.ACCOUNTS_DIR, id);
            if (!fsSync.existsSync(src)) throw new Error('Token storage not found for this account');

            await removeDir(authPath);
            await copyDir(src, authPath);
            return true;
        } catch (error) {
            throw new Error(`Failed to load auth tokens: ${error.message}`);
        }
    }

    async deleteTokens(id) {
        if (!isSafeId(id)) throw new Error('Invalid account ID for token deletion');
        
        try {
            const dir = path.join(PATHS.ACCOUNTS_DIR, id);
            await removeDir(dir);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete tokens: ${error.message}`);
        }
    }

    tokensExist(authPath) {
        return fsSync.existsSync(authPath);
    }
}

module.exports = new TokenRepository();
