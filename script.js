// call rag function // 

(function () {
  const box = document.getElementById("ragChatBox");
  const input = document.getElementById("ragInput");
  const sendBtn = document.getElementById("ragSendBtn");

  function addMsg(role, text) {
    const p = document.createElement("p");
    p.className = "rag-msg";
    p.innerHTML = `<span class="rag-role">${role}:</span> ${escapeHtml(text)}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function sendMessage() {
    const q = (input.value || "").trim();
    if (!q) return;

    addMsg("You", q);
    input.value = "";
    sendBtn.disabled = true;

    try {
      const res = await fetch("/.netlify/functions/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }

      const data = await res.json();
      addMsg("Inkphora", data.answer || "(No answer)");
    } catch (err) {
      addMsg("Inkphora", "Error. Please try again.");
      console.error(err);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Optional: welcome line
  addMsg("Inkphora", "Hi — ask me about the beta test, privacy, and how Inkphora works.");
})();
