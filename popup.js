document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("speakBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      // Get selected text from the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getSelectedText,
      }, async (results) => {
        const selectedText = results[0]?.result;

        if (!selectedText || selectedText.trim() === "") {
          alert("Please select some text on the page first.");
          return;
        }

        // Send selected text to your backend
        const response = await fetch("http://localhost:3000/simplify-and-speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: selectedText })
        });

        const data = await response.json();
        console.log("Backend Response:", data);

        if (data.audioFile) {
          const audio = new Audio(data.audioFile);
          audio.play();
        } else {
          alert("Something went wrong.");
        }
      });
    });
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}
