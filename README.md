<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">⌨️ Keyboard Utils</h1>

<p align="center">
  <strong>Minimal Vim-like keyboard navigation for Chrome.</strong><br/>
  Scroll, jump, focus input fields, and click anything through hints, all from the home row.
</p>

Keyboard Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## Why Keyboard Utils?

- **Prominent-first hints** — larger, more prominent elements get shorter labels made of easier characters, and every hinted element is outlined so each label is tied to its target
- **Small surface** — ten commands, and `storage` is the only permission it requests
- **Stays out of the way** — keys pass through untouched while an input field is focused, and regular expressions on the URL turn the extension off per site

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

## 📖 Usage

### Scrolling

`h` / `j` / `k` / `l` scroll left / down / up / right by the configured step. A number typed before the key repeats it, so `5j` scrolls five steps. `gg` and `G` jump to the top and bottom and ignore the number.

When the document itself cannot scroll, as in many web apps that scroll an inner pane, Keyboard Utils walks up from the element at the center of the viewport and scrolls the first ancestor that can.

### Hints

`f` puts a label on every clickable element in the viewport. Typing a label clicks its element.

The set of clickable elements follows Surfingkeys: links, buttons, form controls, elements with interactive ARIA roles (`button`, `link`, `menuitem`, `tab`, and so on), elements with `onclick`, and anything rendered with `cursor: pointer`. Nested candidates collapse into one hint. A link keeps its own hint, while any other container yields to the innermost candidate inside it.

Labels are built from the hint characters, and characters earlier in that list count as easier to type. The largest elements receive the shortest labels made of the earliest characters. No label is a prefix of another, so a label is selected as soon as its last character is typed.

While hints are shown:

- Typing narrows the hints to the labels that start with the typed characters
- `Backspace` removes the last typed character
- `Esc`, scrolling, or a mouse click closes the hints

The selected element is handled by its kind. An input field gets focus, a `<select>` opens its option list, and anything else receives the pointer and mouse press events followed by a click, which web apps that listen for `mousedown` also react to. Typing the label with `Shift` held opens a link in a new background tab instead.

### Input fields

`i` focuses an input field. With exactly one input field in the viewport, it is focused directly. With several, hints appear for them. With none in the viewport, the first input field on the page is focused.

While an input field is focused, Keyboard Utils leaves every key to the page except `Esc`, which leaves the field.

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
| Keys | See [Keys](#️-keys) | Key sequence for each command |
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

| File | Role |
| --- | --- |
| `manifest.json` | Extension manifest |
| `content.js` | Key handling, scrolling, and hints on each page |
| `settings.js` | Default settings and storage helpers shared by the content script and the options page |
| `options.html` / `options.js` | Options page |
| `background.js` | Opens links in new tabs |
| `icons/` | Extension icons |

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.

## 🙏 Acknowledgements

- [Surfingkeys](https://github.com/brookhong/Surfingkeys) — the clickable element detection and the default hint characters follow it

## 📄 License

[MIT](LICENSE)
