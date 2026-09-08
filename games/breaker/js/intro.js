// intro.js
function goToMenu() {
    document.body.style.opacity = 0;
    setTimeout(() => {
        window.location.href = "../pages/mainmenu.html";
    }, 300);
}

// Optimiser la vidéo de fond
window.addEventListener("load", () => {
    const video = document.querySelector(".bg-video");
    if (video) {
        // Forcer muted pour pas de son
        video.muted = true;
        video.volume = 0;
        
        // Marquer que la vidéo joue
        video.addEventListener("playing", () => {
            video.setAttribute("data-playing", "true");
        });
        
        // Tentative de lecture automatique
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay bloqué, montrant l'image de fallback", error);
            });
        }
    }
});

// clic écran entier
document.addEventListener("click", goToMenu);

// touche espace
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        goToMenu();
    }
});

