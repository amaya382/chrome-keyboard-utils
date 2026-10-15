(() => {
  const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph']);
  const TEXT_INPUT_SELECTOR = [
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image])' +
      ':not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color])',
    'textarea',
  ].join(',');
  const EDITABLE_SELECTOR = [
    TEXT_INPUT_SELECTOR,
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]',
  ].join(',');
  const CLICKABLE_SELECTOR = [
    'a',
    'button',
    'select',
    'input',
    'textarea',
    'summary',
    '[onclick]',
    '[contenteditable=true]',
    '.jfk-button',
    '.goog-flat-menu-button',
    ...['button', 'link', 'menuitem', 'option', 'switch', 'tab', 'checkbox', 'combobox', 'menuitemcheckbox', 'menuitemradio']
      .map((role) => `[role=${role}]`),
  ].join(',');
  const CLICKABLE_ANCESTOR_SELECTOR = 'a, [onclick], [contenteditable=true], .jfk-button, .goog-flat-menu-button';

  let settings = mergeSettings();
  let bindings = [];
  let disabledPatterns = [];
  let pendingKeys = [];
  let countDigits = '';
  let hints = null;

  function applySettings(next) {
    settings = { ...next, hintChars: normalizeHintChars(next.hintChars) };
    bindings = Object.entries(settings.keys)
      .filter(([, sequence]) => sequence)
      .map(([command, sequence]) => ({ command, keys: parseKeySequence(sequence) }));
    disabledPatterns = settings.disabledUrlPatterns.flatMap((pattern) => {
      try {
        return [new RegExp(pattern)];
      } catch {
        return [];
      }
    });
  }

  applySettings(settings);
  loadSettings().then(applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) applySettings(mergeSettings(changes.settings.newValue));
  });

  const isDisabled = () => disabledPatterns.some((re) => re.test(location.href));

  function deepActiveElement() {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }

  const isEditable = (el) => !!el && (el.isContentEditable || el.matches(TEXT_INPUT_SELECTOR) || el.tagName === 'SELECT');

  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function resetPending() {
    pendingKeys = [];
    countDigits = '';
  }

  const startsWith = (keys, prefix) => prefix.every((key, i) => keys[i] === key);

  // Shift is already reflected in printable keys such as `G`, so only special keys carry an explicit `S-` prefix.
  const keyName = (event) => (event.shiftKey && event.key.length > 1 ? `S-${event.key}` : event.key);

  // Registered at document_start in the capture phase so page shortcuts never see handled keys.
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.isComposing || MODIFIER_KEYS.has(event.key)) return;
      if (hints) {
        hints.onKey(event);
        return;
      }
      if (event.ctrlKey || event.altKey || event.metaKey || isDisabled()) return;

      const active = deepActiveElement();
      if (isEditable(active)) {
        if (event.key === 'Escape') {
          active.blur();
          consume(event);
        }
        return;
      }

      if (pendingKeys.length === 0 && /^[0-9]$/.test(event.key) && (countDigits || event.key !== '0')) {
        countDigits += event.key;
        consume(event);
        return;
      }

      pendingKeys.push(keyName(event));
      const matched = bindings.find((b) => b.keys.length === pendingKeys.length && startsWith(b.keys, pendingKeys));
      if (matched) {
        const count = Number(countDigits) || 1;
        resetPending();
        consume(event);
        commands[matched.command]?.(count);
      } else if (bindings.some((b) => startsWith(b.keys, pendingKeys))) {
        consume(event);
      } else {
        const wasPending = pendingKeys.length > 1 || countDigits;
        resetPending();
        if (wasPending) consume(event);
      }
    },
    true,
  );


  function canScroll(el, axis) {
    const overflowProp = axis === 'y' ? 'overflowY' : 'overflowX';
    const [size, client] = axis === 'y' ? [el.scrollHeight, el.clientHeight] : [el.scrollWidth, el.clientWidth];
    if (size <= client) return false;
    if (el === document.scrollingElement) {
      return [document.documentElement, document.body].every((e) => !e || getComputedStyle(e)[overflowProp] !== 'hidden');
    }
    return ['auto', 'scroll', 'overlay'].includes(getComputedStyle(el)[overflowProp]);
  }

  function scrollTarget(axis) {
    const root = document.scrollingElement ?? document.documentElement;
    if (canScroll(root, axis)) return root;
    // Pages that scroll an inner container instead of the document: use the one under the viewport center.
    for (let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); el; el = el.parentElement) {
      if (canScroll(el, axis)) return el;
    }
    return root;
  }

  function scrollBySteps(axis, steps) {
    const distance = steps * settings.scrollStep;
    scrollTarget(axis).scrollBy({
      [axis === 'y' ? 'top' : 'left']: distance,
      behavior: 'instant',
    });
  }

  function scrollToEdge(toBottom) {
    const target = scrollTarget('y');
    target.scrollTo({ top: toBottom ? target.scrollHeight : 0, behavior: 'instant' });
  }


  function isHitBy(el, x, y) {
    const hit = document.elementFromPoint(x, y);
    return !!hit && (el.contains(hit) || hit.closest('label')?.control === el);
  }

  // Returns the visible part of the first on-screen, unobstructed client rect, or null.
  function visibleRect(el) {
    for (const rect of el.getClientRects()) {
      const left = Math.max(rect.left, 0);
      const top = Math.max(rect.top, 0);
      const right = Math.min(rect.right, innerWidth);
      const bottom = Math.min(rect.bottom, innerHeight);
      if (right - left < 1 || bottom - top < 1) continue;
      if (isHitBy(el, (left + right) / 2, (top + bottom) / 2) || isHitBy(el, left + 1, top + 1)) {
        return { left, top, width: right - left, height: bottom - top };
      }
    }
    return null;
  }

  function visibleTargets(elements) {
    return elements.flatMap((el) => {
      const rect = visibleRect(el);
      return rect ? [{ el, rect }] : [];
    });
  }

  const isUsableInput = (el) => !el.disabled && !el.readOnly;


  // Prefix-free labels where earlier labels are shorter and use earlier (easier) characters.
  function generateLabels(count, chars) {
    if (count <= chars.length) return chars.slice(0, count);
    let length = 1;
    while (chars.length ** length < count) length++;
    let prefixes = [''];
    for (let i = 1; i < length; i++) prefixes = prefixes.flatMap((p) => chars.map((c) => p + c));
    const shortCount = Math.floor((chars.length ** length - count) / (chars.length - 1));
    const labels = prefixes.slice(0, shortCount);
    for (const prefix of prefixes.slice(shortCount)) {
      for (const c of chars) {
        if (labels.length === count) return labels;
        labels.push(prefix + c);
      }
    }
    return labels;
  }

  const HINT_STYLE = `
    :host { all: initial; }
    .hint {
      position: fixed;
      z-index: 2147483647;
      padding: 0 3px;
      border: 1px solid rgba(195, 138, 34, 0.6);
      border-radius: 3px;
      background: rgba(255, 247, 133, 0.7);
      color: #302505;
      font: bold 12px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      pointer-events: none;
      text-transform: uppercase;
    }
    .typed { opacity: 0.4; }
    .target {
      position: fixed;
      z-index: 2147483646;
      box-sizing: border-box;
      border: 1px solid rgba(230, 150, 20, 0.5);
      border-radius: 2px;
      background: rgba(255, 230, 80, 0.06);
      pointer-events: none;
    }
  `;

  // Larger visible elements are treated as more prominent and receive the easier labels.
  function showHints(targets, onSelect) {
    const chars = [...settings.hintChars];
    if (targets.length === 0 || chars.length < 2) return;
    const ordered = targets
      .map((t, i) => ({ ...t, i, area: t.rect.width * t.rect.height }))
      .sort((a, b) => b.area - a.area || a.i - b.i);
    const labels = generateLabels(ordered.length, chars);

    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = HINT_STYLE;
    root.append(style);

    const items = ordered.map((target, i) => {
      const box = document.createElement('div');
      box.className = 'target';
      box.style.left = `${target.rect.left}px`;
      box.style.top = `${target.rect.top}px`;
      box.style.width = `${target.rect.width}px`;
      box.style.height = `${target.rect.height}px`;
      root.append(box);
      const marker = document.createElement('span');
      marker.className = 'hint';
      marker.style.left = `${target.rect.left}px`;
      marker.style.top = `${target.rect.top}px`;
      root.append(marker);
      return { ...target, label: labels[i], box, marker };
    });
    document.documentElement.append(host);

    let typed = '';
    let shifted = false;

    function render() {
      for (const item of items) {
        const visible = item.label.startsWith(typed);
        item.box.hidden = !visible;
        item.marker.hidden = !visible;
        if (!visible) continue;
        const done = document.createElement('span');
        done.className = 'typed';
        done.textContent = typed;
        item.marker.replaceChildren(done, item.label.slice(typed.length));
      }
    }

    function stop() {
      host.remove();
      window.removeEventListener('scroll', stop, true);
      window.removeEventListener('resize', stop, true);
      window.removeEventListener('mousedown', stop, true);
      hints = null;
    }

    window.addEventListener('scroll', stop, true);
    window.addEventListener('resize', stop, true);
    window.addEventListener('mousedown', stop, true);

    hints = {
      onKey(event) {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        consume(event);
        if (event.key === 'Escape') {
          stop();
          return;
        }
        if (event.key === 'Backspace') {
          typed = typed.slice(0, -1);
          render();
          return;
        }
        const nextTyped = typed + event.key.toLowerCase();
        if (event.key.length !== 1 || !items.some((item) => item.label.startsWith(nextTyped))) return;
        typed = nextTyped;
        shifted ||= event.shiftKey;
        const selected = items.find((item) => item.label === typed);
        if (selected) {
          stop();
          onSelect(selected.el, { newTab: shifted });
        } else {
          render();
        }
      },
    };
    render();
  }


  function focusEditable(el) {
    el.focus();
    if (typeof el.value === 'string') {
      try {
        el.setSelectionRange(el.value.length, el.value.length);
      } catch {
        // Input types such as email and number do not support selection.
      }
    }
  }

  function focusInput() {
    const inputs = [...document.querySelectorAll(EDITABLE_SELECTOR)].filter(isUsableInput);
    const targets = visibleTargets(inputs);
    if (targets.length === 1) {
      focusEditable(targets[0].el);
    } else if (targets.length > 1) {
      showHints(targets, focusEditable);
    } else {
      const offscreen = inputs.find((el) => el.getClientRects().length > 0);
      if (offscreen) focusEditable(offscreen);
    }
  }

  // Same heuristic as Surfingkeys: known interactive elements, anything styled as clickable, and descendants of clickable containers.
  function isClickable(el) {
    if (el.disabled) return false;
    if (el.matches(CLICKABLE_SELECTOR) || el.closest(CLICKABLE_ANCESTOR_SELECTOR)) return true;
    const { cursor } = getComputedStyle(el);
    return cursor === 'pointer' || cursor.startsWith('url(');
  }

  const isOnScreen = (rect) =>
    rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= innerHeight && rect.left <= innerWidth;

  // Collapses nested candidates to one hint each: a link keeps its hint, any other container yields to its innermost candidate.
  function collapseNested(targets) {
    const result = [];
    for (const target of targets) {
      const containerIndex = result.findIndex((r) => r.el.contains(target.el));
      if (containerIndex >= 0) {
        const container = result[containerIndex].el;
        if (container.tagName !== 'A' || !container.href) result[containerIndex] = target;
      } else if (!result.some((r) => target.el.contains(r.el))) {
        result.push(target);
      }
    }
    return result;
  }

  function activate(el) {
    if (isEditable(el)) {
      focusEditable(el);
      return;
    }
    el.focus({ preventScroll: true });
    if (el.tagName === 'SELECT') {
      try {
        el.showPicker();
      } catch {
        // showPicker is unavailable for some select states, such as when the element is not rendered.
      }
      return;
    }
    // Many web apps react to press events rather than click, so replay the full sequence a real click produces.
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      const EventType = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      el.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true, composed: true, view: window }));
    }
    el.click();
  }

  function followLink() {
    const candidates = [...(document.body ?? document.documentElement).querySelectorAll('*')].filter(
      (el) => isOnScreen(el.getBoundingClientRect()) && isClickable(el),
    );
    showHints(collapseNested(visibleTargets(candidates)), (el, { newTab }) => {
      const url = el.href;
      if (newTab && typeof url === 'string' && !url.startsWith('javascript:')) {
        chrome.runtime.sendMessage({ type: 'openTab', url });
      } else {
        activate(el);
      }
    });
  }

  const commands = {
    scrollLeft: (count) => scrollBySteps('x', -count),
    scrollDown: (count) => scrollBySteps('y', count),
    scrollUp: (count) => scrollBySteps('y', -count),
    scrollRight: (count) => scrollBySteps('x', count),
    scrollToTop: () => scrollToEdge(false),
    scrollToBottom: () => scrollToEdge(true),
    focusInput,
    followLink,
    historyBack: (count) => history.go(-count),
    historyForward: (count) => history.go(count),
  };
})();
