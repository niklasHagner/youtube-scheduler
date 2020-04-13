var express = require('express');
var router = express.Router();
var moment = require('moment');
var winston = require('winston');
const config = require("exp-config");
var fs = require('fs');
var Promise = require('es6-promise').Promise;
var DateTimeHelper = require('../lib/dateTimeHelper');
var YouTube = require('../lib/youtubeApiWrapper');

/* 
Note: youtube's default video objects are crude and only contain *some* contentDetails, but they lack `duration`.
This is why we must make an extra apiCall to fetch the full set of details for every video.

Crude video example:
"{"kind":"youtube#playlistItem","etag":"\"p4VTdlkQv3HQeTEaXgvLePAydmU/_-CGILTaHIZUM-sqZ8mZUOyC5fk\"","id":"UExvRklIY3A4eUc3Unc4MVZ6aWFtMTZ1MVVfdi10V1VJbC4zMDg5MkQ5MEVDMEM1NTg2","snippet":{"publishedAt":"2016-09-24T18:59:53.000Z","channelId":"UCHUo4QHEhdHFAvNaa5cJvCQ","title":"Alan Ladd western movies full length || Saskatchewan 1954 || Classic western movies on youtube","description":"","thumbnails":{"default":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/default.jpg","width":120,"height":90},"medium":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/mqdefault.jpg","width":320,"height":180},"high":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/hqdefault.jpg","width":480,"height":360}},"channelTitle":"BenRangel","playlistId":"PLoFIHcp8yG7Rw81Vziam16u1U_v-tWUIl","position":0,"resourceId":{"kind":"youtube#video","videoId":"qcF8v38hRoE"}},"contentDetails":{"videoId":"qcF8v38hRoE","videoPublishedAt":"2015-11-06T08:20:41.000Z"},"status":{"privacyStatus":"public"}}"

Detailed video example:
"{"kind":"youtube#videoListResponse","etag":"\"p4VTdlkQv3HQeTEaXgvLePAydmU/fNPqa_TTtS6z_F5ugy_thxjDeAI\"","pageInfo":{"totalResults":1,"resultsPerPage":1},"items":[{"kind":"youtube#video","etag":"\"p4VTdlkQv3HQeTEaXgvLePAydmU/FvUbhdN5wAwQCnBZm6KVupmaQs4\"","id":"qcF8v38hRoE","snippet":{"publishedAt":"2015-11-06T08:20:41.000Z","channelId":"UCLRUgl28CtEKRf7Pio5KztQ","title":"Alan Ladd western movies full length || Saskatchewan 1954 || Classic western movies on youtube","description":"","thumbnails":{"default":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/default.jpg","width":120,"height":90},"medium":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/mqdefault.jpg","width":320,"height":180},"high":{"url":"https://i.ytimg.com/vi/qcF8v38hRoE/hqdefault.jpg","width":480,"height":360}},"channelTitle":"Jordon Peyton","tags":["Alan Ladd western movies full length","Saskatchewan 1954","Classic western movies on youtube","Western (TV Genre)","Alan Ladd (Film Actor)","western movies full length free","western movies action","western movies alan ladd","western movies best","western movies cowboys","western movies classics","western movies english full length","the best western movies ever","spaghetti western movies english"],"categoryId":"1","liveBroadcastContent":"none","localized":{"title":"Alan Ladd western movies full length || Saskatchewan 1954 || Classic western movies on youtube","description":""},"defaultAudioLanguage":"en"},"contentDetails":{"duration":"PT1H23M33S","dimension":"2d","definition":"sd","caption":"false","licensedContent":false,"projection":"rectangular"},"status":{"uploadStatus":"processed","privacyStatus":"public","license":"youtube","embeddable":true,"publicStatsViewable":false},"statistics":{"viewCount":"206519","likeCount":"406","dislikeCount":"54","favoriteCount":"0","commentCount":"39"}}]}"
*/

globalSettings = {
	shouldCache: process.env.SHOULD_CACHE || true, //false: make new get requests to youtube every time
	printlogs: false,
	requestCounter: 0,
	MAX_PAGE_COUNT: 50,
	apiKey: process.env.YOUTUBEAPIKEY || config.YOUTUBEAPIKEY,
	randomSortProgrammes: true
};
var now = new Date();
var startProgramme = moment(now).subtract(4, "hours").format("YYYY-MM-DD HH:mm"); //first video on the playlist will start at this time
var currentChannel = null;

