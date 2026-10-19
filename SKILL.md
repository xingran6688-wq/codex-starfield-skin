---
name: codex-starfield-skin
description: Configure, diagnose, apply, and restore a Windows Codex wallpaper using the bundled independent Starfield engine. Use for custom image backgrounds and readable dark themes.
---
# Codex Starfield Skin

This folder is a self-contained Windows skin engine, CLI, and skill. It does not depend on Codex Dream Skin or another skill. Node.js 22+ and Windows PowerShell are required. Resolve paths relative to this file; quote filesystem paths.

## Workflow

1. Run `node scripts/skin.mjs doctor`. Report transport, process identity, renderer markers, and applied state separately. A listening port alone is not success.
2. Run `node scripts/skin.mjs configure --image "ABSOLUTE_IMAGE_PATH" --opacity 0.84 --blur 12`. Omitting image selects the included Honghuang Starfield wallpaper. This copies data into the user's local state folder and preserves previous settings.
3. Use `node scripts/skin.mjs preview` for an offline preview. The preview is not evidence of live compatibility.
4. If the user authorizes launching Codex with local debugging, run `powershell -NoProfile -File scripts/launch-codex.ps1 -Port 9341`. The launcher refuses to restart an existing instance. Explain that the user must close Codex first if launch is needed; never end the ongoing chat automatically.
5. When live app interaction is permitted, run `node scripts/skin.mjs apply`, or `node scripts/skin.mjs watch` for navigation resilience. Keep the watch terminal open. Obey active environment restrictions; do not use this engine to work around a prohibited app interaction.
6. Run `node scripts/skin.mjs doctor` and confirm the wallpaper is visible in an ordinary chat before declaring success. A detached watcher without verification is insufficient.

## Restore

Stop watch with Ctrl+C, then run `node scripts/skin.mjs restore`. Restore removes only Starfield styles and registered startup payloads; it does not modify native appearance settings or any other tool's theme. To close the debugging port, quit Codex and open it normally. Do not automatically quit the current chat.

## Scope and failures

Only loopback CDP endpoints whose listening PID resolves to the registered OpenAI.Codex Store executable are allowed. Unknown page structures fail with marker diagnostics; do not delete identity checks to force application. Never patch WindowsApps, app.asar, credentials, conversation storage, or account settings. No telemetry or remote image loading. The local debugging endpoint is accessible to other local programs; close it when finished.

Settings and images are local to `%LOCALAPPDATA%/CodexStarfieldSkin`. Never include that directory, debug target lists, tokens, logs, or personal paths in a public release. Public source and bundled original wallpaper are distributable under the licenses in this project. Live support remains experimental until verified on the target app version.
