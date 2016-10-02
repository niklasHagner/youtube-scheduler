# Youtube Scheduler
## Broadcast playlists as TV channels
I miss the days of sitting in front of the TV and watching whatever was on.

This is a node service that lets you enter some youtube playlists and broadcast them as a TV-channel. 
A simple overlay prevents the user from interacting with the player, to get the oldschool experience.

![screenshot](http://i.imgur.com/220jd5k.jpg)

## How to build and run this project
1. `npm install`
2. `grunt` or `grunt && grunt watch` in the root directory (or just `node start`)
3. browse to `http://localhost:3000` 
4. you MUST check the Pre-requisites section on how to set YOUTUBEAPIKEY

 
## Troubleshooting common issues
* node cannot access the `env.process.YOUTUBEAPIKEY` => you need to check the Prerequisities section again
* some videos in the playlist were not found => set the `shouldCache` to false and try again
* some video are not played => this can be a result of the clientside `onError` method which skips to the next video if the current video causes a known error. Check the schedule and the logs to find which video was the problem


## Pre-requisites
Step 1: You NEED to get your own unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard
cause every time you call the youtubeAPI that key has to be provided.

Step 2: Make node use that apiKey
* Quick way: change the line `var apiKey = process.env.YOUTUBEAPIKEY` to `var apiKey = "mykeyhere"`
* A better way: Set the environemnt variable `YOUTUBEAPIKEY` to your apiKey value.

### How to set env vars on Unix: 
* Set it Permanently: `export YOUTUBEAPIKEY = 'abc123'` 
* ...or set it for current session only: in the node shell run this command: `process.env.YOUTUBEAPIKEY = 'abc123'`

### How to set env vars on Windows:
* Set it permanently:
  * From Powershell:
 `[Environment]::SetEnvironmentVariable("YOUTUBEAPIKEY", "abc123", "User")`
  * You might have to restart your console to use the new env variable in node
  
* Set it temporarily:
  * while in the node-shell set the variable with the command command: `process.env.youtubeapikey = 'abc123'`

## To do
* Hide youtube controls and overlays  [x]
* Remove youtube videos which cannot be played due to region-locks or content policies
* Handle timezones
* Turn shorter playlists into a looping schedule [x]
* Replace Handlebars with something better
* Store data using something more than in-app-memmory
