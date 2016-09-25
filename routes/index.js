/* -------------- External deps -------------- */
var express = require('express');
var router = express.Router();
var moment = require('moment');
var YouTube = require('youtube-node');
var Promise = require('es6-promise').Promise;

/* -------------- Config -------------- */

 //you MUST manually set an enviroment variable to your apikey
//See instructions in app.js or the readme
var apiKey =  process.env.YOUTUBEAPIKEY;
var startProgramme = moment(now).format("YYYY-MM-DD") + " 00:00"; //first video on the playlist will start at this time

globalsettings = { 
	shouldCache: false, //enabled it will fetch from youtube on every request
	printlogs: false,
	requestCounter : 0
}
/*
	Change these playlist keys!
	The keys are the strings after `pl=` in the url when watching a playlist on youtube.com
*/
var channels = {
	mixed: { 
		name: "Main Channel",
		playlist: 'PLoFIHcp8yG7RAH_6ctBzVHi9DN_6nKAc4', 
		aggregatedPlaylist: null,
		cachedResult: null
	},
	scifi: { 
		name: "Sci-Fi",
		playlist: 'PLoFIHcp8yG7TZCMpvoJN1sTxLXSC2fX-o', 
		aggregatedPlaylist: null,
		cachedResult: null
	},
	western:  { 
		name: "Western",
		playlist: 'PLoFIHcp8yG7Rw81Vziam16u1U_v-tWUIl', 
		aggregatedPlaylist: null,
		cachedResult: null
	},
	classics:  { 
		name: "old school classics",
		playlist: 'PLoFIHcp8yG7QOui_Nljd3L3ZDn-47fnkP', 
		aggregatedPlaylist: null,
		cachedResult: null
	},
	horror:  { 
		name: "horror",
		id: 'PLoFIHcp8yG7R9uevgGe_oG3vWYwfPvhPc', 
		aggregatedPlaylist: null,
		cachedResult: null
	}
}

var now = new Date();

/* -------------- Extensions -------------- */
function debuglog(args) {
	if (globalSettings.printlogs) {
		console.log(args);
	}
}

/* -------------- Cgannel routes -------------- */
router.get('/western', function (req, res) {
	var channel = channels.western;
	getAllTheThings(req,res, channel);
});
router.get('/scifi', function (req, res) {
	var channel = channels.scifi;
	getAllTheThings(req,res, channel);
});
router.get('/classics', function (req, res) {
	var channel = channels.classics;
	getAllTheThings(req,res, channel);
});
router.get('/horror', function (req, res) {
	var channel = channels.horror;
	getAllTheThings(req,res, channel);
});

/* -------------- Default route -------------- */
router.get('/', function (req, res) {
	var channel = channels.mixed;
	getAllTheThings(req,res, channel);
});

/************** Main func ************** */
function getAllTheThings(req,res, settings) {
	globalsettings.requestCounter++;
	now = new Date();
	console.info(now.getHours() +":"+now.getMinutes(), " ~ Request", globalsettings.requestCounter, "for", settings.name);

	if (typeof apiKey === "undefined") {
    	throw new Error("Damnit! process.env.YOUTUBEAPIKEY is not set");
	}

	var plData = null;
	if (globalsettings.shouldCache && settings.cachedResult) {
		var previousProgrammeEndTime = moment(startProgramme).toDate();
		settings.cachedResult.items.forEach(function (item) {
			item.playFirst = false;
			item = setStartTime(item, previousProgrammeEndTime);
			previousProgrammeEndTime = item.endTime;
		});
		var encodedResult = encodeURIComponent(JSON.stringify(settings.cachedResult));
		res.render('index', {
			title: 'Web TV',
			encodedJson: encodedResult
		});
		return;
	}

	//fetch
	settings.aggregatedPlaylist = null

	getPlayListAsync(settings.playlist, null, settings).then(function (playListData) {
		plData = playListData;
		getVideosFromPlaylistAsync(plData).then(function (videoArray) {
			var plWithEnhancedVids = getPlaylistEnhanchedWithVideos(plData, videoArray);
			var encodedResult = encodeURIComponent(JSON.stringify(plWithEnhancedVids));
			if (globalsettings.shouldCache) {
				settings.cachedResult = plWithEnhancedVids;
			}
			res.render('index', {
				title: 'Web TV',
				encodedJson: encodedResult
			});
		})
			.catch(function (e) {
				console.error(e);
				res.render('error', {
					message: e.message,
					error: {},
					title: 'error'
				});
			})
	});
}

/* -------------- Logic -------------- */


/*
promise an array of videoDetails
*/
function getVideosFromPlaylistAsync(data) {

	var promiseArray = data.items.map((playListItem) => {
		return getVideoById(playListItem.snippet.resourceId.videoId)
	});
	var p = new Promise(function (resolve, reject) {
		Promise.all(promiseArray).then(function (videoArray) {
			resolve(videoArray);
		});
	});
	return p;
}


