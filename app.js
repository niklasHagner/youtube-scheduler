var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
const config = require("exp-config");

var routes = require('./routes/index');

/* -------------- App configuration -------------- */
var app = express();
var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

//YOU MUST MANUALLY SET YOUR APIKEY!
//Step 1: Get your own unique apikey (a 39 character string) by creating a new project on https://console.developers.google.com/apis/credentials/wizard
//Step 2: Set the env var YOUTUBEAPIKEY = 'yourapikey'
//You might have to restart your console to use the new env variable

var apiKeyTest = process.env.YOUTUBEAPIKEY || config.YOUTUBEAPIKEY;
if (typeof apiKeyTest === "undefined")
    throw new Error("You forgot to set process.env.YOUTUBEAPIKEY. Create an env var for it");

/* -------------- App Engine Handlebars -------------- */
var hbs = exphbs.create({
    helpers: {
        jsonStringify: function (value) { return JSON.stringify(value); },
        getEnvVar: function(key) {
          return process.env[key] || config[key];
        },
        concat: function() {
          let result = "";
          for(var i in arguments) {
            result += (typeof arguments[i] === "string" ? arguments[i] : "") + " ";
          }
          return result;
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

//place logger above `app.use(express.static)` to use httplogging
if (env === "development")
    app.use(logger('dev')); // 'dev' = log http requests

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

var portFallback = 8082;
var port = process.env.PORT || portFallback;
app.listen(port, function () {
  console.log('Express server listening on port ' + port);
});


module.exports = app;