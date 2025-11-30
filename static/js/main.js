// static/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // smooth scrolling for nav anchors
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click", e=>{
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });

  // theme switching: as sections enter viewport, update document-level accent variables
  const sections = document.querySelectorAll(".section");
  const root = document.documentElement;

  const applyThemeFrom = (section) => {
    const style = getComputedStyle(section);
    // read section theme variables if needed, fallback
    const theme = section.dataset.theme || "dark";
    // add a data-active-theme on body for CSS hooks
    document.body.setAttribute("data-active-theme", theme);
    // optionally animate background accent
    const accent = getComputedStyle(section).getPropertyValue("--accent");
    if (accent) {
      // set CSS var on root to use globally if needed
      root.style.setProperty("--global-accent", accent.trim());
    }
  };

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        applyThemeFrom(entry.target);
      }
    });
  }, {threshold: 0.45});

  sections.forEach(s => observer.observe(s));

  // small hero background animation using gsap if available
  if (window.gsap){
    gsap.to("#hero-bg", {duration: 20, xPercent: -15, repeat: -1, yoyo: true, ease: "sine.inOut"});
  }

  // card view button (demo)
  document.querySelectorAll(".view-project").forEach(btn=>{
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      const card = btn.closest(".card");
      // theme switch to card's theme quickly
      if(card && card.dataset.theme) {
        document.body.setAttribute("data-active-theme", card.dataset.theme);
      }
      // show a small modal or alert for demo
      alert("Open project: " + id + " (replace with modal or detailed view)");
    });
  });

  // -------- AI Chat functionality ----------
  const chatWindow = document.getElementById("chat-window");
  const chatIn = document.getElementById("chat-in");
  const chatSend = document.getElementById("chat-send");

  function appendMessage(who, text){
    const el = document.createElement("div");
    el.className = "chat-message " + (who === "user" ? "user" : "bot");
    el.innerHTML = `<strong>${who === "user" ? "You" : "Assistant"}:</strong> <div>${text}</div>`;
    chatWindow.appendChild(el);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  chatSend.addEventListener("click", sendChat);
  chatIn.addEventListener("keydown", (e)=>{ if(e.key === "Enter") sendChat(); });

  async function sendChat(){
    const txt = (chatIn.value || "").trim();
    if(!txt) return;
    appendMessage("user", txt);
    chatIn.value = "";
    appendMessage("bot", "…thinking"); // placeholder

    try {
      const resp = await fetch("/api/chat", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({message: txt})
      });
      const data = await resp.json();
      // remove last placeholder
      chatWindow.lastChild.remove();
      if(data.error){
        appendMessage("bot", "Error: " + data.error);
      } else {
        appendMessage("bot", data.reply);
      }
    } catch(err){
      appendMessage("bot", "Network error (see console).");
      console.error(err);
    }
  }

  // -------- Recommender ----------
  const recoBtn = document.getElementById("reco-btn");
  const recoQ = document.getElementById("reco-q");
  const recoOut = document.getElementById("reco-output");

  recoBtn.addEventListener("click", async ()=>{
    const q = (recoQ.value||"").trim();
    if(!q) {recoOut.textContent = "Type what you're interested in."; return;}
    recoOut.textContent = "Loading...";
    try {
      const resp = await fetch("/api/recommend", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({intent: q})
      });
      const data = await resp.json();
      if(data.error) recoOut.textContent = "Error: " + data.error;
      else {
        const p = data.project;
        recoOut.innerHTML = `<strong>${p.title}</strong><p>${p.summary}</p><small>tags: ${p.tags.join(", ")}</small>`;
        // optionally focus that project card
        const card = document.querySelector(`.card[data-id="${p.id}"]`);
        if(card) card.scrollIntoView({behavior:"smooth", block:"center"});
      }
    } catch(e){
      recoOut.textContent = "Network error.";
      console.error(e);
    }
  });

  // contact form simple submit (demo)
  const contactForm = document.getElementById("contact-form");
  if(contactForm) contactForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    alert("Thanks — form demo. Hook this to an email/sheet or backend.");
    contactForm.reset();
  });

});
