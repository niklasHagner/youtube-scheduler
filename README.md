# Youtube Scheduler
## Broadcast playlists as TV channels
I miss the days of sitting in front of the TV and watching whatever was on.

This is a node service that lets you enter some youtube playlists and broadcast them as a TV-channel.
A simple overlay prevents the user from interacting with the player, to get the oldschool experience.

![screenshot](http://i.imgur.com/220jd5k.jpg)

## How to build and run this project
1. ensure you've set the environment variable YOUTUBEAPIKEY, see the Pre-requsities section
2. `npm install`
3. `npm run build` - to compile LESS to CSS
4. `node start` to run the node-server
5. browse to `http://localhost:3000`


## Troubleshooting common issues
* the youtube player functions `onPlayerReady` and `onStateChange` never fire => check devtools, it's likely that youtube-scripts are blocked. (One of the common AdBlock plugins usually blocks two scripts required by the youtubePlayer)
* node cannot access the `env.process.YOUTUBEAPIKEY` => you need to check the Prerequisities section again
* some videos in the playlist were not found => set the `shouldCache` to false and try again
* some video are not played => this can be a result of the clientside `onError` method which skips to the next video if the current video causes a known error. Check the schedule and the logs to find which video was the problem
* `"Invalid unsigned integer value: 'CAUQAA'."` the node-youtube-api has some bugs regarding mixups of params `nextPageToken` (string) and `maxPage` (int)

## Pre-requisites
Step 1: You NEED to get your own unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard
cause every time you call the youtubeAPI that key has to be provided.

Step 2: Make node use that apiKey
* Set the environemnt variable `YOUTUBEAPIKEY` to your apiKey value.
* Or if you are really lazy and hate env vars, you can just remove the line `var apiKey = process.env.YOUTUBEAPIKEY` and replace it with `var apiKey="abc123"`

### How to set env vars on Linux/Unix:
* Set it in an `.env` file containing `YOUTUBEAPIKEY=abc123`
* OR set it Permanently in a bash terminal: `export YOUTUBEAPIKEY='abc123'`
* OR set it for current session only: in the node shell run this command: `process.env.YOUTUBEAPIKEY = 'abc123'`

### How to set env vars on Windows:
* Set it in an `.env` file containing `YOUTUBEAPIKEY=abc123`
* OR, set it permanently:
  * From Powershell:
 `[Environment]::SetEnvironmentVariable("YOUTUBEAPIKEY", "abc123", "User")`
  * You might have to restart your console to use the new env variable in node

* Set it temporarily:
  * while in the node-shell set the variable with the command command: `process.env.youtubeapikey = 'abc123'`
