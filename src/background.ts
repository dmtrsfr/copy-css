chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
  await chrome.tabs.sendMessage(tab.id, { type: "grab-styles:toggle-picker" });
});
