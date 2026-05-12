# Antigravity Account Switcher

Antigravity Account Switcher is a professional-grade VS Code extension designed to provide seamless multi-account management for the Antigravity IDE ecosystem. It allows developers to switch between different Google identities, monitor usage quotas in real-time, and maintain isolated session states with zero friction.

## Architecture Deep Dive

The system follows a strict **Layered Architecture** combined with the **Repository Pattern** to ensure high maintainability, testability, and a clear separation of concerns.

### 1. Controller Layer (`src/extension.js`)
Acts as the entry point and orchestrator. It is responsible for:
- Interacting with the VS Code API (Commands, Status Bars, Webviews).
- Routing user actions to the appropriate Services.
- Handling UI state synchronization and error presentation.

### 2. Service Layer (`src/services/`)
Contains the core business logic and domain rules.
- **AccountService:** Manages the lifecycle of account data, handles validation, and orchestrates complex multi-repository operations (e.g., switching an account requires both config updates and token migration).
- **QuotaService:** Normalizes raw data from external processes and applies business rules for display thresholds.

### 3. Repository Layer (`src/repositories/`)
Strictly handles data access and external system communication.
- **ConfigRepository:** Provides an abstract interface for the JSON-based configuration storage with built-in caching.
- **TokenRepository:** Encapsulates the low-level file system operations required for session token migration.
- **IdeRepository:** Handles raw process communication (port scanning) and HTTP interactions with the IDE backend.

## Tech Stack & Rationale

- **Node.js & VS Code API:** Chosen for native integration and high-performance asynchronous execution.
- **fs.promises:** Utilized for non-blocking I/O to ensure the VS Code Extension Host remains responsive during heavy directory operations.
- **Custom Logger:** A centralized logging utility that bridges extension events to a dedicated OutputChannel for easier debugging and user support.

## Core Logic Flow

1. **User Action:** User clicks "Switch Account" in the status bar.
2. **Controller:** `switchAccountHandler` triggers and displays a QuickPick menu.
3. **Service:** `accountService.switchAccount(id)` validates the request and coordinates data movement.
4. **Repository (Write):** `tokenRepository` saves the current session tokens to the secure local vault.
5. **Repository (Read/Write):** `tokenRepository` retrieves the new account's tokens and restores them to the IDE's active path.
6. **Repository (Config):** `configRepository` updates the `active` account ID in the persistent storage.
7. **Controller (Feedback):** The status bar updates, and the user is prompted to restart the IDE.

## Edge Case Handling

- **Path Traversal Protection:** All account IDs are strictly validated via alphanumeric regex before being used in file system paths.
- **I/O Resilience:** Recursive directory operations are wrapped in robust error handling to prevent partial state corruption during account swaps.
- **Graceful Degradation:** If the IDE process is not found or port scanning fails, the extension enters a "Limited Mode" where account management remains active but quota monitoring is paused.
- **Error Sanitization:** Internal system paths and stack traces are automatically masked in user-facing error dialogs to prevent information leakage.

## Future Scalability

- **Encrypted Storage:** The repository layer is designed to easily swap the current file-based token storage for more secure options like the VS Code SecretStorage API.
- **Cloud Sync:** The layered structure allows for an optional "Cloud Sync" service to be added without modifying the UI or core repository logic.
- **Multi-IDE Support:** By abstracting the `IdeRepository`, the extension can be extended to support other IDE backends (e.g., JetBrains, NeoVim) by simply adding new repository implementations.
