
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

function createProgramme(playlist) {
  var items = '';
  var nowTime = new Date().getTime();
  playlist.items.forEach(function (item, index) {
    var count = index + 1;
    var modifiers = "";
    var endTime = new Date(item.endTime).getTime();
    var startTime = new Date(item.startTime).getTime();
    var startTimeFormatted = item.startTimeFormatted;
    if (nowTime > endTime)
      modifiers += " schedule-row--past";
    else
      modifiers += " schedule-row--future";

    if (endTime > nowTime && startTime < nowTime) {
      modifiers += " schedule-row--current";
      startTimeFormatted = "NOW:";
    }
    var html =  `
    <div class='schedule-row ${modifiers}'>
      <div class='schedule-row__time'>${startTimeFormatted} </div>
      <div class="schedule-row__title">${item.snippet.title}</div>
    </div>`;
    items += html.toString();
  });

  $(".programme__body").html(items);
}
