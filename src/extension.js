const vscode = require('vscode');
const { COMMANDS, UI_CONFIG } = require('./constants');
const accountService = require('./services/accountService');
const quotaService = require('./services/quotaService');
const AccountPanelProvider = require('./views/AccountPanel');
const logger = require('./utils/logger');

let accountBar, quotaBar;
let panelProvider = null;
let quotaInterval;

/**
 * Controller: Extension Activation
 */
async function activate(context) {
    logger.info('Activating Antigravity Account Switcher...');

    try {
        // 1. Initialize UI Components
        initStatusBars(context);
        
        panelProvider = new AccountPanelProvider(context.extensionUri, accountService);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('antigravity-switcher.panel', panelProvider)
        );

        // 2. Register Command Handlers
        registerCommands(context);

        // 3. Initial Data Sync
        await performInitialSync();

        // 4. Setup Background Tasks
        initBackgroundTasks(context);

        // 5. Wire up Webview Messaging
        initWebviewMessaging();

        logger.info('Antigravity Account Switcher is now active.');
    } catch (error) {
        logger.error('Failed to activate extension', error);
        vscode.window.showErrorMessage('Critical Error: Failed to start Antigravity Switcher. Check output for details.');
    }
}

function initStatusBars(context) {
    accountBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, UI_CONFIG.STATUS_BAR_PRIORITY_ACCOUNT);
    accountBar.command = COMMANDS.SWITCH;
    accountBar.show();
    context.subscriptions.push(accountBar);

    quotaBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, UI_CONFIG.STATUS_BAR_PRIORITY_QUOTA);
    quotaBar.command = COMMANDS.SHOW_QUOTA;
    quotaBar.show();
    context.subscriptions.push(quotaBar);
}

function registerCommands(context) {
    const commands = [
        vscode.commands.registerCommand(COMMANDS.ADD, addAccountHandler),
        vscode.commands.registerCommand(COMMANDS.SWITCH, switchAccountHandler),
        vscode.commands.registerCommand(COMMANDS.REMOVE, removeAccountHandler),
        vscode.commands.registerCommand(COMMANDS.RENAME, renameAccountHandler),
        vscode.commands.registerCommand(COMMANDS.SHOW_QUOTA, showQuotaQuickPickHandler),
        vscode.commands.registerCommand(COMMANDS.REFRESH_QUOTA, refreshQuotaHandler),
        vscode.commands.registerCommand(COMMANDS.OPEN_PANEL, () => vscode.commands.executeCommand('antigravity-switcher.panel.focus'))
    ];
    context.subscriptions.push(...commands);
}

async function performInitialSync() {
    const [config] = await Promise.all([
        accountService.readConfig(),
        refreshQuotaHandler()
    ]);
    updateAccountBar(config);
}

function initBackgroundTasks(context) {
    quotaInterval = setInterval(refreshQuotaHandler, UI_CONFIG.REFRESH_INTERVAL_MS);
    context.subscriptions.push({ dispose: () => clearInterval(quotaInterval) });
}

function initWebviewMessaging() {
    panelProvider.onMessage(async msg => {
        try {
            switch (msg.type) {
                case 'switch':  await switchAccountHandler(msg.id); break;
                case 'add':     await addAccountHandler(); break;
                case 'remove':  await removeAccountHandler(msg.id); break;
                case 'rename':  await renameAccountHandler(msg.id); break;
                case 'refresh': await refreshQuotaHandler(); break;
                case 'restart': vscode.commands.executeCommand(COMMANDS.RESTART); break;
            }
        } catch (error) {
            handleError('Action failed', error);
        }
    });
}

/**
 * Controller Actions (Command Handlers)
 */

async function addAccountHandler() {
    const email = await vscode.window.showInputBox({ prompt: 'Gmail address', placeHolder: 'example@gmail.com' });
    if (!email) return;

    const name = await vscode.window.showInputBox({ prompt: 'Nickname' });
    if (name === undefined) return;

    try {
        const id = Date.now().toString();
        await accountService.addAccount(id, email, name);
        const config = await accountService.readConfig();
        
        updateAccountBar(config);
        panelProvider.update(null); // Quota will refresh on interval or manual click
        
        vscode.window.showInformationMessage(`✅ Account "${name || email}" added successfully.`);
    } catch (error) {
        handleError('Could not add account', error);
    }
}

