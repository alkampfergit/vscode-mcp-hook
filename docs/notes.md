# Notes & gotchas

- **Env var timing**: `EnvironmentVariableCollection` only affects terminals
  *created after* the extension activates. Terminals restored before activation
  completes won't have `VSCODE_MCP_URL`. Close and reopen the terminal.
  `onStartupFinished` activation minimizes this race.
- **Persistence**: `envCol.persistent = false` is deliberate. The port changes
  every session; stale URLs would break reconnection after reload.
- **Security**: server binds to `127.0.0.1` only, and the request handler
  double-checks `remoteAddress`. Don't change the bind address. Add a random
  token to the URL path if you need auth on top.
- **Multiple workspace folders**: `writeWorkspaceMcpConfig` only writes to the
  first folder. Extend if you need multi-root support.
