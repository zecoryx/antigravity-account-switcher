const ideRepository = require('../repositories/ideRepository');

class QuotaService {
    constructor() {
        this._cachedPort = null;
    }

    async getQuota() {
        try {
            const port = await this._findPort();
            if (!port) return { error: 'Antigravity IDE is not running' };
            
            const rawData = await ideRepository.fetchQuota(port);
            return this._normalizeResponse(rawData);
        } catch (error) {
            this._cachedPort = null; // Clear cache on error to force re-scan
            return { error: `Quota Monitor: ${error.message}` };
        }
    }

    async _findPort() {
        if (this._cachedPort) return this._cachedPort;
        
        const port = await ideRepository.findPort();
        if (port) this._cachedPort = port;
        return port;
    }

    _normalizeResponse(raw) {
        // Business logic: Transform raw IDE data into extension-friendly format
        return {
            user: {
                name: raw.user?.name || raw.user?.email?.split('@')[0] || 'Unknown',
                email: raw.user?.email || 'N/A'
            },
            models: (raw.models || []).map(m => ({
                label: m.label || m.id || 'Unknown',
                remaining: Math.round(m.remaining_percent || 0),
                exhausted: m.is_exhausted || false,
                resetAt: m.resets_at
            }))
        };
    }
}

module.exports = new QuotaService();
