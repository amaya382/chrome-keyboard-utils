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

// A key sequence is written as characters, with special keys as their KeyboardEvent.key name in angle brackets (e.g. `<Enter>`).
function parseKeySequence(sequence) {
  return [...sequence.matchAll(/<([^<>]+)>|./gsu)].map((m) => m[1] ?? m[0]);
}

function normalizeHintChars(hintChars) {
  return [...new Set(hintChars.toLowerCase().replace(/\s/g, ''))].join('');
}
