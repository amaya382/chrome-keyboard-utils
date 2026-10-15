<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">⌨️ Keyboard Utils Chrome Extension</h1>

<p align="center"><strong>Drive any page from the home row, Vim-style.</strong></p>

Keyboard Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## ✨ Features

- **Vim-style scrolling** — scroll with `h` / `j` / `k` / `l`, repeat with a count, and jump to the top or bottom. Web apps that scroll an inner pane instead of the page are scrolled too
- **Click hints** — label every clickable element and click one by typing its label. Larger, more prominent elements get shorter labels made of easier characters, and each target is outlined so you can see which label belongs to it
- **Background tabs** — open a hinted link in a new background tab without leaving the current page
- **Input focus** — jump straight into an input field, with hints when several are visible
- **History navigation** — go back and forward in history from the keyboard
- **Stays out of the way** — keys pass through untouched while an input field is focused, and regular expressions on the URL turn the extension off per site
- **Customizable and synced** — change keys, hint characters, and scroll step; settings follow your Chrome profile, and `storage` is the only permission requested

## 🚀 Quick Start

**Requirements:** desktop Chrome.

1. Clone this repository

   ```bash
   git clone https://github.com/amaya382/chrome-keyboard-utils.git
   ```

2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the cloned directory

Tabs that were already open before installing need a reload. Open any long page and press `j`; the page scrolls down if the extension is active.

To update, run `git pull` and click the reload button on the extension's card in `chrome://extensions/`.

## ⌨️ Keys

| Key | Action |
| --- | --- |
| `h` / `j` / `k` / `l` | Scroll left / down / up / right. Accepts a count prefix (e.g. `5j`) |
| `gg` / `G` | Jump to the top / bottom of the page |
| `i` | Focus an input field, with hints when several are visible |
| `f` | Show hints for clickable elements and click the selected one. `Shift` + label opens a link in a new background tab |
| `Backspace` / `Shift` + `Backspace` | Go back / forward in history. Accepts a count prefix (e.g. `3` then `Backspace` goes back three pages) |
| `Esc` | Leave the focused input field, or close hints |

Every key except `Esc` can be changed in the options.

## ⚙️ Configuration

Open the options page from the extension's "Details" → "Extension options".

| Setting | Default | Description |
| --- | --- | --- |
| Keys | See [Keys](#️-keys) | Key sequence for each command. Record captures the keys as you press them, and `Esc` finishes |
| Hint characters | `asdfgqwertzxcvb` | Characters for hint labels, ordered from easiest to hardest |
| Scroll step | `60` | Pixels scrolled per `h` / `j` / `k` / `l` |
| Disabled URLs | (empty) | Regular expressions, one per line. Keyboard Utils is disabled on pages whose URL matches any of them |

Special keys are written as their `KeyboardEvent.key` name in angle brackets, e.g. `<Enter>`. Prefix the name with `S-` for `Shift`, e.g. `<S-Backspace>`.

Saving is rejected when a key is empty, when one command's keys are a prefix of another's (`g` and `gg`), when the hint characters have fewer than two distinct characters, or when a regular expression does not compile.

Settings are stored in `chrome.storage.sync`, so they follow the Chrome profile to every device signed in to it. Open tabs pick up a saved change without a reload.

## 🔒 Permissions

- `storage` — save and sync settings
- Access to all sites — handle keyboard input on every page

## 🔧 Troubleshooting

### Keys do nothing on a page

Chrome does not run extensions on `chrome://` pages or the Chrome Web Store. On other pages, check that the tab was reloaded after installing and that no Disabled URLs entry matches the page.

### Keys conflict with a site's own shortcuts

Sites such as YouTube use the same keys. Add a regular expression for the site to Disabled URLs, e.g. `^https://www\.youtube\.com/`.

### Keys do nothing after clicking into embedded content

Keyboard Utils runs only in the top-level frame. When focus is inside an iframe, click outside it to return focus to the page.

### Some elements get no hint

Elements inside a Shadow DOM are not searched for hints.

## 🧪 Development

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.

## 🙏 Acknowledgements

- [Surfingkeys](https://github.com/brookhong/Surfingkeys) — the clickable element detection and the default hint characters follow it
