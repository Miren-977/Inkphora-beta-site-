(function () {
  /* ======================
     WAITLIST SUBSCRIBE
  ====================== */
  const form = document.getElementById('beta-form');
  const ok = document.getElementById('ok');
  const err = document.getElementById('error');
  const submitBtn = document.getElementById('submitBtn');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      ok.style.display = 'none';
      submitBtn.disabled = true;
      const fd = new FormData(form);
      const payload = {
        email: String(fd.get('email') || '').trim(),
        consent: !!fd.get('consent')
      };
      try {
        await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        ok.style.display = 'block';
        setTimeout(() => {
          window.location.href = '/thank-you.html';
        }, 600);
      } catch {
        err.style.display = 'block';
        submitBtn.disabled = false;
      }
    });
  }
  /* ======================
     RAG CHAT
  ====================== */
  const box = document.getElementById("ragChatBox");
  const input = document.getElementById("ragInput");
  const sendBtn = document.getElementById("ragSendBtn");
  if (!box || !input || !sendBtn) return;
  function addMsg(role, text) {
    const p = document.createElement("p");
    p.className = "rag-msg";
    p.innerHTML = `<span class="rag-role">${role}:</span> ${text}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
  }
  async function sendMessage() {
    const q = input.value.trim();
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
      const data = await res.json();
      addMsg("Inkphora", data.answer || "No answer.");
    } catch (e) {
      addMsg("Inkphora", "Error. Please try again.");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
  addMsg("Inkphora", "Hi! 🌍 ask me anything!");
  
  /* ======================
     RAG CHAT TOGGLE
  ====================== */
  const toggle = document.getElementById("ragToggle");
  const chatWindow = document.getElementById("ragChatWindow");
  const closeBtn = document.getElementById("ragClose");
  
  if (toggle && chatWindow) {
    // Apri chat
    toggle.addEventListener("click", () => {
      chatWindow.classList.remove("hidden");
      toggle.classList.remove("visible");
    });
    
    // Chiudi chat
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        chatWindow.classList.add("hidden");
        toggle.classList.add("visible");
      });
    }
  }
})();
