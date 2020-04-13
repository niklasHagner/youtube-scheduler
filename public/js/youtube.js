var player;
var state = { isPlaying: false }

//Insert iframe player
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function getNextVideo() {
	var nowIndex = window.youtubeData.indexOf(window.playNowVideo);
	var nextIndex = (window.youtubeData.length > nowIndex + 1) ? nowIndex + 1 : 0;
	var nextVideo = window.youtubeData[nextIndex];
	window.playNowVideo = nextVideo;
	return nextVideo;
}

function onYouTubeIframeAPIReady() {
	if (typeof window.youtubeData === "undefined") {
		console.error("ERROR! window.youtubeData does not exist");
		return;
	}
	var videos = window.youtubeData;
	videos.forEach(function (x) { console.log(x.startTimeFormatted, x.startTime, x.snippet.title) });
	window.playNowVideo = videos.find(function (item) { return item.playFirst == true });
	if (!playNowVideo) {
		console.log("could not find playFirst so just playing the first video");
		playNowVideo = videos[0];
	}
	var playerSettings = getPlayerSettings();
	player = new YT.Player('player', playerSettings);
	//console.log(player.getAvailableQualityLevels());
  //player.setPlaybackQuality('highres');

	createProgramme(videos);
}

var onPlayerReadyEventHasFired = false;
function getPlayerSettings() {

	var playerSettings = {
		width: '1280',
		height: '780',
		playerVars: {
			autoplay: 1,
			controls: 0, //Player controls do not display in the player. For IFrame embeds, the Flash player loads immediately.
      disablekb: 1, //Disable keyboard nav
      showsearch: 0,
			autohide: 1,//Regardless of the player's dimensions, the video progress bar and player controls display or hide automatically.
			modestbranding: 1, //Set the parameter value to 1 to prevent the YouTube logo from displaying in the control bar. Note that a small YouTube text label will still display in the upper-right corner of a paused video when the user's mouse pointer hovers over the player.
			rel: 0, //show related videos when playback of the initial video ends. Supported values are 0 and 1. The default value is 1.
			fs: 0,
      iv_load_policy: 3,
      enablejsapi: 1, //without this the onReady might not trigger,
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	};

	return playerSettings;
}

var readyEvent = new Event('youtubePlayerReady');
function onPlayerReady(event) {
  onPlayerReadyEventHasFired = true;
	event.target.cueVideoById({
		videoId: playNowVideo.snippet.resourceId.videoId,
		startSeconds: playNowVideo.skipToSeconds
	});
  event.target.playVideo();
  window.dispatchEvent(readyEvent);


  const storedMuteSetting = JSON.parse(localStorage.getItem("muteSound"));
  if (storedMuteSetting && typeof mute === "function") {
    var muteToggles = [...document.querySelectorAll('.mute-toggle')];
    muteToggles.forEach((x) => { mute(x) });
  }
}

setTimeout(function() {
  if (!onPlayerReadyEventHasFired) {
    alert("The Youtube-player didn't load correctly. Possibly because your browser is preventing a script. Try disabling extensions like Popupblocker and AdBlocker.");
  }
}, 5000);

function handleBufferTimeouts(event) {
	var maxWait = 14000;
	setTimeout(function(){
		if ( state.isPlaying === false) {
			console.log(`video playing did not start after ${maxWait/1000} seconds. Moving to next video.`);
			updateScheduleTimesAfterVideoWasSkipped();
			playNext(event);
		};
	}, maxWait);
}

function updateScheduleTimesAfterVideoWasSkipped() {

}

function onPlayerStateChange(event) {
	if (event.data == YT.PlayerState.ENDED) {
		setTimeout(function () { playNext(event), 100 });
	}
	else if (event.data == YT.PlayerState.BUFFERING) {
		state.isPlaying = false;
		handleBufferTimeouts(event);
	}
	else if (event.data == YT.PlayerState.PLAYING) {
		setTimeout(function() { document.querySelector("#tv").classList.remove("loading"); }, 3500);

		state.isPlaying = true;
	}
}

function onError(event) {
	console.log("player error", event);
	setTimeout(function () { playNext(event), 100 });
}

function playNext(event) {
	if (typeof window.currentVideoChanged !== "undefined")
		currentVideoChanged();
	var nextVideo = getNextVideo();
	var cueObject = {
		videoId: nextVideo.snippet.resourceId.videoId
	};
	if (nextVideo.skipToSeconds && Number.isInteger(nextVideo.skipToSeconds)) {
		cueObject.startSeconds = nextVideo.skipToSeconds;
	} else {
		console.log("no video start time");
	}
	event.target.cueVideoById(cueObject);
	event.target.playVideo();
}

function createProgramme(videos) {
	var nowTime = new Date().getTime();

	const scheduledItems = videos.filter((item) => {
		var endTime = new Date(item.endTime).getTime();
    return nowTime <= endTime;
	});

  const items = scheduledItems.map(function (item, index) {
    var modifiers = "";
    var endTime = new Date(item.endTime).getTime();
    var startTime = new Date(item.startTime).getTime();
    var startTimeFormatted = item.startTimeFormatted;
    modifiers += " schedule-row--future";

    if (endTime > nowTime && startTime < nowTime) {
      modifiers += " schedule-row--current";
      startTimeFormatted = "NOW:";
    }
    var htmlString =  `
    <div class='schedule-row ${modifiers}'>
      <div class='schedule-row__time'>${startTimeFormatted} </div>
      <div class="schedule-row__title">${item.snippet.title}</div>
    </div>`;
    return htmlString;
  });

  document.querySelector(".programme__body").innerHTML = items.join("");
}