(function () {
    "use strict";

    const CJ_EARN_MS = 600000; // 10 minutes
    let activeMs = 0;
    let debugEl = null;
    let cjPopupCount = 0;

    function isDebugEnabled() {
        return window.CJ_DEBUG === true;
    }

    function ensureDebugEl() {
        if (!isDebugEnabled() || debugEl) return;
        debugEl = document.createElement("div");
        debugEl.id = "cjDebug";
        debugEl.style.position = "fixed";
        debugEl.style.left = "10px";
        debugEl.style.bottom = "10px";
        debugEl.style.zIndex = "9999";
        debugEl.style.padding = "6px 8px";
        debugEl.style.borderRadius = "6px";
        debugEl.style.background = "rgba(0,0,0,0.7)";
        debugEl.style.color = "#fff";
        debugEl.style.font = "12px/1.4 monospace";
        debugEl.style.pointerEvents = "none";
        document.body.appendChild(debugEl);
    }

    function removeDebugEl() {
        if (!debugEl) return;
        debugEl.remove();
        debugEl = null;
    }

    function updateDebug() {
        if (!isDebugEnabled()) {
            removeDebugEl();
            return;
        }
        ensureDebugEl();
        const remainingMs = Math.max(0, CJ_EARN_MS - activeMs);
        debugEl.textContent =
            "CJ debug | activeMs: " + Math.floor(activeMs) +
            " | remainingMs: " + Math.floor(remainingMs);
    }

    function isActiveSession() {
        const state = typeof window.getGameState === "function"
            ? window.getGameState()
            : { running: false, paused: true };
        return !!(state.running && !state.paused && document.visibilityState === "visible");
    }

    function rewardCJ(amount) {
        if (typeof window.cj !== "number") window.cj = 0;
        if (!window.cjStats || typeof window.cjStats !== "object") {
            window.cjStats = { totalEarned: 0 };
        }

        window.cj += amount;
        window.cjStats.totalEarned = (window.cjStats.totalEarned || 0) + amount;

        if (window.CJajlkAccount && typeof window.CJajlkAccount.add === "function") {
            window.CJajlkAccount.add("attrape", amount);
            if (isDebugEnabled()) {
                console.log("CJ sync -> CJajlkAccount.add(attrape,", amount, ")");
            }
        }

        showCJRewardAnimation(amount);

        if (typeof window.savePlayerProfile === "function") {
            window.savePlayerProfile();
        }
        if (typeof window.updateProfilePanel === "function") {
            window.updateProfilePanel();
        }
    }

    function showCJRewardAnimation(amount) {
        const el = document.createElement("div");
        el.className = "cj-popup";
        el.textContent = "+" + amount + " CJ";

        const offset = Math.min(cjPopupCount, 5) * 22;
        el.style.bottom = (80 + offset) + "px";
        cjPopupCount += 1;

        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
            cjPopupCount = Math.max(0, cjPopupCount - 1);
        }, 1200);
    }

    function tick(deltaMs) {
        if (!deltaMs || deltaMs <= 0) return;
        if (!isActiveSession()) {
            updateDebug();
            return;
        }

        activeMs += deltaMs;
        if (activeMs >= CJ_EARN_MS) {
            const earned = Math.floor(activeMs / CJ_EARN_MS);
            activeMs = activeMs % CJ_EARN_MS;
            rewardCJ(earned);
        }

        updateDebug();
    }

    window.cjSystem = {
        tick
    };
})();
