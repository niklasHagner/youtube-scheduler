var isFullscreen = false;
$('.fullscreen-toggle').on('click', function() {
    var icon = $(".fullscreen-toggle i");
    //var isFullscreen = player.isFullscreen();

    $(".fullscreen-menu").toggleClass("hidden");;
    $("#tv").toggleClass("fullscreen");
    $("#content").toggleClass("fullscreen");

    if(isFullscreen){
        isFullscreen = false;
        //player.closeFullscreen();
        icon.attr('class','fa fa-arrows-alt');
    }
    else{
        isFullscreen = true;
        //player.openFullscreen();
        icon.attr('class','fa fa-times');
    }
});

var mousemovetimer =  null;
var showingFullscreenMenu = false;
$('body').mousemove(function() {
    if (!isFullscreen || showingFullscreenMenu) {
        return;
    }
    console.log("move");
    clearTimeout(mousemovetimer);
    $(".fullscreen-menu").show();
    showingFullscreenMenu = true;
    console.log("showing fs menu");
    mousemovetimer = window.setInterval(function() {
        $(".fullscreen-menu").hide();
        showingFullscreenMenu = false;
         console.log("hiding fs menu");
    }, 1500);
});
// $('body').mousestop(function() {
//     isMouseIntervalSet = false;
//     window.clearTimeout(mousemovetimer);
//     mousemovetimer = null;
// });