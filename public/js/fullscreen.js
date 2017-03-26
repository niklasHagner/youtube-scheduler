var isFullscreen = false;
$('.js-fullscreen-toggle').on('click', function () {
    toggleFullscreen('.js-fullscreen-toggle', false, 'fa fa-arrow-up', 'fa fa-arrow-down');
});

var isWindowFullscreen = false;
$('.fullscreen-toggle-2').on('click', function () {
    var useWindowFullscreen = !isWindowFullscreen;
    toggleFullscreen('.fullscreen-toggle-2', useWindowFullscreen, 'fa fa-arrows-alt', 'fa fa-times');
    if (!useWindowFullscreen)
        exitFullscreenBrowser();
    isWindowFullscreen = useWindowFullscreen;
});

function toggleFullscreen(selector, requestBrowserFullscreen, collapsedIconClass, expandedIconClass) {
    var icon = $(selector + " i");
    $(".fullscreen-menu").toggleClass("hidden");;
    $("#tv").toggleClass("fullscreen");
    $("#content").toggleClass("fullscreen");

    if (isFullscreen) {
        isFullscreen = false;
        icon.attr('class', collapsedIconClass);
    }
    else {
        isFullscreen = true;
        icon.attr('class', expandedIconClass);
        if (requestBrowserFullscreen) {
            enterFullscreenBrowser(document.body);
        }
    }
}

var mousemovetimer = null;
var showingFullscreenMenu = false;
$('body').mousemove(function () {
    if (!isFullscreen || showingFullscreenMenu) {
        return;
    }
    clearTimeout(mousemovetimer);
    $(".fullscreen-menu").show();
    $("#tv").removeClass("no-cursor");
    showingFullscreenMenu = true;
    mousemovetimer = window.setInterval(function () {
        $("#tv").addClass("no-cursor");
        $(".fullscreen-menu").hide();
        showingFullscreenMenu = false;
    }, 1500);
});

function enterFullscreenBrowser(element) {
    // Supports most browsers and their versions.
    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}
function exitFullscreenBrowser() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}
