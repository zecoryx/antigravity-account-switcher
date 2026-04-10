# Antigravity Account Switcher

> Switch between multiple Google accounts in [Antigravity IDE](https://antigravity.google) with one click — no manual logout/login needed.

## The problem

Antigravity only supports **one active Google account** at a time. When your quota runs out, you have to:

1. Sign out
2. Sign in with another Gmail
3. Wait for it to load

This extension makes that **one click**.

## How it works

Your auth tokens are saved locally for each account. When you switch, the extension swaps the tokens and restarts Antigravity — you're instantly logged in as the new account.

```
~/.antigravity-switcher/
  config.json          ← account list
  accounts/
    111111/            ← account 1 tokens
    222222/            ← account 2 tokens
    333333/            ← account 3 tokens
```

No data leaves your machine.

## Install

### Option A — from VSIX (recommended)

1. Download the latest `.vsix` from [Releases](../../releases)
2. In Antigravity: `Extensions` → `...` → **Install from VSIX**

### Option B — build from source

```bash
git clone https://github.com/zecoryx/antigravity-switcher
cd antigravity-switcher
npm install -g @vscode/vsce
vsce package --no-dependencies
```

## Usage

### Step 1 — Add accounts

- Sign in to Antigravity with **Gmail #1**
- `Ctrl+Shift+P` → **"Antigravity: Add Account"**
- Enter your email + a nickname (e.g. "Work", "Personal")
- Sign out → sign in with **Gmail #2** → repeat

### Step 2 — Switch

Click the **`👤 Account Name`** button in the status bar (bottom left)

Or `Ctrl+Shift+P` → **"Antigravity: Switch Account"**

Select an account → **"Restart Now"** → done.

## Commands

| Command                       | Description                      |
| ----------------------------- | -------------------------------- |
| `Antigravity: Add Account`    | Save current login as an account |
| `Antigravity: Switch Account` | Switch to another account        |
| `Antigravity: Remove Account` | Remove a saved account           |

## Security

- Tokens stored in `~/.antigravity-switcher/` on your local machine only
- No network requests, no third-party services
- MIT licensed, fully open source

## License

MIT
