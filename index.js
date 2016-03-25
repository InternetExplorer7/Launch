var express = require('express');

var app = express();

var routes = require('./routes/routes');

var bodyParser = require('body-parser');

var login = require('facebook-chat-api');

var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var Promise = require('bluebird');

var mongoose = require('mongoose');

var userModel = require('./models/user');

var extensions = require('./extensions/extras');

mongoose.connect("mongodb://localhost:27017/launch")

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
        extended: false
}));
// parse application/json
app.use(bodyParser.json())


login({
        email: "email",
        password: "pass"
}, function callback(err, api) {
        if (err) return console.error(err);
        api.listen(function callback(err, message) {
                if(message.body.toLowerCase().includes("@e")){ // expedia
                        routes.expedia(api, message);
                } else if(message.body.toLowerCase().includes("@t")){ // twitter
                        routes.twitter(api, message);
                } else if(message.body.toLowerCase().includes("@u")){ // uber
                        routes.uber(api, message);
                } else if(message.body.toLowerCase().includes("@l")){ // lyft

                }
        });
});

app.listen(appEnv.port);