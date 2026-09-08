// Nouveau tutoriel simple, overlay texte-only, thème CJ

function showSimpleTutorial() {
  console.log('[CJ DEBUG] showSimpleTutorial called');
  // Marquer le tutoriel comme complété
  localStorage.setItem('tutorialCompleted', 'true');

  // Créer l'overlay et tout le contenu d'un coup (halo, mascotte, boîte)
  let overlay = document.createElement('div');
  overlay.className = 'cj-tutorial-overlay';
  const mascottes = [
    { src: '../assets/mascottes/blue.png', nom: 'Blue' },
    { src: '../assets/mascottes/fire.png', nom: 'Fire' },
    { src: '../assets/mascottes/light.png', nom: 'Light' },
    { src: '../assets/mascottes/nature.png', nom: 'Nature' },
  ];
  let mascotteIndex = 0;
  function mascotteCarouselHTML(idx) {
    // Indices circulaires
    const prevIdx = (idx - 1 + mascottes.length) % mascottes.length;
    const nextIdx = (idx + 1) % mascottes.length;
    return `
      <div class=\"cj-mascotte-carousel\">
        <button class=\"cj-mascotte-arrow cj-mascotte-prev\" aria-label=\"Précédent\">&#8592;</button>
        <div class=\"cj-mascotte-imgbox\">
          <img src=\"${mascottes[prevIdx].src}\" alt=\"${mascottes[prevIdx].nom}\" class=\"cj-tutorial-mascotte cj-mascotte-side cj-mascotte-side-left\" />
          <img src=\"${mascottes[idx].src}\" alt=\"${mascottes[idx].nom}\" class=\"cj-tutorial-mascotte cj-mascotte-center\" />
          <img src=\"${mascottes[nextIdx].src}\" alt=\"${mascottes[nextIdx].nom}\" class=\"cj-tutorial-mascotte cj-mascotte-side cj-mascotte-side-right\" />
          <div class=\"cj-mascotte-nom\">${mascottes[idx].nom}</div>
        </div>
        <button class=\"cj-mascotte-arrow cj-mascotte-next\" aria-label=\"Suivant\">&#8594;</button>
      </div>
    `;
  }
  overlay.innerHTML = `
    <div class="cj-tutorial-halo"></div>
    <div class="cj-tutorial-content">
      ${mascotteCarouselHTML(mascotteIndex)}
      <h2>Tutoriel Breaker</h2>
      <div class="cj-tutorial-text">
        <p>Bienvenue dans Breaker !<br><br>
        Utilise ta raquette pour faire rebondir la balle et casser toutes les briques.<br><br>
        Attrape les bonus pour obtenir des effets spéciaux.<br><br>
        Nourris tes compagnons pour les rendre plus puissants.<br><br>
        Affronte le boss à la fin de chaque monde.<br><br>
        Bonne chance, champion !</p>
      </div>
      <button class="cj-tutorial-next">Commencer</button>
    </div>
  `;
  // Carrousel mascottes avec mascottes latérales
  function updateCarousel(newIdx, animate = true) {
    mascotteIndex = (newIdx + mascottes.length) % mascottes.length;
    const carousel = overlay.querySelector('.cj-mascotte-carousel');
    carousel.outerHTML = mascotteCarouselHTML(mascotteIndex);
    attachCarouselEvents();
    if (animate) {
      const imgCenter = overlay.querySelector('.cj-mascotte-center');
      imgCenter.classList.add('cj-mascotte-in');
    }
  }
  function attachCarouselEvents() {
    overlay.querySelector('.cj-mascotte-prev').onclick = () => updateCarousel(mascotteIndex - 1);
    overlay.querySelector('.cj-mascotte-next').onclick = () => updateCarousel(mascotteIndex + 1);
  }
  attachCarouselEvents();
  overlay.querySelector('.cj-mascotte-center').classList.add('cj-mascotte-in');

  document.body.appendChild(overlay);
  console.log('[CJ DEBUG] overlay injected:', overlay.innerHTML);

  // Fermer le tutoriel
  overlay.querySelector('.cj-tutorial-next').addEventListener('click', () => {
    overlay.remove();
    window.location.href = 'campaign.html';
  });
}

document.addEventListener('DOMContentLoaded', showSimpleTutorial);