async function switchAccountHandler(id) {
    let targetId = id;

    if (!targetId) {
        const config = await accountService.readConfig();
        const items = config.accounts.map(a => ({
            label: a.id === config.active ? `$(check) ${a.name}` : `$(account) ${a.name}`,
            description: a.email,
            id: a.id
        }));
        const sel = await vscode.window.showQuickPick(items, { placeHolder: 'Select account to switch to' });
        if (!sel || sel.id === config.active) return;
        targetId = sel.id;
    }

    try {
        const picked = await accountService.switchAccount(targetId);
        const newConfig = await accountService.readConfig();
        
        updateAccountBar(newConfig);
        panelProvider.update(null, true); // Signal restart needed
        
        const action = await vscode.window.showInformationMessage(`✅ Switched to "${picked.name}". Restart Antigravity to apply?`, 'Restart Now');
        if (action === 'Restart Now') vscode.commands.executeCommand(COMMANDS.RESTART);
    } catch (error) {
        handleError('Switch failed', error);
    }
}

async function removeAccountHandler(id) {
    let targetId = id;
    if (!targetId) {
        const config = await accountService.readConfig();
        const sel = await vscode.window.showQuickPick(config.accounts.map(a => ({ label: a.name, id: a.id })));
        if (!sel) return;
        targetId = sel.id;
    }
    
    try {
        await accountService.removeAccount(targetId);
        const newConfig = await accountService.readConfig();
        updateAccountBar(newConfig);
        panelProvider.update();
    } catch (error) {
        handleError('Removal failed', error);
    }
}

async function renameAccountHandler(id) {
    const config = await accountService.readConfig();
    let targetId = id;
    if (!targetId) {
        const sel = await vscode.window.showQuickPick(config.accounts.map(a => ({ label: a.name, id: a.id })));
        if (!sel) return;
        targetId = sel.id;
    }
    
    const acc = config.accounts.find(a => a.id === targetId);
    const newName = await vscode.window.showInputBox({ value: acc.name, prompt: 'Enter new nickname' });
    
    if (newName) {
        try {
            await accountService.renameAccount(targetId, newName);
            const updatedConfig = await accountService.readConfig();
            updateAccountBar(updatedConfig);
            panelProvider.update();
        } catch (error) {
            handleError('Rename failed', error);
        }
    }
}

async function refreshQuotaHandler() {
    quotaBar.text = '$(sync~spin) Quota...';
    const quota = await quotaService.getQuota();
    
    if (quota.error) {
        quotaBar.text = '$(warning) Quota N/A';
        quotaBar.tooltip = quota.error;
    } else {
        const lowest = quota.models.reduce((a, b) => a.remaining < b.remaining ? a : b, { remaining: 100 });
        const icon = lowest.remaining > 50 ? '$(check)' : lowest.remaining > 20 ? '$(warning)' : '$(error)';
        quotaBar.text = `${icon} ${lowest.remaining}%`;
        quotaBar.tooltip = `Antigravity Quota\n${quota.user.email}`;
    }
    
    if (panelProvider) panelProvider.update(quota);
    return quota;
}

async function showQuotaQuickPickHandler() {
    const quota = await quotaService.getQuota();
    if (quota.error) {
        vscode.window.showWarningMessage(quota.error);
        return;
    }
    
    const items = quota.models.map(m => ({ 
        label: m.label, 
        description: `${m.remaining}% remaining`,
        detail: m.exhausted ? 'EXHAUSTED' : ''
    }));
    await vscode.window.showQuickPick(items, { title: `Quota Status: ${quota.user.email}` });
}

/**
 * UI Sync Helpers
 */
function updateAccountBar(config) {
    const active = config.accounts.find(a => a.id === config.active);
    accountBar.text = active ? `$(account) ${active.name}` : `$(account) No account`;
    accountBar.tooltip = active ? `${active.email}\nClick to switch` : 'Click to add account';
}

function handleError(message, error) {
    logger.error(message, error);
    // Sanitize error message for UI (mask paths)
    const uiMessage = error.message.replace(/[A-Z]:\\.*\\/g, '...\\').replace(/\/Users\/.*?\//g, '/.../');
    vscode.window.showErrorMessage(`❌ ${message}: ${uiMessage}`);
}

function deactivate() {
    logger.info('Deactivating Antigravity Account Switcher...');
    if (quotaInterval) clearInterval(quotaInterval);
    logger.dispose();
}

module.exports = { activate, deactivate };
