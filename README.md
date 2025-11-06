# Youtube Scheduler
## Broadcast playlists as TV channels
Node server using the youtube data api v3 to schedule videos from playlists and broadcast them as a TV-channels, removing the ability to pause or skip.

<img width="1083" alt="image" src="https://user-images.githubusercontent.com/3415677/209952755-6ece8dd7-effe-48c9-acc1-bf12a1768aaf.png">

## Build and run this project
1. Create a unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard, go to "Enabled APIs and Services" and enable the "Youtube Data API v3". You do not need oAuth. Create a `.env` file in the root of this project with the line `YOUTUBEAPIKEY=your_key`
2. `npm install`
3. `npm run build` - to compile LESS to CSS
4. `node start` to run the node-server
5. browse to `http://localhost:8082`


## Tech

* The node backend uses [Youtube Data API v3](https://developers.google.com/youtube/v3) - it's accessed via a wrapper, basically a modified version of https://github.com/nodenica/youtube-node/blob/master/lib/youtube.js (which had pagination problems at the time this repo was created)
* The frontend uses [Youtube Iframe API](https://developers.google.com/youtube/iframe_api_reference)

There are several quirks to using Youtube programatically.
The idea is that each TV-channel is a youtube-playlist. Quite often some videos in a playlist will be unplayable (due to being deleted or blocked in your country) and the idea is to skip them when this happens. But there's no clear signal from the API when a video is unplayable - so the code in this project detect this in a fuzzy way by checking if the video doesn't start in a timely way, and then try to skip to the next video. The user experience when this happens is far from great...

## Troubleshooting Youtube API backend problems
* Pagination in youtube data api v3 has been a constant source of bugs. Before 2018 when you accessed a playlist you had had to submit an initial pageId set to the playlistId. Since 2018 you shouldn't submit any paginationId for the first page.
* `"Invalid unsigned integer value: 'CAUQAA'."` this error has been caused by youtubeApiWrapper.js mixing up the params `nextPageToken` (string) and `maxPage` (int)
* YoutubeAPI v3 has a common 400-error: 'The request specifies an invalid page token'
* If some videos in the playlist were not found, set `shouldCache=false` and try again

## Troubleshooting Youtube frontend problems
* Browser extensions like AdBlocker or PopupBlocker can preventing youtube's `base.js` script from loading other scripts such as `endscreen.js` and lead to events like `onPlayerReady` and `onStateChange` never firing. Make sure to disable all plugins and test again.
* The video schedule has to be adjusted clientside to account for videos that could be unplayable in the iframe api
* Age-restricted videos cannot be viewed in iframes and will result in the videoPlayer showing "This video is age-restricted and only available on Youtube". They must be manually removed from the playlist
* Some videos are country-restricted

