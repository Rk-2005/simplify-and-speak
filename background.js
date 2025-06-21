chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "simplifyAndSpeak",
    title: "Simplify & Speak",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "simplifyAndSpeak" && info.selectionText) {
    const selectedText = info.selectionText;

    // Send to backend
    const response = await fetch("http://localhost:3000/simplify-and-speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selectedText })
    });

    const data = await response.json();

    if (data.audioFile) {
      const audio = new Audio(data.audioFile);
      audio.play();
    } else {
      console.error("No audio returned from backend.");
    }
  }
});
