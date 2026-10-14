chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== 'openTab') return;
  chrome.tabs.create({
    url: message.url,
    active: false,
    index: sender.tab.index + 1,
    openerTabId: sender.tab.id,
  });
});
