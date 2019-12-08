
var programmeVisible = false;

function toggleProgrammeVisibility() {
  if (programmeVisible) {
    document.querySelector(".programme").classList.add("programme--hidden");
    document.querySelector(".toggle-programme").classList.remove("toggle-programme--active");
    programmeVisible = false;
  } else {
    document.querySelector(".programme").classList.remove("programme--hidden");
    document.querySelector(".toggle-programme").classList.add("toggle-programme--active");
    programmeVisible = true;
  }
}

function toggleTheme() {
  if (document.body.classList.contains("retro-theme")) {
    document.body.classList.remove("retro-theme");
    document.body.classList.add("dark-theme");
  } else if (document.body.classList.contains("dark-theme")) {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("retro-theme");
  }
}

function currentVideoChanged() {
  var current = document.querySelector(".schedule-row--current");
  current.classList.remove("schedule-row--current");
  current.classList.add("schedule-row--past");

  const next = current.nextElementSibling;
  next.classList.add("schedule-row--current");
  next.closest(".schedule-row__time").innerText = "NOW: ";
}


