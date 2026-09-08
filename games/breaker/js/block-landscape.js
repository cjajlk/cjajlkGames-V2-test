// Bloque le mode paysage sur mobile pour Breaker
(function() {
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }

  function checkOrientation() {
    if (isMobile() && window.matchMedia("(orientation: landscape)").matches) {
      let blocker = document.getElementById('landscape-blocker');
      if (!blocker) {
        blocker = document.createElement('div');
        blocker.id = 'landscape-blocker';
        blocker.style.position = 'fixed';
        blocker.style.top = 0;
        blocker.style.left = 0;
        blocker.style.width = '100vw';
        blocker.style.height = '100vh';
        blocker.style.background = 'rgba(10,6,32,0.97)';
        blocker.style.color = '#fff';
        blocker.style.display = 'flex';
        blocker.style.flexDirection = 'column';
        blocker.style.justifyContent = 'center';
        blocker.style.alignItems = 'center';
        blocker.style.zIndex = 99999;
        blocker.style.fontSize = '1.3rem';
        blocker.innerHTML = '<div style="max-width:90vw;text-align:center;"><b>Mode portrait requis</b><br>Veuillez tourner votre appareil en mode portrait pour jouer à Breaker Nocturne.</div>';
        document.body.appendChild(blocker);
      } else {
        blocker.style.display = 'flex';
      }
    } else {
      const blocker = document.getElementById('landscape-blocker');
      if (blocker) blocker.style.display = 'none';
    }
  }

  window.addEventListener('orientationchange', checkOrientation);
  window.addEventListener('resize', checkOrientation);
  document.addEventListener('DOMContentLoaded', checkOrientation);
})();
