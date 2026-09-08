/* ==============================
   GLOBAL POPUP SYSTEM
   Breaker Nocturne
   ============================== */

console.log("💬 POPUP.JS LOADED!", Date.now());

window.Popup = {

  /* -------- CONFIRM -------- */
  confirm(message, onOk, onCancel) {

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";

    overlay.innerHTML = `
      <div class="popup-box">
        <div class="popup-title">${message}</div>
        <div class="popup-actions">
          <button class="popup-cancel">${i18nT("common.cancel")}</button>
          <button class="popup-ok">${i18nT("common.ok")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".popup-ok").onclick = () => {
      overlay.remove();
      if (onOk) onOk();
    };

    overlay.querySelector(".popup-cancel").onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };
  },


  /* -------- INPUT (pseudo etc) -------- */
  input(title, defaultValue = "", onConfirm) {

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    
    // Force les styles pour garantir la visibilité
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.8)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.zIndex = "999999999";

    overlay.innerHTML = `
      <div class="popup-box" style="position: relative; z-index: 1000000000; background: linear-gradient(180deg,#1b1f3a,#10142b); padding: 24px; border-radius: 14px; min-width: 280px; box-shadow: 0 0 25px rgba(120,120,255,.3);">
        <div class="popup-title" style="color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 16px;">${title}</div>
       <input class="popup-input" type="text" value="${defaultValue}" name="popupInput" autocomplete="off" style="width: 100%; padding: 10px 14px; background: rgba(20, 24, 50, 0.9); color: #ffffff; border: 1px solid rgba(120, 140, 255, 0.35); border-radius: 8px; outline: none; font-size: 15px; text-align: center; margin-bottom: 14px;">
        <div class="popup-actions" style="display: flex; gap: 10px; justify-content: center;">
          <button class="popup-cancel" style="padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; background: rgba(60, 60, 80, 0.8); color: #ffffff;">${i18nT("common.cancel")}</button>
          <button class="popup-ok" style="padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; background: linear-gradient(90deg, #5a7aff, #7a8cff); color: #ffffff;">${i18nT("common.ok")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    console.log("✅ Popup added to DOM:", overlay);
    console.log("✅ Body children count:", document.body.children.length);

    const input = overlay.querySelector(".popup-input");
    input.focus();
    input.select();

    overlay.querySelector(".popup-ok").onclick = () => {
      const value = input.value.trim();
      overlay.remove();
      if (onConfirm) onConfirm(value);
    };

    overlay.querySelector(".popup-cancel").onclick = () => {
      overlay.remove();
    };

    // Support Enter key
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const value = input.value.trim();
        overlay.remove();
        if (onConfirm) onConfirm(value);
      }
    });
  },

  /* -------- NOTIFY (simple alert) -------- */
  notify(message, duration = 2000) {
    const notif = document.createElement("div");
    notif.className = "popup-notification";
    notif.textContent = message;
    
    notif.style.position = "fixed";
    notif.style.top = "50%";
    notif.style.left = "50%";
    notif.style.transform = "translate(-50%, -50%)";
    notif.style.padding = "20px 40px";
    notif.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    notif.style.color = "#fff";
    notif.style.fontSize = "24px";
    notif.style.fontWeight = "bold";
    notif.style.borderRadius = "10px";
    notif.style.zIndex = "9999999";  /* Au-dessus de tout */
    notif.style.border = "3px solid #ffaa00";
    notif.style.textAlign = "center";
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.remove();
    }, duration);
  }
};




