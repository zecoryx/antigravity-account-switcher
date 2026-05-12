const fs = require('fs').promises;
const path = require('path');

/**
 * Recursively copies a directory from src to dest.
 */
async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    let entries;
    try {
        entries = await fs.readdir(src, { withFileTypes: true });
    } catch (e) {
        return; // Source doesn't exist
    }

    await Promise.all(entries.map(async (entry) => {
        const s = path.join(src, entry.name), d = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(s, d);
        } else {
            await fs.copyFile(s, d);
        }
    }));
}

/**
 * Recursively removes a directory.
 */
async function removeDir(dir) {
    try {
        await fs.rm(dir, { recursive: true, force: true });
    } catch (e) {
        // Ignore errors if directory doesn't exist
    }
}

/**
 * Validates that an ID is alphanumeric and safe for use in paths.
 */
function isSafeId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_\-]+$/.test(id);
}

module.exports = {
    copyDir,
    removeDir,
    isSafeId
};
