# Youtube Sheduler
## Broadcast playlists as TV channels
I miss the days of sitting in front of the TV and watching whatever was on.

This is a node service that lets you enter some youtube playlists and broadcast them as a TV-channel. 
A simple overlay prevents the user from interacting with the player, to get the oldschool experience.

## Tech
+ backend: node, express
+ frontend: handlebars, jquery
+ uses youtubeApiV3

## Pre-requisites
Step 1: Get your own unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard

Step 2: You gotta your apiKey.
Easy way: change the line `var apiKey = process.env.YOUTUBEAPIKEY` to `var apiKey = "mykeyhere"`
Hard way: Set the environemnt variable `YOUTUBEAPIKEY` to your apiKey value.

### How to set env vars on Unix: 
Set it Permanently: `export YOUTUBEAPIKEY = 'abc123'` 
...or just set it for one session: in the node shell run this command: `process.env.YOUTUBEAPIKEY = 'abc123'`

### How to set env vars on Windows:
Set it temporarily:
while in the node-shell set the variable with the command command: `process.env.youtubeapikey = 'abc123'`
 
..or Set it permanently:
From Powershell:
 `[Environment]::SetEnvironmentVariable("YOUTUBEAPIKEY", "abc123", "User")`
You might have to restart your console to use the new env variable in node

## Build
1. `grunt` or `grunt && grunt watch` in the root directory
2. browse to `http://localhost:3000` 
