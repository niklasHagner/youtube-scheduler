/* -------------- External deps -------------- */
var express = require('express');
var router = express.Router();
var moment = require('moment');
var YouTube = require('youtube-node');
var Promise = require('es6-promise').Promise;
var DateTimeHelper = require('../dateTimeHelper');
var winston = require('winston');

/* -------------- Config -------------- */

globalSettings = {
	shouldCache: false, //false: make new get requests to youtube every time
	printlogs: false,
	requestCounter: 0,
	MAX_PAGE_COUNT: 100,
	apiKey: process.env.YOUTUBEAPIKEY, //this env var must be manually set to your unique key for youtube-API  see README.md
	randomSortProgrammes: true
};
var now = new Date();
var startProgramme = moment(now).subtract(4, "hours").format("YYYY-MM-DD HH:mm"); //first video on the playlist will start at this time
var endProgramme = null;
var currentChannel = null;
var currentlyPlaying = null;

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
	two: {
		name: "Channel 2",
		playlist: 'PLoFIHcp8yG7RpBOZR8aqtG5nzGsJdiyFb'
	},
	test: {
		name: "test",
		id: 'PLoFIHcp8yG7Tnv63BtXOBYMRpKVOCOipS'
	}
}
for (var propname in channels) {
	channels[propname].aggregatedPlaylist = null; 
	channels[propname].cachedResult = null; 
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
router.get('/two', function (req, res) {
	getAllTheThings(req, res, channels.two);
});
router.get('/test', function (req, res) {
	getAllTheThings(req, res, channels.test);
});

/* -------------- Default route -------------- */
router.get('/', function (req, res) {
	getAllTheThings(req, res, channels.mixed);
});

/* -------------- Setup handlers -------------- */
winston.configure({
	transports: [
		new (winston.transports.File)({ filename: 'errors.log' })
	]
});
/************** Main func ************** */
function getAllTheThings(req, res, channel) {
	currentChannel = channel;
	globalSettings.requestCounter++;
	now = new Date();
	console.info(now.getHours() + ":" + now.getMinutes(), " ~ Request", globalSettings.requestCounter, "for", channel.name);

	if (typeof globalSettings.apiKey === "undefined") {
		throw new Error("Damnit! process.env.YOUTUBEAPIKEY is not set");
	}
	var plData = null;
	if (globalSettings.shouldCache && channel.cachedResult) {
		var currentTime = new Date();
		var scheduleEnd = channel.cachedResult.items[channel.cachedResult.items.length - 1].endTime;
		if (scheduleEnd - currentTime <= 0) {

			//reset schedule
			startProgramme = currentTime;
			winston.log('info', { message: 'Shedule end time ' + scheduleEnd + '.\n New start-time: ' + startProgramme });
			console.log('info', { message: 'Shedule end time ' + scheduleEnd + '.\n New start-time: ' + startProgramme });
		}
		var previousProgrammeEndTime = moment(startProgramme).toDate();
		channel.cachedResult.items.forEach(function (item, ix) {
			item.playFirst = false;
			item = setStartTime(item, previousProgrammeEndTime);
			previousProgrammeEndTime = item.endTime;
		});
		var encodedResult = encodeURIComponent(JSON.stringify(channel.cachedResult));
		res.render('index', {
			title: 'Web TV',
			encodedJson: encodedResult
		});
		return;
	}

	//fetch
	channel.aggregatedPlaylist = null

	getPlayListAsync(channel.playlist, null, channel)
		.then(function (playListData) {
			plData = playListData;
			getVideosFromPlaylistAsync(plData)
				.then(function (videoArray) {
					var plWithEnhancedVids = getPlaylistEnhanchedWithVideos(plData, videoArray);
					// if (globalSettings.randomSortProgrammes === true) {
					// 	plWithEnhancedVids.items = shuffle(plWithEnhancedVids.items);
					// }
					endProgramme = plWithEnhancedVids.items[plWithEnhancedVids.items.length - 1].endTime;
					var encodedResult = encodeURIComponent(JSON.stringify(plWithEnhancedVids));
					if (globalSettings.shouldCache) {
						channel.cachedResult = plWithEnhancedVids;
					}
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
			res.render('error', {
				message: e.message,
				error: e,
				title: 'error'
			});
		});
}

/*
promise an array of videoDetails
*/
function getVideosFromPlaylistAsync(data) {
	var promiseArray = data.items.map((playListItem) => {
		return getVideoById(playListItem.snippet.resourceId.videoId)
	});
	return new Promise(function (resolve, reject) {
		Promise.all(promiseArray).then(function (videoArray) {
			resolve(videoArray);
		});
	});
}


function setStartTime(item, previousProgrammeEndTime) {
	if (typeof previousProgrammeEndTime === "undefined") {
		previousProgrammeEndTime = moment(startProgramme).toDate();
	}

	item.startTime = previousProgrammeEndTime;
	item.startTimeFormatted = moment(item.startTime).format("HH:mm");
	item.endTime = moment(previousProgrammeEndTime).add(item.durationSeconds, "seconds").toDate();
	previousProgrammeEndTime = item.endTime;

	var diff = Math.abs(moment(item.startTime).diff(moment(item.endTime)), "seconds");
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
		currentlyPlaying = item;
		//console.log("Play this video first:");

		var skipMs = Math.ceil(Math.abs((now.getTime() - item.startTime.getTime())));
		var skipTo = new Date(skipMs);
		item.skipToSeconds = skipMs / 1000;
		item.skipToString = DateTimeHelper.msToYoutubeSkipString(skipMs);
	}
	//console.log(item.snippet.title, item.playFirst, item.skipTo, item.startTime, item.endTime);
	return item;
}

function removeBrokenVideos(playList, detailedVideos) {
	for (ix = playList.items.length - 1; ix--;) {
		var item = playList.items[ix];
		if (!item) {
			winston.log('error',
				'Video was undefined', { index: ix, playListId: playList.id });
			console.error("item", ix, "was undefined");
			playList.items.splice(ix, 1);
			continue;
		}
		var video = detailedVideos[ix];
		var shouldRemove = false;
		if (typeof video.items[0] === "undefined"
			|| video.items.length === 0) {
			console.error("index", ix, "has no video. probably deleted");
			winston.log("info", "--------" + currentChannel.name + "--------");
			winston.log('error',
				'No items for video', ix, item.title);
			playList.items.splice(ix, 1);
			detailedVideos.splice(ix, 1);
			continue;
		}
		if (item.status.privacyStatus !== "public"
			|| video.items[0].status.embeddable !== true) {
			shouldRemove = true;
			console.error(item.snippet.title, "is not public/embeddable");
		}
		if (typeof video.items === "undefined") {
			winston.log("info", "--------" + currentChannel.name + "--------");
			winston.log("god damn! video.items is undefined");
		}
		else if (typeof video.items[0] === "undefined") {
			winston.log("info", "--------" + currentChannel.name + "--------");
			winston.log("god damn! video.items[0] is undefined");
		}

		if (typeof video.items[0].contentDetails.regionRestriction !== "undefined"
			&& typeof video.items[0].contentDetails.regionRestriction.blocked !== "undefined"
			&& video.items[0].contentDetails.regionRestriction.blocked.indexOf("SE") > -1) {
			shouldRemove = true;
			console.error(item.snippet.title, "has regionRestriction in SE");
			winston.log("info", "--------" + currentChannel.name + "--------");
			winston.log('error',
				'Video not avaliable in Sweden' + ' ' + ix + ' ' + item.title);
		}
		if (shouldRemove) {
			playList.items.splice(ix, 1);
			detailedVideos.splice(ix, 1);
		}
	}
	return { playList: playList, detailedVideos: detailedVideos };
}

/*
Extend playlist items with metadata from video details
*/
function getPlaylistEnhanchedWithVideos(playList, detailedVideos) {
	now = new Date();
	if (detailedVideos.length !== playList.items.length)
		throw new Error(playList.items.length, "items in playlist");
	var previousProgrammeEndTime = moment(startProgramme).toDate();

	var filtered = removeBrokenVideos(playList, detailedVideos);
	playList = filtered.playList;
	playList.items = playList.items.filter((item) => { return typeof item !== "undefined"; });
	detailedVideos = filtered.detailedVideos;
	if (detailedVideos.length !== playList.items.length)
		console.error(videos.length, "videos", playList.items.length, "items in playlist");

	/* reversed loop just so we can remove items without contentDetails, which is a common problem */
	playList.items = playList.items.reverse();
	for (ix = playList.items.length -1; ix >= 0; ix--) {
		var item = playList.items[ix];
		var video = detailedVideos[ix];
		if (!video || !video.items[0]) {
			console.error("video.items doesn't exist for index", ix);
			playList.items.splice(ix, 1);
			continue;
		}
		else if (!video.items[0].contentDetails) {
			console.error("Damn! Contentdetails doesn't exist on item", ix, "removing that video");
			console.error(video.items[0]);
			playList.items.splice(ix, 1);
			continue;
		}
		var durationString = video.items[0].contentDetails.duration;
		var hms = DateTimeHelper.getHoursMinutesSeconds(durationString);
		item.durationSeconds = hms.s * 1 + hms.m * 60 + (hms.h * 60 * 60);
		item = setStartTime(item, previousProgrammeEndTime);
		previousProgrammeEndTime = item.endTime;
	}
	playList.items = playList.items.reverse();

	//Loop the schedule by moving past stuff to the end
	previousProgrammeEndTime = playList.items[playList.items.length - 1].endTime;
	while (playList.items[0].past === true) {
		var item = setStartTime(playList.items[0], previousProgrammeEndTime);
		previousProgrammeEndTime = item.endTime;
		item.past = false;
		item.future = true;
		playList.items.push(playList.items.splice(0, 1)[0]);
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

function getPlayListAsync(videoId, pageToken, settings) {
	// if (typeof pageToken === "undefined" || pageToken === null)
	// 	pageToken = null;
	var maxPage = (settings && settings.pageCounter) ? settings.pageCounter : null;
	if (maxPage > 50)
		maxPage = 50;
	

	return new Promise(function (fulfill, reject) {
		youTube.getPlayListsItemsById(videoId, maxPage, function (error, result) {
			if (error) {
				console.error(error);
				winston.log("info", "--------" + currentChannel.name + "--------");

				winston.log('error',
					'Exception', { error: error });
				reject(error);
			} else {
				//aggregate
				if (settings.aggregatedPlaylist === null) {
					settings.aggregatedPlaylist = result;
				} else {
					Array.prototype.push.apply(settings.aggregatedPlaylist.items, result.items);
				}

				settings.pageCounter = settings.pageCounter > 0 ? settings.pageCounter : 0;
				if (result.nextPageToken && settings.pageCounter <= globalSettings.MAX_PAGE_COUNT) {
					settings.pageCounter++;
					fulfill(getPlayListAsync(videoId, result.nextPageToken, settings));
				}
				else { //finished pagination
					fulfill(settings.aggregatedPlaylist);
				}
			}
		});
	});
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}


/* -------------- Extensions -------------- */
function debuglog(args) {
	if (globalSettings.printlogs) {
		console.log(args);
	}
}

module.exports = router;