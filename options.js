const COMMAND_LABELS = {
  scrollLeft: 'Scroll left',
  scrollDown: 'Scroll down',
  scrollUp: 'Scroll up',
  scrollRight: 'Scroll right',
  scrollToTop: 'Scroll to top',
  scrollToBottom: 'Scroll to bottom',
  focusInput: 'Focus input',
  followLink: 'Follow link',
};

const form = document.getElementById('form');
const keysFieldset = document.getElementById('keys');
const hintCharsInput = document.getElementById('hintChars');
const scrollStepInput = document.getElementById('scrollStep');
const patternsInput = document.getElementById('disabledUrlPatterns');
const statusEl = document.getElementById('status');

const keyInputs = Object.fromEntries(
  Object.entries(COMMAND_LABELS).map(([command, text]) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.spellcheck = false;
    label.append(text, input);
    keysFieldset.append(label);
    return [command, input];
  }),
);

function render(settings) {
  for (const [command, input] of Object.entries(keyInputs)) input.value = settings.keys[command];
  hintCharsInput.value = settings.hintChars;
  scrollStepInput.value = settings.scrollStep;
  patternsInput.value = settings.disabledUrlPatterns.join('\n');
}

function readForm() {
  return {
    keys: Object.fromEntries(Object.entries(keyInputs).map(([command, input]) => [command, input.value.trim()])),
    hintChars: normalizeHintChars(hintCharsInput.value),
    scrollStep: Number(scrollStepInput.value),
    disabledUrlPatterns: patternsInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

function validate(settings) {
  const errors = [];
  const sequences = Object.entries(settings.keys).map(([command, value]) => ({
    command,
    keys: parseKeySequence(value),
  }));
  for (const { command, keys } of sequences) {
    if (keys.length === 0) errors.push(`${COMMAND_LABELS[command]}: key is empty.`);
  }
  for (const a of sequences) {
    for (const b of sequences) {
      if (a === b || a.keys.length === 0 || a.keys.length > b.keys.length) continue;
      if (a.keys.every((key, i) => b.keys[i] === key)) {
        errors.push(`${COMMAND_LABELS[a.command]} conflicts with ${COMMAND_LABELS[b.command]}.`);
      }
    }
  }
  if (settings.hintChars.length < 2) errors.push('Hint characters need at least 2 distinct characters.');
  if (!Number.isInteger(settings.scrollStep) || settings.scrollStep < 1) {
    errors.push('Scroll step must be a positive integer.');
  }
  for (const pattern of settings.disabledUrlPatterns) {
    try {
      new RegExp(pattern);
    } catch (e) {
      errors.push(`Invalid regular expression: ${pattern} (${e.message})`);
    }
  }
  return errors;
}

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = readForm();
  const errors = validate(settings);
  if (errors.length > 0) {
    showStatus(errors.join('\n'), true);
    return;
  }
  await saveSettings(settings);
  render(settings);
  showStatus('Saved.');
});

document.getElementById('reset').addEventListener('click', () => {
  render(DEFAULT_SETTINGS);
  showStatus('Defaults restored. Save to apply.');
});

loadSettings().then(render);
