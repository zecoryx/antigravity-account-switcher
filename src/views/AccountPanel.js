const { getMainHtml } = require('./htmlTemplates');
const { avatarLetter, getAvatarColor, escHtml, escAttr, formatReset } = require('../utils/uiUtils');

class AccountPanelProvider {
    constructor(extensionUri, accountService) {
        this._extensionUri = extensionUri;
        this._accountService = accountService;
        this._view = null;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };

        webviewView.webview.onDidReceiveMessage(msg => {
            // Forward messages to listeners (extension.js)
            this._onMessage(msg);
        });

        this.update();
    }

    onMessage(callback) {
        this._onMessage = callback;
    }

    update(quota, needsRestart = false) {
        if (!this._view) return;
        const config = this._accountService.readConfig();
        this._view.webview.html = this._getHtml(config, quota, needsRestart);
    }

    _getHtml(config, quota, needsRestart) {
        const accounts = config.accounts || [];
        const activeId = config.active;

        const cards = accounts.map(a => {
            const isActive = a.id === activeId;
            const letter = avatarLetter(a.name, a.email);
            const quotaHtml = this._buildQuotaRows(quota, isActive);

            return `
        <div class="card ${isActive ? 'active' : ''}" data-id="${escAttr(a.id)}">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="card-header">
              <div class="avatar-container">
                <div class="avatar" style="background: ${getAvatarColor(a.name)}">${letter}</div>
                ${isActive ? '<div class="active-indicator"></div>' : ''}
              </div>
              <div class="info">
                <div class="name">${escHtml(a.name)}</div>
                <div class="email">${escHtml(a.email)}</div>
              </div>
              ${isActive ? '<div class="badge">Active</div>' : ''}
            </div>
            ${quotaHtml}
            <div class="actions">
              ${!isActive ? `<button class="btn primary" onclick="send('switch','${escAttr(a.id)}')">
                <span class="icon">$(arrow-swap)</span> Switch
              </button>` : ''}
              <button class="btn" onclick="send('rename','${escAttr(a.id)}')">$(edit) Rename</button>
              <button class="btn danger" onclick="send('remove','${escAttr(a.id)}')">$(trash)</button>
            </div>
          </div>
        </div>`;
        }).join('');

        const restartHtml = needsRestart ? `
      <div class="restart-banner">
        <div class="restart-content">
          <span class="icon">$(warning)</span>
          <span>Restart IDE to apply changes</span>
        </div>
        <button class="btn primary small" onclick="send('restart')">Restart Now</button>
      </div>` : '';

        const empty = accounts.length === 0 ? `
      <div class="empty animate-in">
        <div class="empty-icon">$(account)</div>
        <p>No accounts added yet</p>
        <button class="btn primary lg" onclick="send('add')">Add your account</button>
      </div>` : '';

        const addAccountHtml = accounts.length > 0 ? `
      <button class="add-btn" onclick="send('add')">
        <span class="icon">$(add)</span> Add Account
      </button>
      <p class="hint">Shortcut: Ctrl+Alt+A</p>` : '';

        return getMainHtml({ restartHtml, empty, cards, addAccountHtml });
    }

    _buildQuotaRows(quota, isActive) {
        if (!isActive || !quota || quota.error || !quota.models?.length) return '';
        
        const rows = quota.models.map(m => {
            const pct = m.remaining;
            const barClass = pct > 50 ? 'bar-green' : pct > 25 ? 'bar-yellow' : 'bar-red';
            const resetTxt = m.resetAt ? ` · resets in some time` : ''; // simplified for now or pass formatReset
            return `
        <div class="quota-row">
          <div class="quota-label">
            <span class="quota-name">${escHtml(m.label)}</span>
            <span class="quota-pct" style="color: ${this._getPctColor(pct)}">${pct}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${barClass}" style="width:${pct}%"></div>
          </div>
        </div>`;
        }).join('');
        return `<div class="quota-rows">${rows}</div>`;
    }

    _getPctColor(pct) {
        if (pct > 50) return '#4caf50';
        if (pct > 25) return '#ffc107';
        return '#f44336';
    }
}

module.exports = AccountPanelProvider;
