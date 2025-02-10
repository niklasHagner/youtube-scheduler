let player;
const state = { isPlaying: false }

injectYoutubeIframePlayerScript();

window.hasAlertedAboutManualPlay = false;
let hasAlertedAboutAdblock = false;
let onPlayerReadyEventHasFired = false;

function getNextVideo() {
	const nowIndex = window.youtubeData.indexOf(window.playNowVideo);
	const nextIndex = (window.youtubeData.length > nowIndex + 1) ? nowIndex + 1 : 0;
	const nextVideo = window.youtubeData[nextIndex];
	window.playNowVideo = nextVideo;
	return nextVideo;
}

function injectYoutubeIframePlayerScript() {
  const newScriptTag = document.createElement('script');
  newScriptTag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(newScriptTag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
	if (typeof window.youtubeData === "undefined") {
		console.error("ERROR! window.youtubeData does not exist");
		return;
	}
	const videos = window.youtubeData;
	window.playNowVideo = videos.find(function (item) { return item.playFirst == true });
	if (!playNowVideo) {
    console.log("could not find playFirst so just playing the first video");
		playNowVideo = videos[0];
	}
	const playerSettings = getPlayerSettings();
	player = new YT.Player('player', playerSettings);
	//console.log(player.getAvailableQualityLevels());
  //player.setPlaybackQuality('highres');
  // videos.forEach(function (x) { console.log(x.startTimeFormatted, x.startTime, x.snippet.title) });

	createProgramme(videos);
}


function getPlayerSettings() {
	return {
		width: '1280',
		height: '780',
		playerVars: {
			autoplay: 1,
      mute: 1, //since 2018 autoplay will not work without mute
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
}

const readyEvent = new Event('youtubePlayerReady');
function onPlayerReady(event) {
  onPlayerReadyEventHasFired = true;
  const videoToCue = {
		videoId: playNowVideo.snippet.resourceId.videoId,
		startSeconds: playNowVideo.skipToSeconds
	};
	event.target.cueVideoById(videoToCue.videoId, videoToCue.startSeconds);
  console.log("cue video", playNowVideo);
  window.setTimeout(() => {
    event.target.playVideo();
  }, 1000);
  window.dispatchEvent(readyEvent);

  const storedMuteSetting = JSON.parse(localStorage.getItem("muteSound"));
  if (storedMuteSetting && typeof mute === "function") {
    var muteToggles = [...document.querySelectorAll('.mute-toggle')];
    muteToggles.forEach((x) => { mute(x) });
  }
}

setTimeout(function() {
  if (!onPlayerReadyEventHasFired && !hasAlertedAboutAdblock) {
    alert("The Youtube-player didn't load correctly. Possibly because your browser is preventing a script. Try disabling extensions like Popupblocker and AdBlocker.");
    hasAlertedAboutAdblock = true;
  }
}, 5000);

function handleBufferTimeouts(event) {
	const maxWait = 14000;
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
  if (event.data == -1) {
    console.log("Youtube Player state is -1");
    if (!window.hasAlertedAboutManualPlay) {
      alert("YoutubePlayer failed to autoplay. You have to click the play button manually.");
      window.hasAlertedAboutManualPlay = true;
    }
    document.querySelector("#tv-backdrop").style="z-index: 1"; // Reset from z-index:3 to something that doesn't overlay
  }
	else if (event.data == YT.PlayerState.ENDED) {
		setTimeout(function () { playNext(event), 100 });
	}
	else if (event.data == YT.PlayerState.BUFFERING) {
		state.isPlaying = false;
		handleBufferTimeouts(event);
	}
	else if (event.data == YT.PlayerState.PLAYING) {
		setTimeout(function() { document.querySelector("#tv-backdrop").classList.remove("loading"); }, 3500);
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
	const nextVideo = getNextVideo();
	const cueObject = {
		videoId: nextVideo.snippet.resourceId.videoId
	};
	if (nextVideo && nextVideo.snippet && nextVideo.snippet.title) {
		console.log("Playing next video", nextVideo.snippet.title, ".Skip to seconds:",  nextVideo.skipToSeconds);
	}
	if (nextVideo.skipToSeconds && Number.isInteger(nextVideo.skipToSeconds)) {
		cueObject.startSeconds = nextVideo.skipToSeconds;
	}
	event.target.cueVideoById(cueObject);
	event.target.playVideo();
}

function createProgramme(videos) {
	const nowTime = new Date().getTime();

	const scheduledItems = videos.filter((item) => {
		const endTime = new Date(item.endTime).getTime();
    return nowTime <= endTime;
	});

  const items = scheduledItems.map(function (item, index) {
    const endTime = new Date(item.endTime).getTime();
    const startTime = new Date(item.startTime).getTime();
    const startTimeFormatted = new Date(item.startTime).toTimeString().slice(0,5);
    const modifierClasses = "schedule-row--future";

    if (endTime > nowTime && startTime < nowTime) {
      modifierClasses += " schedule-row--current";
      const endTimeFormatted = new Date(item.endTime).toTimeString().slice(0,5);
      startTimeFormatted = `NOW<br><span class="schedule-row__time-small">${startTimeFormatted} - ${endTimeFormatted}</span>`;
    }
    const htmlString =  `
    <div class="schedule-row ${modifierClasses}">
      <div class="schedule-row__time">${startTimeFormatted}</div>
      <div class="schedule-row__title">${item.snippet.title}</div>
    </div>`;
    return htmlString;
  });

  document.querySelector(".programme__body").innerHTML = items.join("");
}