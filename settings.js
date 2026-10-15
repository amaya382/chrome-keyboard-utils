const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph']);

const DEFAULT_SETTINGS = {
  keys: {
    scrollLeft: 'h',
    scrollDown: 'j',
    scrollUp: 'k',
    scrollRight: 'l',
    scrollToTop: 'gg',
    scrollToBottom: 'G',
    focusInput: 'i',
    followLink: 'f',
    historyBack: '<Backspace>',
    historyForward: '<S-Backspace>',
  },
  hintChars: 'asdfgqwertzxcvb',
  scrollStep: 60,
  disabledUrlPatterns: [],
};

function mergeSettings(stored) {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    keys: { ...DEFAULT_SETTINGS.keys, ...stored?.keys },
  };
}

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return mergeSettings(settings);
}

function saveSettings(settings) {
  return chrome.storage.sync.set({ settings });
}

// A key sequence is written as characters, with special keys as their KeyboardEvent.key name in angle brackets (e.g. `<Enter>`, or `<S-Enter>` with Shift).
function parseKeySequence(sequence) {
  return [...sequence.matchAll(/<([^<>]+)>|./gsu)].map((m) => m[1] ?? m[0]);
}

// Shift is already reflected in printable keys such as `G`, so only special keys carry an explicit `S-` prefix.
const keyName = (event) => (event.shiftKey && event.key.length > 1 ? `S-${event.key}` : event.key);

// Space is bracketed too because a bare space would be trimmed away as whitespace.
const formatKey = (key) => (key.length > 1 || key === ' ' ? `<${key}>` : key);

function normalizeHintChars(hintChars) {
  return [...new Set(hintChars.toLowerCase().replace(/\s/g, ''))].join('');
}
