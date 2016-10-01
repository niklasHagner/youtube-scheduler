/* -------------- External -------------- */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');

/* -------------- Internal -------------- */
var routes = require('./routes/index');

/* -------------- App configuration -------------- */
var app = express();
var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

 //YOU MUST MANUALLY SET YOUR APIKEY!
 //Step 1: Get your own unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard
 //Step 2: Set the environemtn variable YOUTUBEAPIKEY = 'yourapikey'

 //HOW TO SET ENV VARIABLES ON UNIX: 
 //Temproary: in the node shell run this command: process.env.YOUTUBEAPIKEY = 'abc123'
 //Permanent: export YOUTUBEAPIKEY = 'abc123'

 //HOW TO SET ENV VARIABLES ON WINDOWS:
 //Temporary :while in the node-shell set the variable with the command command: process.env.youtubeapikey = 'abc123'
 //Permanent: 
 //Use any powershell console (doesn't have to be elevated) with this command
 //[Environment]::SetEnvironmentVariable("YOUTUBEAPIKEY", "abc123", "User")

//You might have to restart your console to use the new env variable

var apiKeyTest = process.env.YOUTUBEAPIKEY;
if (typeof apiKeyTest === "undefined")
    throw new Error("Damnit! process.env.YOUTUBEAPIKEY is not set. the code will not work without it!");

/* -------------- App Engine Handlebars -------------- */
var hbs = exphbs.create({
    helpers: {
        test: function () { return "Lorem ipsum" },
        json: function (value, options) {
            return JSON.stringify(value);
        }
    },
    defaultLayout: 'main',
    partialsDir: ['views/partials/']
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

/* -------------- App Engine Other -------------- */
app.use(favicon(__dirname + '/public/images/favicon.ico'));
if (env === "development")
    app.use(logger('dev')); // log http requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/* -------------- Error handlers -------------- */

// development error handler. will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler. no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});


module.exports = app;