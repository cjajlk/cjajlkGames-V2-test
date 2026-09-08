(function () {
    "use strict";

    const DEFAULT_ITCH_URL = "https://cjajlk.itch.io/attrape-les-tous-beta";

    function buildPopup() {
        const overlay = document.createElement("div");
        overlay.className = "feedback-overlay";

        const card = document.createElement("div");
        card.className = "feedback-card";

        const header = document.createElement("div");
        header.className = "feedback-header";

        const orb = document.createElement("div");
        orb.className = "feedback-orb";
        header.appendChild(orb);

        const title = document.createElement("div");
        title.className = "feedback-title";
        title.textContent = "Merci pour ta partie";
        header.appendChild(title);

        const text = document.createElement("p");
        text.className = "feedback-text";
        text.textContent =
            "✨ Merci d’avoir parcouru ce monde nocturne.\n" +
            "Si l’univers te plaît, ton avis sur Itch.io aide vraiment le projet à grandir.\n" +
            "Tu peux laisser ton avis en bas de la page 💜";

        const actions = document.createElement("div");
        actions.className = "feedback-actions";

        const primary = document.createElement("button");
        primary.className = "feedback-btn primary";
        primary.textContent = "Laisser un avis";

        const secondary = document.createElement("button");
        secondary.className = "feedback-btn secondary";
        secondary.textContent = "Plus tard";

        actions.appendChild(primary);
        actions.appendChild(secondary);

        card.appendChild(header);
        card.appendChild(text);
        card.appendChild(actions);
        overlay.appendChild(card);

        function close() {
            overlay.remove();
        }

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) close();
        });

        secondary.addEventListener("click", close);

        primary.addEventListener("click", () => {
            const url = window.ITCH_FEEDBACK_URL || DEFAULT_ITCH_URL;
            window.open(url, "_blank", "noopener");
            close();
        });

        return overlay;
    }

    function showFeedbackIfEligible(elapsedSeconds, isTutorial) {
        if (isTutorial) return;
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 30) return;
        if (sessionStorage.getItem("feedbackShown")) return;

        sessionStorage.setItem("feedbackShown", "true");

        setTimeout(() => {
            const popup = buildPopup();
            document.body.appendChild(popup);
        }, 1000);
    }

    window.showFeedbackIfEligible = showFeedbackIfEligible;
})();
