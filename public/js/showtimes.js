
function createProgramme(playlist) {
  var items = '<h1>Show times</h1><span class="programme__close" onclick="toggleProgrammeVisibility()">Close</span>';
  var nowTime = new Date().getTime();
  playlist.items.forEach((item, index) => {
    var count = index + 1;
    var modifiers = "";
    var endTime = new Date(item.endTime).getTime();
    var startTime = new Date(item.startTime).getTime();
    var startTimeFormatted = item.startTimeFormatted;
    if (nowTime > endTime)
      modifiers += " title--past";
    else
      modifiers += " title--future";

    if (endTime > nowTime && startTime < nowTime) {
      modifiers += " title--current";
      startTimeFormatted = "Current:";
    }
    items += `<p class='title ${modifiers}'><span class='start-time'>${startTimeFormatted} </span>${item.snippet.title}</p>`;
  });

  var wrapped = "<section class='programme programme--hidden'>" + items + "</section>";
  $(".programme").html(wrapped);
}