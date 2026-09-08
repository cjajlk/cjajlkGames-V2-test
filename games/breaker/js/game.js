const screen = document.getElementById("screen");

function goMenu() {
  screen.style.opacity = 0;

  setTimeout(() => {
    window.location.href = "../pages/intro.html";
  }, 500);
}

screen.addEventListener("click", goMenu);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") goMenu();
});