var youTube = new YouTube();
youTube.setKey(globalSettings.apiKey);
/*
	Change these playlist keys!
	The keys are the strings after `pl=` in the url when watching a playlist on youtube.com
*/
var channels = {
	mixed: {
		name: "Channel 1",
		playlist: 'PLoFIHcp8yG7RAH_6ctBzVHi9DN_6nKAc4'
	},
	mtv: {
		name: "MTV",
		playlist: 'PLoFIHcp8yG7Tnv63BtXOBYMRpKVOCOipS'
	},
	scifi: {
		name: "Sci-Fi",
		playlist: 'PLoFIHcp8yG7TZCMpvoJN1sTxLXSC2fX-o'
	},
	western: {
		name: "Western",
		playlist: 'PLoFIHcp8yG7Rw81Vziam16u1U_v-tWUIl'
	},
	classics: {
		name: "old school classics",
		playlist: 'PLoFIHcp8yG7QOui_Nljd3L3ZDn-47fnkP'
	},
	horror: {
		name: "terror",
		playlist: 'PLoFIHcp8yG7R9uevgGe_oG3vWYwfPvhPc'
	},
	docs: {
		name: "Documentaries",
		playlist: 'PLoFIHcp8yG7TbDOaNjkw6UMPjzaNC-4hX'
	},
	action: {
		name: "Action",
		playlist: 'PLoFIHcp8yG7R_gbb4VCUOGfEmXZEs03A9'
	},
	two: {
		name: "Channel 2",
		playlist: 'PLoFIHcp8yG7RpBOZR8aqtG5nzGsJdiyFb'
	},
	test: {
		name: "test",
		id: 'PLoFIHcp8yG7RLSsgPfsjooecPAa2Mnim7'
	}
}
for (var propname in channels) {
	channels[propname].aggregatedPlaylist = null;
	channels[propname].cachedEnhancedVideos = null;
};


/* -------------- Channel routes -------------- */
router.get('/western', function (req, res) {
	getAllTheThings(req, res, channels.western);
});
router.get('/scifi', function (req, res) {
	getAllTheThings(req, res, channels.scifi);
});
router.get('/classics', function (req, res) {
	getAllTheThings(req, res, channels.classics);
});
router.get('/horror', function (req, res) {
	getAllTheThings(req, res, channels.horror);
});
router.get('/mtv', function (req, res) {
	getAllTheThings(req, res, channels.mtv);
});
router.get('/docs', function (req, res) {
	getAllTheThings(req, res, channels.docs);
});
router.get('/action', function (req, res) {
	getAllTheThings(req, res, channels.action);
});
router.get('/two', function (req, res) {
	getAllTheThings(req, res, channels.two);
});

/* -------------- Default route -------------- */
router.get('/', function (req, res) {
  if (typeof globalSettings.apiKey === "undefined") {
		throw new Error("Damnit! process.env.YOUTUBEAPIKEY is not set");
	}
	getAllTheThings(req, res, channels.mixed);
});

/* -------------- Test route -------------- */
router.get('/static-test', function (req, res) {
  fs.readFile('public/demo.html', 'utf8', (err, text) => {
    res.send(text);
  });
});

/* -------------- Setup handlers -------------- */
winston.configure({
	transports: [
		new (winston.transports.File)({ filename: 'errors.log' })
	]
});

