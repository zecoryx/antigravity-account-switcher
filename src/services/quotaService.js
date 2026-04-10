const { exec } = require('child_process');
const http = require('http');

/**
 * Service to handle quota fetching from the Antigravity IDE process.
 */
class QuotaService {
    async getQuota() {
        try {
            const port = await this._findIdePort();
            if (!port) return { error: 'Antigravity IDE process not found' };
            return await this._fetchFromIde(port);
        } catch (e) {
            return { error: e.message };
        }
    }

    _findIdePort() {
        return new Promise((resolve) => {
            const cmd = process.platform === 'win32' 
                ? 'netstat -ano | findstr :10' 
                : 'lsof -i -P -n | grep LISTEN | grep :10';
            
            exec(cmd, (err, stdout) => {
                if (err || !stdout) return resolve(null);
                const match = stdout.match(/:(\d+)\s/);
                resolve(match ? match[1] : null);
            });
        });
    }

    _fetchFromIde(port) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: '127.0.0.1',
                port: port,
                path: '/api/v1/quota',
                method: 'GET',
                timeout: 2000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(this._normalizeQuota(parsed));
                    } catch {
                        reject(new Error('Invalid quota response'));
                    }
                });
            });

            req.on('error', e => reject(e));
            req.on('timeout', () => { req.destroy(); reject(new Error('Quota request timeout')); });
            req.end();
        });
    }

    _normalizeQuota(raw) {
        return {
            user: {
                name: raw.user?.name || raw.user?.email?.split('@')[0] || 'Unknown',
                email: raw.user?.email || 'N/A'
            },
            models: (raw.models || []).map(m => ({
                label: m.label || m.id,
                remaining: Math.round(m.remaining_percent || 0),
                exhausted: m.is_exhausted || false,
                resetAt: m.resets_at
            }))
        };
    }
}

module.exports = new QuotaService();
