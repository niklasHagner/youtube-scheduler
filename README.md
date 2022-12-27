# Youtube Scheduler
## Broadcast playlists as TV channels
Node server using the youtube data api v3 to schedule videos from playlists and broadcast them as a TV-channels, removing the ability to pause or skip.

![screenshot](http://i.imgur.com/220jd5k.jpg)

## Tech
* [Youtube Data API v3](https://developers.google.com/youtube/v3) is accessed via a wrapper, basically a modified version of https://github.com/nodenica/youtube-node/blob/master/lib/youtube.js (which had pagination problems at the time this repo was created)
* The frontend uses [Youtube Iframe API](https://developers.google.com/youtube/iframe_api_reference)

## How to build and run this project
1. Create a unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard, go to "Enabled APIs and Services" and enable the "Youtube Data API v3". You do not need oAuth. Create a `.env` file in the root of this project with the line `YOUTUBEAPIKEY=your_key`
2. `npm install`
3. `npm run build` - to compile LESS to CSS
4. `node start` to run the node-server
5. browse to `http://localhost:8080`


## Troubleshooting backend problems
* Pagination in youtube data api v3 has been a constant source of bugs. Before 2018 when you accessed a playlist you had had to submit an initial pageId set to the playlistId. Since 2018 you shouldn't submit any paginationId for the first page.
* `"Invalid unsigned integer value: 'CAUQAA'."` this error has been caused by youtubeApiWrapper.js mixing up the params `nextPageToken` (string) and `maxPage` (int)
* YoutubeAPI v3 has a common 400-error: 'The request specifies an invalid page token'
* If some videos in the playlist were not found, set `shouldCache=false` and try again

## Troubleshooting Frontend problems
* Age restricted videos cannot be played in the youtube iframe api. They should be manualluy removed from the playlist
* Browser extensions like AdBlocker or PopupBlocker can preventing youtube's `base.js` script from loading other scripts such as `endscreen.js` and lead to events like `onPlayerReady` and `onStateChange` never firing. Make sure to disable all plugins and test again.
* If some video are not played: This occurss when the clientside `onError` method skips to the next video if the current video causes a known error. Check the schedule and the logs to find which video was the problem