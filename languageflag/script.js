function hidePopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "none";
}

function createCelestialObjects() {
  const starsContainer = document.querySelector(".space-scene");

  const starCount = 1000;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.width = star.style.height = `${Math.random() * 3}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${Math.random() * 2 + 2}s`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    starsContainer.appendChild(star);
  }
}

window.addEventListener("load", createCelestialObjects);
// createCelestialObjects();