let menuBubbleTimeout = null;
let menuBubbleFadeTimeout = null;

function stopMenuBubble() {
    const b = document.getElementById("menuBubble");
    if (!b) return;

    // Supprime les animations en cours
    if (menuBubbleTimeout) clearTimeout(menuBubbleTimeout);
    if (menuBubbleFadeTimeout) clearTimeout(menuBubbleFadeTimeout);

    // Cache immédiatement
    b.classList.remove("visible");
    b.classList.add("hidden");
}





const MENU_MASCOTTE_IMG = document.getElementById("menuMascotteImg");
const MENU_MASCOTTE = document.getElementById("menuMascotteContainer");
const MENU_BUBBLE = document.getElementById("menuBubble");

// Position alternée gauche/droite
let mascotteSide = localStorage.getItem("mascotteSide") || "right";

function applyMascottePosition() {
    if (!MENU_MASCOTTE) return;

    if (mascotteSide === "right") {
        MENU_MASCOTTE.style.right = "40px";
        MENU_MASCOTTE.style.left = "auto";
    } else {
        MENU_MASCOTTE.style.left = "40px";
        MENU_MASCOTTE.style.right = "auto";
    }

    mascotteSide = mascotteSide === "right" ? "left" : "right";
    if (typeof savePlayerProfile === "function") {
        savePlayerProfile();
    }
}

const bubbleLines = [
    "Bienvenue, " + (window.playerName || "joueur") + "…",
    "Je suis contente que tu sois revenu.",
    "Les orbes t’attendaient…",
    "Prêt à jouer ?",
    "Tu veux progresser ?",
    "On fait équipe, toi et moi."
];

function showMenuBubble() {
    const b = MENU_BUBBLE;
    if (!b) return;

    const line = bubbleLines[Math.floor(Math.random() * bubbleLines.length)];
    b.textContent = line;

    b.classList.remove("hidden");

    // Apparition
    requestAnimationFrame(() => {
        b.classList.add("visible");
    });

    // Disparition après 5s
    menuBubbleTimeout = setTimeout(() => {
        b.classList.remove("visible");
        menuBubbleFadeTimeout = setTimeout(() => {
            b.classList.add("hidden");
        }, 400);
    }, 5000);
}


function applyMenuSkins() {
    if (GameAssets.images["menu_mascotte_idle"]) {
        MENU_MASCOTTE_IMG.src = GameAssets.images["menu_mascotte_idle"].src;
    }
}

function initMenuCharacters() {
    applyMenuSkins();
    applyMascottePosition();
    setTimeout(showMenuBubble, 800);
}






