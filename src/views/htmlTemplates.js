const { escHtml } = require('../utils/uiUtils');

function getBaseStyles() {
    return `
  :root {
    --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    --card-bg: var(--vscode-sideBar-background);
    --card-border: var(--vscode-widget-border, #3c3c3c);
    --accent: var(--vscode-button-background, #007acc);
    --radius: 12px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: 13px;
    color: var(--vscode-foreground);
    background: transparent;
    padding: 16px 12px;
    overflow-x: hidden;
  }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-in { animation: fadeIn 0.3s ease-out both; }

  .restart-banner {
    background: var(--vscode-statusBarItem-warningBackground, #cd9731);
    color: var(--vscode-statusBarItem-warningForeground, #fff);
    padding: 10px 12px;
    border-radius: var(--radius);
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: fadeIn 0.3s ease-out;
  }
  .restart-content { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 12px; }
  .restart-banner .btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); width: 100%; }
  .restart-banner .btn:hover { background: rgba(255,255,255,0.3); }

  .card {
    position: relative;
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    margin-bottom: 12px;
    background: var(--vscode-editor-background);
    overflow: hidden;
    transition: var(--transition);
    opacity: 0.9;
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    opacity: 1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .card.active {
    border-color: var(--accent);
    background: var(--vscode-list-hoverBackground);
    opacity: 1;
  }
  .card.active .card-glow {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at top right, var(--accent) -80%, transparent 60%);
    opacity: 0.15;
    pointer-events: none;
  }

  .card-content { position: relative; padding: 14px; z-index: 1; }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .avatar-container { position: relative; flex-shrink: 0; }
  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
  }
  .active-indicator {
    position: absolute;
    bottom: 0; right: 0;
    width: 12px; height: 12px;
    background: #4caf50;
    border: 2px solid var(--vscode-editor-background);
    border-radius: 50%;
  }

  .info { flex: 1; min-width: 0; }
  .name  { font-weight: 600; font-size: 14px; color: var(--vscode-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .email { font-size: 11px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--accent);
    color: var(--vscode-button-foreground);
    opacity: 0.9;
  }

  /* Quota Section */
  .quota-rows { margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px; animation: fadeIn 0.4s ease-out; }
  .quota-row  { font-size: 11px; }
  .quota-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 500; }
  .quota-name  { color: var(--vscode-descriptionForeground); }
  .quota-pct   { font-family: monospace; font-size: 12px; }
  
  .bar-track { 
    height: 6px; 
    background: rgba(0,0,0,0.1); 
    border-radius: 3px; 
    overflow: hidden; 
    border: 1px solid rgba(255,255,255,0.05); 
  }
  .bar-fill { height: 100%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
  
  .bar-green  { background: linear-gradient(90deg, #43a047, #66bb6a); box-shadow: 0 0 10px rgba(67, 160, 71, 0.3); }
  .bar-yellow { background: linear-gradient(90deg, #fbc02d, #ffeb3b); box-shadow: 0 0 10px rgba(251, 192, 45, 0.3); }
  .bar-red    { background: linear-gradient(90deg, #e53935, #ef5350); box-shadow: 0 0 10px rgba(229, 57, 53, 0.3); }

  /* Actions */
  .actions { display: flex; gap: 8px; }
  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--card-border);
    background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.05));
    color: var(--vscode-foreground);
    transition: var(--transition);
  }
  .btn:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(255,255,255,0.1)); border-color: var(--accent); }
  .btn.primary { background: var(--accent); color: var(--vscode-button-foreground); border-color: transparent; }
  .btn.primary:hover { opacity: 0.9; }
  .btn.danger { flex: 0 0 34px; color: #ef5350; }
  .btn.danger:hover { background: rgba(239, 83, 80, 0.1); border-color: #ef5350; }

  .add-btn {
    width: 100%;
    padding: 12px;
    border-radius: var(--radius);
    border: 2px dashed var(--card-border);
    background: transparent;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }
  .add-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(var(--accent-rgb, 0, 122, 204), 0.05);
  }

  .empty {
    text-align: center;
    padding: 40px 20px;
    opacity: 0.6;
  }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty p { margin-bottom: 20px; font-size: 14px; }
  .btn.lg { padding: 10px 20px; font-size: 13px; }

  .hint {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    text-align: center;
    margin-top: 16px;
    opacity: 0.5;
  }

  /* Codicon support */
  .icon {
    font-family: codicon;
    font-size: 14px;
    line-height: 1;
  }
`;
}

function getMainHtml(content) {
    const { restartHtml, empty, cards, addAccountHtml } = content;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${getBaseStyles()}</style>
</head>
<body>

${restartHtml}
${empty}
<div class="cards-list">
  ${cards}
</div>

${addAccountHtml}

<script>
  const vscode = acquireVsCodeApi();
  function send(type, id) {
    vscode.postMessage({ type, id });
  }
</script>
</body>
</html>`;
}

module.exports = {
    getMainHtml
};
