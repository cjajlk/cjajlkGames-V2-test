const video = document.getElementById("introVideo");
const btn = document.getElementById("enterBtn");
const dialogue = document.getElementById("dialogue");


btn.addEventListener("click", () => {

  document.body.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "../pages/mainmenu.html";
  }, 600);

});



video.addEventListener("ended", () => {
  video.style.display = "none"; // Cacher la vidéo
  setTimeout(() => {
    btn.classList.add("show");
   
  }, 1000);  // Attendre 1 seconde avant d'afficher les éléments
});


window.addEventListener("load", () => {
  video.play();
});