/* -------------- Main logic -------------- */
function getAllTheThings(req, res, channel) {
	currentChannel = channel;
	globalSettings.requestCounter++;
	now = new Date();
	console.info(now.getHours().toFixed(2) + ":" + now.getMinutes().toFixed(2), " ~ Request", globalSettings.requestCounter, "for", channel.name);
	
	if (globalSettings.shouldCache && channel.cachedEnhancedVideos) {
		var currentTime = new Date();
		var scheduleEnd = channel.cachedEnhancedVideos[channel.cachedEnhancedVideos.length - 1].endTime;
		if (scheduleEnd - currentTime <= 0) {

			//reset schedule
			startProgramme = currentTime;
			winston.log('info', { message: 'Shedule end time ' + scheduleEnd + '.\n New start-time: ' + startProgramme });
			console.log('info', { message: 'Shedule end time ' + scheduleEnd + '.\n New start-time: ' + startProgramme });
		}
		var previousProgrammeEndTime = moment(startProgramme).toDate();
		channel.cachedEnhancedVideos.forEach(function (item, ix) {
			item.playFirst = false;
			item = setStartTime(item, previousProgrammeEndTime);
			previousProgrammeEndTime = item.endTime;
		});
		channel.cachedEnhancedVideos = channel.cachedEnhancedVideos.sort(function(a,b){
			return new Date(b.startTime) - new Date(a.startTime);
		}).reverse();
		var encodedResult = encodeURIComponent(JSON.stringify(channel.cachedEnhancedVideos));
		res.render('index', {
			title: 'Web TV',
			encodedJson: encodedResult
		});
		return;
	}

	channel.aggregatedPlaylist = null

	getEnhancedVideosFromChannel(channel).then((crudeVideos) => {
			getDetailsFromAllVideos(crudeVideos).then((detailedVideos) => { 
				var enhancedVideos = getEnhancedVideos(crudeVideos, detailedVideos);
				enhancedVideos = enhancedVideos.sort(function(a,b){
					return new Date(b.startTime) - new Date(a.startTime);
				}).reverse();
				if (globalSettings.shouldCache) {
					channel.cachedEnhancedVideos = enhancedVideos;
				}
				var encodedResult = encodeURIComponent(JSON.stringify(enhancedVideos));
			
				res.render('index', {
					title: 'Web TV',
					encodedJson: encodedResult
				});
			})
			.catch(function (e) {
				console.error(e);
				winston.log("CHANNEL:" + currentChannel.name);
				winston.log('error: ' + e.message);
				res.render('error', {
					message: e.message,
					error: e,
					title: 'error'
				});
			})
		})
		.catch(function (e) {
			console.error(e);
			winston.log("CHANNEL:" + currentChannel.name);
			winston.log('error: ' + e.message);
			res.render('error', {
				message: e.message,
				error: e,
				title: 'error'
			});
		});
}


/*
Return a promise with an array of videoDetails
Note: the default video-objects do not contain details such as duration
*/
function getDetailsFromAllVideos(crudeVideos) {
	var promiseArray = crudeVideos.map((crudeVideo) => {
		return getVideoById(crudeVideo.snippet.resourceId.videoId)
	});
	return new Promise(function (resolve, reject) {
		Promise.all(promiseArray).then(function (detailedVideos) {
			resolve(detailedVideos);
		});
	});
}

function getEnhancedVideosFromChannel(channel) {
	const playListId = channel.playlist;
	const initialNextPageToken = playListId;

	return new Promise(function (resolve, reject) {
		iterativeGetPlayListsItemsById(playListId, initialNextPageToken, function(error, result) {
			resolve(result);
		});
	});
}

function iterativeGetPlayListsItemsById(playListId, nextPageToken, cb){
	youTube.getPlayListsItemsById(playListId, config.max, nextPageToken, function(error, result) {
		if (error) {
			cb(error);
		}
		else {
			var items = result.items;
			if(result.nextPageToken){
				iterativeGetPlayListsItemsById(playListId, result.nextPageToken, function(err, its){
					if(err){
						return cb(err);
					}
					items = items.concat(its);
					cb(null, items);
				});
			} else {
				cb(null, items)
			}
		}
	});
};


function setStartTime(item, previousProgrammeEndTime) {
	if (typeof previousProgrammeEndTime === "undefined") {
		previousProgrammeEndTime = moment(startProgramme).toDate();
	}

	item.startTime = previousProgrammeEndTime;
	item.startTimeFormatted = moment(item.startTime).format("HH:mm");
	item.endTime = moment(previousProgrammeEndTime).add(item.durationSeconds, "seconds").toDate();
	previousProgrammeEndTime = item.endTime;

	var startDiff = moment(now).diff(item.startTime, 'seconds');
	var endDiff = moment(now).diff(item.endTime, 'seconds');

	item.past = false;
	item.playFirst = false;
	item.future = false;

	if (endDiff > 0) {
		item.past = true;
	}
	if (startDiff > 0 && endDiff < 0) {
		item.playFirst = true;

		var skipMs = Math.ceil(Math.abs((now.getTime() - item.startTime.getTime())));
		item.skipToSeconds = skipMs / 1000;
		item.skipToString = DateTimeHelper.msToYoutubeSkipString(skipMs);
	}
	return item;
}

