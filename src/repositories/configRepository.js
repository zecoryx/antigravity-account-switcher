const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PATHS } = require('../constants');

class ConfigRepository {
    constructor() {
        this._cache = null;
    }

    async read() {
        if (this._cache) return this._cache;
        
        try {
            if (!fsSync.existsSync(PATHS.CONFIG_FILE)) {
                return { accounts: [], active: null };
            }
            const data = await fs.readFile(PATHS.CONFIG_FILE, 'utf8');
            this._cache = JSON.parse(data);
            return this._cache;
        } catch (error) {
            // Return default config on parse error or read failure
            return { accounts: [], active: null };
        }
    }

    async write(config) {
        try {
            this._cache = config;
            await fs.mkdir(path.dirname(PATHS.CONFIG_FILE), { recursive: true });
            await fs.writeFile(PATHS.CONFIG_FILE, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Failed to persist configuration: ${error.message}`);
        }
    }

    clearCache() {
        this._cache = null;
    }
}

module.exports = new ConfigRepository();
