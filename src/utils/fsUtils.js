const fs = require('fs');
const path = require('path');

/**
 * Recursively copies a directory from src to dest.
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    if (!fs.existsSync(src)) return;
    for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item), d = path.join(dest, item);
        fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
    }
}

/**
 * Recursively removes a directory.
 */
function removeDir(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
    copyDir,
    removeDir
};
