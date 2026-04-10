const vscode = require('vscode');
const { COMMANDS, CONFIG_DEFAULTS } = require('./constants');
const accountService = require('./services/accountService');
const quotaService = require('./services/quotaService');
const AccountPanelProvider = require('./views/AccountPanel');
const { updateStatusBarAccount, updateStatusBarQuota } = require('./utils/uiUtils');

let accountBar, quotaBar;
let panelProvider = null;
let lastQuota = null;
let quotaInterval;

function activate(context) {
    // 1. Initialize Status Bars
    accountBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    accountBar.command = COMMANDS.SWITCH;
    accountBar.show();
    context.subscriptions.push(accountBar);

    quotaBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    quotaBar.command = COMMANDS.SHOW_QUOTA;
    quotaBar.show();
    context.subscriptions.push(quotaBar);

    // 2. Initialize Webview Provider
    panelProvider = new AccountPanelProvider(context.extensionUri, accountService);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('antigravity-switcher.panel', panelProvider)
    );

    // 3. Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.ADD, addAccount),
        vscode.commands.registerCommand(COMMANDS.SWITCH, (id) => switchAccount(id)),
        vscode.commands.registerCommand(COMMANDS.REMOVE, (id) => removeAccount(id)),
        vscode.commands.registerCommand(COMMANDS.RENAME, (id) => renameAccount(id)),
        vscode.commands.registerCommand(COMMANDS.SHOW_QUOTA, showQuotaQuickPick),
        vscode.commands.registerCommand(COMMANDS.REFRESH_QUOTA, refreshQuota),
        vscode.commands.registerCommand(COMMANDS.OPEN_PANEL, () => vscode.commands.executeCommand('antigravity-switcher.panel.focus'))
    );

    // 4. Initial Sync
    const config = accountService.readConfig();
    updateAccountBar(config);
    refreshQuota();

    // 5. Setup Refresh Interval
    quotaInterval = setInterval(refreshQuota, CONFIG_DEFAULTS.REFRESH_INTERVAL_MS);
    context.subscriptions.push({ dispose: () => clearInterval(quotaInterval) });

    // Handle Webview Messages
    panelProvider.onMessage(async msg => {
        switch (msg.type) {
            case 'switch':  await switchAccount(msg.id); break;
            case 'add':     await addAccount(); break;
            case 'remove':  await removeAccount(msg.id); break;
            case 'rename':  await renameAccount(msg.id); break;
            case 'refresh': await refreshQuota(); break;
            case 'restart': vscode.commands.executeCommand(COMMANDS.RESTART); break;
        }
    });
}

/**
 * Sync status bar with current account
 */
function updateAccountBar(config) {
    const active = config.accounts.find(a => a.id === config.active);
    accountBar.text = active ? `$(account) ${active.name}` : `$(account) No account`;
    accountBar.tooltip = active ? `${active.email}\nClick to switch` : 'Click to add account';
}

/**
 * Global quota refresh
 */
async function refreshQuota() {
    quotaBar.text = '$(sync~spin) Quota...';
    const q = await quotaService.getQuota();
    lastQuota = q;
    
    if (q.error) {
        quotaBar.text = '$(warning) Quota N/A';
        quotaBar.tooltip = q.error;
    } else {
        const lowest = q.models.reduce((a, b) => a.remaining < b.remaining ? a : b, { remaining: 100 });
        const icon = lowest.remaining > 50 ? '$(check)' : lowest.remaining > 20 ? '$(warning)' : '$(error)';
        quotaBar.text = `${icon} ${lowest.remaining}%`;
    }
    
    panelProvider?.update(q);
}

/**
 * Command: Add Account
 */
async function addAccount() {
    const email = await vscode.window.showInputBox({ prompt: 'Gmail address', placeHolder: 'example@gmail.com' });
    if (!email) return;

    const name = await vscode.window.showInputBox({ prompt: 'Nickname' });
    if (name === undefined) return;

    try {
        const id = Date.now().toString();
        accountService.addAccount(id, email, name || email.split('@')[0]);
        const config = accountService.readConfig();
        updateAccountBar(config);
        panelProvider?.update(lastQuota);
        vscode.window.showInformationMessage(`✅ Account saved!`);
    } catch (e) {
        vscode.window.showErrorMessage(e.message);
    }
}

/**
 * Command: Switch Account
 */
async function switchAccount(id) {
    const config = accountService.readConfig();
    let targetId = id;

    if (!targetId) {
        const items = config.accounts.map(a => ({
            label: a.id === config.active ? `$(check) ${a.name}` : `$(account) ${a.name}`,
            description: a.email,
            id: a.id
        }));
        const sel = await vscode.window.showQuickPick(items, { placeHolder: 'Select account' });
        if (!sel || sel.id === config.active) return;
        targetId = sel.id;
    }

    try {
        const picked = await accountService.switchAccount(targetId);
        updateAccountBar(accountService.readConfig());
        panelProvider?.update(lastQuota, true);
        const action = await vscode.window.showInformationMessage(`✅ Switched to "${picked.name}". Restart?`, 'Restart Now');
        if (action === 'Restart Now') vscode.commands.executeCommand(COMMANDS.RESTART);
    } catch (e) {
        vscode.window.showErrorMessage(e.message);
    }
}

/**
 * Command: Remove Account
 */
async function removeAccount(id) {
    const config = accountService.readConfig();
    let targetId = id;
    if (!targetId) {
        const sel = await vscode.window.showQuickPick(config.accounts.map(a => ({ label: a.name, id: a.id })));
        if (!sel) return;
        targetId = sel.id;
    }
    
    accountService.removeAccount(targetId);
    updateAccountBar(accountService.readConfig());
    panelProvider?.update(lastQuota);
}

/**
 * Command: Rename Account
 */
async function renameAccount(id) {
    const config = accountService.readConfig();
    let targetId = id;
    if (!targetId) {
        const sel = await vscode.window.showQuickPick(config.accounts.map(a => ({ label: a.name, id: a.id })));
        if (!sel) return;
        targetId = sel.id;
    }
    
    const acc = config.accounts.find(a => a.id === targetId);
    const newName = await vscode.window.showInputBox({ value: acc.name });
    if (newName) {
        accountService.renameAccount(targetId, newName);
        updateAccountBar(accountService.readConfig());
        panelProvider?.update(lastQuota);
    }
}

/**
 * Command: Show Quota (QuickPick)
 */
async function showQuotaQuickPick() {
    if (!lastQuota || lastQuota.error) return;
    const items = lastQuota.models.map(m => ({ label: m.label, description: `${m.remaining}%` }));
    await vscode.window.showQuickPick(items, { title: 'Quota Status' });
}

function deactivate() {
    if (quotaInterval) clearInterval(quotaInterval);
}

module.exports = { activate, deactivate };
