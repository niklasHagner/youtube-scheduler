
var programmeVisible = false;

function toggleProgrammeVisibility() {
  if (programmeVisible) {
    $(".programme").addClass("programme--hidden");
    $(".toggle-programme").removeClass("toggle-programme--active");
    programmeVisible = false;
  } else {
    $(".programme").removeClass("programme--hidden");
    $(".toggle-programme").addClass("toggle-programme--active");
    programmeVisible = true;
  }
}

function toggleTheme() {
  if ($("body").hasClass("retro-theme")) {
    $("body").removeClass("retro-theme");
    $("body").addClass("dark-theme");
  } else if ($("body").hasClass("dark-theme")) {
    $("body").removeClass("dark-theme");
    $("body").addClass("retro-theme");
  }
}

function currentVideoChanged() {
  var $curr = $($(".schedule-row--current")[0]);
  $curr.next().addClass("schedule-row--current");
  $curr.next().find(".schedule-row__time").text("NOW: ");
  $curr.removeClass("schedule-row--current");
  $curr.addClass("schedule-row--past");
}


