const { exec } = require('child_process');
const http = require('http');

class IdeRepository {
    async findPort() {
        return new Promise((resolve) => {
            const cmd = process.platform === 'win32' 
                ? 'netstat -ano | findstr LISTEN | findstr :10' 
                : 'lsof -i -P -n | grep LISTEN | grep :10';
            
            exec(cmd, (err, stdout) => {
                if (err || !stdout) return resolve(null);
                
                const match = stdout.match(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\]):(\d+)\s/);
                resolve(match ? match[1] : null);
            });
        });
    }

    async fetchQuota(port) {
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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsed = JSON.parse(data);
                            if (!parsed || typeof parsed !== 'object') {
                                return reject(new Error('Invalid JSON response from IDE'));
                            }
                            resolve(parsed);
                        } catch (e) {
                            reject(new Error('Failed to parse IDE response'));
                        }
                    } else {
                        reject(new Error(`IDE responded with status ${res.statusCode}`));
                    }
                });
            });

            req.on('error', e => reject(e));
            req.on('timeout', () => { req.destroy(); reject(new Error('IDE connection timed out')); });
            req.end();
        });
    }
}

module.exports = new IdeRepository();
