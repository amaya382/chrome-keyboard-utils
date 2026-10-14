# Chrome Vim

A minimal Chrome extension for Vim-like keyboard navigation.

## Features

| Key | Action |
| --- | --- |
| `h` / `j` / `k` / `l` | Scroll left / down / up / right. Accepts a count prefix (e.g. `5j`) |
| `gg` / `G` | Jump to the top / bottom of the page |
| `i` | Focus an input field. If several are visible, shows hints to pick one |
| `f` | Show hints for links, with each target outlined, and follow the selected one. Type the hint with `Shift` to open it in a new background tab |
| `Esc` | Leave the focused input field, or cancel hints |

Keys are ignored while an input field is focused, so typing works as usual.

Hints are assigned so that larger, more prominent elements get shorter labels made of easier characters.

## Installation

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project directory

## Settings

Open the options page from the extension's "Details" → "Extension options".

- **Keys** — Key sequence for each action. Special keys are written in angle brackets (e.g. `<Enter>`)
- **Hint characters** — Characters used for hint labels, ordered from easiest to hardest (default: `asdfgqwertzxcvb`)
- **Scroll step** — Pixels scrolled per `h` / `j` / `k` / `l` (default: `60`)
- **Disabled URLs** — Regular expressions, one per line. The extension is disabled on pages whose URL matches any of them

Settings are stored in `chrome.storage.sync` and synced across devices signed in to the same Chrome profile.

## Permissions

- `storage` — Persist and sync settings
- Access to all sites — Handle keyboard input on every page
