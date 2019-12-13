var isFullscreen = false;
[...document.querySelectorAll('.js-interface-toggle')].forEach((fullscreenToggle) => {
    fullscreenToggle.addEventListener('click', () => {
        toggleFullscreen('.js-interface-toggle', false, 'fa fa-arrow-up', 'fa fa-arrow-down');
    });
});

var isWindowFullscreen = false;
[...document.querySelectorAll('.fullscreen-toggle-2')].forEach((fullscreenToggle) => {
    fullscreenToggle.addEventListener("click", toggleFullscreen2)
});

function toggleFullscreen2() {
    var useWindowFullscreen = !isWindowFullscreen;
    toggleFullscreen('.fullscreen-toggle-2', useWindowFullscreen, 'fa fa-arrows-alt', 'fa fa-times');
    if (!useWindowFullscreen)
        exitFullscreenBrowser();
    isWindowFullscreen = useWindowFullscreen;
}

function toggleFullscreen(selector, requestBrowserFullscreen, collapsedIconClass, expandedIconClass) {
    var icon = document.querySelector(selector + " i");
    document.querySelector(".fullscreen-menu").classList.toggle("hidden");;
    document.querySelector("#tv").classList.toggle("fullscreen");
    document.querySelector("#content").classList.toggle("fullscreen");

    if (isFullscreen) {
        isFullscreen = false;
        icon.className = collapsedIconClass;
    }
    else {
        isFullscreen = true;
        icon.className = expandedIconClass;
        if (requestBrowserFullscreen) {
            enterFullscreenBrowser(document.body);
        }
    }
}

var mousemovetimer = null;
var showingFullscreenMenu = false;

document.querySelector("body").addEventListener("mousemove", () => {
    if (!isFullscreen || showingFullscreenMenu) {
        return;
    }
    clearTimeout(mousemovetimer);
    document.querySelector(".fullscreen-menu").classList.remove("hidden");
    document.querySelector("#tv").classList.remove("no-cursor");
    showingFullscreenMenu = true;
    mousemovetimer = window.setInterval(function () {
        document.querySelector("#tv").classList.add("no-cursor");
        document.querySelector(".fullscreen-menu").classList.add("hidden");
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
