const vscode = require('vscode');

class Logger {
    constructor(channelName) {
        this._channel = vscode.window.createOutputChannel(channelName);
    }

    info(message) {
        this._channel.appendLine(`[INFO] ${new Date().toISOString()}: ${message}`);
    }

    error(message, error) {
        const stack = error?.stack ? `\n${error.stack}` : '';
        this._channel.appendLine(`[ERROR] ${new Date().toISOString()}: ${message}${stack}`);
    }

    show() {
        this._channel.show();
    }

    dispose() {
        this._channel.dispose();
    }
}

module.exports = new Logger('Antigravity Switcher');
