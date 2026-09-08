// Animation fade-in au scroll pour toutes les sections .fadein-section
(function() {
  function onScrollFadeIn() {
    var sections = document.querySelectorAll('.fadein-section');
    var windowBottom = window.innerHeight + window.scrollY;
    sections.forEach(function(section) {
      var rect = section.getBoundingClientRect();
      var sectionTop = rect.top + window.scrollY;
      if (windowBottom > sectionTop + 60) {
        section.style.opacity = 1;
        section.style.transform = 'translateY(0)';
        section.style.transition = 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)';
      }
    });
  }
  window.addEventListener('scroll', onScrollFadeIn);
  window.addEventListener('DOMContentLoaded', onScrollFadeIn);
  setTimeout(onScrollFadeIn, 300);
})();
