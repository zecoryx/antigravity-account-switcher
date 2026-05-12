/**
 * Generates a text-based progress bar.
 */
function makeBar(percent) {
    const filled = Math.round(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

/**
 * Formats an ISO date string into a "reset in..." human readable string.
 */
function formatReset(isoStr) {
    try {
        const diff = new Date(isoStr) - Date.now();
        if (diff <= 0) return 'soon';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
    } catch { return ''; }
}

/**
 * Extracts the first letter of a name or email for an avatar.
 */
function avatarLetter(name, email) {
    const src = name || email || '?';
    return src.trim()[0].toUpperCase();
}

/**
 * Generates a color based on a string hash.
 */
function getAvatarColor(name) {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    let hash = 0;
    const n = name || 'Anonymous';
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Escapes HTML characters.
 */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapes characters for use in HTML attributes.
 */
function escAttr(str) {
    return escHtml(str).replace(/\\/g, '\\\\');
}

module.exports = {
    makeBar,
    formatReset,
    avatarLetter,
    getAvatarColor,
    escHtml,
    escAttr
};