/*
Remove videos which lack detailed info (such as duration) and those who will not be able to play in the clientside player due to restrictions.
*/
function removeBrokenVideos(crudeVideos, detailedVideos) {
	for (ix = crudeVideos.length - 1; ix--;) {
		var item = crudeVideos[ix];
    var video = detailedVideos[ix];
    var videoItem = video.items[0];
		var shouldRemove = false;
		if (!videoItem || !video || !video.items || !video.items.length) {
			const problematicTitle = item && item.snippet && item.snippet.title ? item.snippet.title : "unknown title";
			console.error("Missing detais for", problematicTitle, "etag:", item.etag);
			shouldRemove = true;
		}
		else if (item.status.privacyStatus !== "public"
			|| videoItem.status.embeddable !== true) {
			shouldRemove = true;
			console.error(item.snippet.title, "is not public/embeddable");
		}
		else if (typeof videoItem.contentDetails.regionRestriction !== "undefined"
			&& typeof videoItem.contentDetails.regionRestriction.blocked !== "undefined"
      && videoItem.contentDetails.regionRestriction.blocked.indexOf("SE") > -1
    ){
			shouldRemove = true;
			console.error("item", ix, item.snippet.title, "has regionRestriction in SE");
			winston.log('error',
				'Video not avaliable in Sweden' + ' ' + ix + ' ' + item.title);
		}

		if (shouldRemove) {
			crudeVideos.splice(ix, 1);
			detailedVideos.splice(ix, 1);
		}
	}
	return { crudeVideos, detailedVideos };
}

/*
Extend crude videos with some relevant extra details
*/
function getEnhancedVideos(crudeVideos, detailedVideos) {
	now = new Date();
	if (detailedVideos.length !== crudeVideos.length)
		throw new Error(crudeVideos.length, "items in playlist");
	var previousProgrammeEndTime = moment(startProgramme).toDate();

	var filtered = removeBrokenVideos(crudeVideos, detailedVideos);
	playList = filtered.crudeVideos;
	crudeVideos = crudeVideos.filter((item) => { return typeof item !== "undefined"; });
	detailedVideos = filtered.detailedVideos;
	if (detailedVideos.length !== crudeVideos.length)
		console.error(videos.length, "videos", crudeVideos.length, "crude videos");

	console.log("crudeVideos:", crudeVideos.length, "detailedVideos:", detailedVideos.length);

	// if (globalSettings.randomSortProgrammes === true) {
	crudeVideos = shuffle(crudeVideos);
	// }

	//This loop is reversed, to make it simpler to delete items without contentDetails (a common problem)
	crudeVideos = crudeVideos.reverse();
	for (ix = crudeVideos.length -1; ix >= 0; ix--) {
		var item = crudeVideos[ix];
    var video = detailedVideos[ix];
    var videoItem = video.items[0]
		if (!video || !videoItem) {
			console.error("video.items doesn't exist for index", ix);
			crudeVideos.splice(ix, 1);
			continue;
		}
		else if (!videoItem.contentDetails) {
			console.error("Damn! Contentdetails doesn't exist on item", ix, "removing that video");
			console.error(videoItem);
			crudeVideos.splice(ix, 1);
			continue;
		}
		var durationString = videoItem.contentDetails.duration;
		var hms = DateTimeHelper.getHoursMinutesSeconds(durationString);
		item.durationSeconds = hms.s * 1 + hms.m * 60 + (hms.h * 60 * 60);
		item = setStartTime(item, previousProgrammeEndTime);
		previousProgrammeEndTime = item.endTime;
	}
	crudeVideos = crudeVideos.reverse();

	//Loop the schedule by moving past stuff to the end
	previousProgrammeEndTime = crudeVideos[crudeVideos.length - 1].endTime;
	while (crudeVideos[0].past === true) {
		var item = setStartTime(crudeVideos[0], previousProgrammeEndTime);
		previousProgrammeEndTime = item.endTime;
		item.past = false;
		item.future = true;
		crudeVideos.push(crudeVideos.splice(0, 1)[0]);
	}

	return playList;
}

function getVideoById(videoId) {
	return new Promise(function (fulfill, reject) {
		youTube.getById(videoId, function (error, result) {
			if (error) {
				console.error(error);
				winston.log('error',
					'Exception', { error: error });
				reject(error);
			}
			else {
				fulfill(result);
			}
		});
	});
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle: pick a remaining element and swap it with the current element.
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

module.exports = router;