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
	hms.formatted = { h: hms.h, m: hms.m, s: hms.s };

	if (hms.h.length == 1) hms.formatted.h = "0" + hms.h;
	if (hms.m.length == 1) hms.formatted.m = "0" + hms.m;
	if (hms.s.length == 1) hms.formatted.s = "0" + hms.s;

	return hms;
}
module.exports = {
	msToYoutubeSkipString : msToYoutubeSkipString,
	getHoursMinutesSeconds: getHoursMinutesSeconds
}