function setStartTime(item, previousProgrammeEndTime) {
	if (typeof previousProgrammeEndTime === "undefined") {
		previousProgrammeEndTime = moment(startProgramme).toDate();
	}
	item.startTime = previousProgrammeEndTime;
	item.startTimeFormatted = moment(item.startTime).format("HH:mm");
	item.endTime = moment(previousProgrammeEndTime).add(item.durationSeconds, "seconds").toDate();
	previousProgrammeEndTime = item.endTime;

	item.playFirst = false;
	var diff = Math.abs(moment(item.startTime).diff(moment(item.endTime)), "seconds");
	var startDiff = moment(now).diff(item.startTime, 'seconds');
	var endDiff = moment(now).diff(item.endTime, 'seconds');
	if (startDiff > 0 && endDiff < 0) {
		item.playFirst = true;
		//console.log("PLAY FIRST");

		var skipMs = Math.ceil(Math.abs((now.getTime() - item.startTime.getTime())));
		var skipTo = new Date(skipMs);
		item.skipToSeconds = skipMs / 1000;
		item.skipToString = msToYoutubeSkipString(skipMs);
		//console.log(item.snippet.title, item.playFirst, item.skipTo, item.startTime, item.endTime);
	}
	return item;
}

/*
take playlist. extend it's items with metadata from video details
*/
function getPlaylistEnhanchedWithVideos(playList, detailedVideos) {
	now = new Date();
	if (detailedVideos.length !== playList.items.length)
		throw error(videos.length, "videos", playList.items.length, "items");
	var previousProgrammeEndTime = moment(startProgramme).toDate();

	playList.items = playList.items.filter(function(item) { 
		return item.status.privacyStatus == "public" 
	});

	playList.items.forEach((item, ix) => {
		//console.log("---------------------");
		var video = detailedVideos[ix];
		//console.log(video.items[0].snippet.title);
		var durationString = video.items[0].contentDetails.duration;
		var hms = {
			h: durationString.match(/\dh/i) ? durationString.match(/\d+h/i)[0].replace("H", "") : 0,
			m: durationString.match(/\dm/i) ? durationString.match(/\d+m/i)[0].replace("M", "") : 0,
			s: durationString.match(/\ds/i) ? durationString.match(/\d+s/i)[0].replace("S", "") : 0
		};
		var hmsFormatted = { h: hms.h, m: hms.m, s: hms.s };
		if (hms.h.length == 1) hmsFormatted.h = "0" + hms.h;
		if (hms.m.length == 1) hmsFormatted.m = "0" + hms.m;
		if (hms.s.length == 1) hmsFormatted.s = "0" + hms.s;
		item.durationYoutube = durationString;
		item.durationFormatted = hmsFormatted.h + ":" + hmsFormatted.m + ":" + hmsFormatted.s;
		item.durationSeconds = hms.s * 1 + hms.m * 60 + (hms.h * 60 * 60);
		item = setStartTime(item, previousProgrammeEndTime);
		previousProgrammeEndTime = item.endTime;
		//console.log(item.startTimeFormatted, item.snippet.title, "| LENGTH:", item.durationFormatted);
	});
	//console.log("Processing playlist videos finished");
	return playList;
}

function getVideoById(videoId) {
	var youTube = new YouTube();
	youTube.setKey(apiKey);

	return new Promise(function (fulfill, reject) {
		youTube.getById(videoId, function (error, result) {
			if (error) {
				console.error(error);
				reject(error);
			}
			else {
				fulfill(result);
			}
		});
	});
}

function getPlayListAsync(videoId, page, settings) {
	if (typeof page === "undefined" || page === null)
		page = null;

	var youTube = new YouTube();
	youTube.setKey(apiKey);

	return new Promise(function (fulfill, reject) {
		youTube.getPlayListsItemsById(videoId, page, function (error, result) {
			if (error) {
				console.error(error);
				reject(error);
			}
			else {
				//aggregate
				if (settings.aggregatedPlaylist == null) {
					settings.aggregatedPlaylist = result;
				} else {
					Array.prototype.push.apply(settings.aggregatedPlaylist.items, result.items);
				}

				//return
				if (result.nextPageToken || settings.maxPageCount >= settings.pageCounter) {
					//console.log("page", settings.pageCounter, " : ", result.nextPageToken, "1st : ", result.items[0].snippet.title);
					settings.pageCounter++;
					fulfill(getPlayListAsync(videoId, result.nextPageToken, settings));
				}
				else {
					//console.log("found", settings.aggregatedPlaylist.items.length, "videos");
					fulfill(settings.aggregatedPlaylist);
				}
			}
		});
	});
}

/* -------------- Helpers -------------- */

function msToYoutubeSkipString(duration) {
    var milliseconds = parseInt((duration % 1000) / 100)
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + "H" + minutes + "M" + seconds + "S";
}

function getHoursMinutesSeconds(durationString) {
	var hms = {
		h: durationString.match(/\dh/i) ? durationString.match(/\d+h/i)[0].replace("H", "") : 0,
		m: durationString.match(/\dm/i) ? durationString.match(/\d+m/i)[0].replace("M", "") : 0,
		s: durationString.match(/\ds/i) ? durationString.match(/\d+s/i)[0].replace("S", "") : 0
	};
	if (hms.h.length == 1) hms.h = "0" + hms.h;
	if (hms.m.length == 1) hms.m = "0" + hms.m;
	if (hms.s.length == 1) hms.s = "0" + hms.s;
	return hms;
}

module.exports = router;