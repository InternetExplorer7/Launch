var Promise = require('bluebird');

var expedia = require('../extensions/expedia');

var twitter = require('../extensions/twitter');

var uber = require('../extensions/uber');

var extras = require('../extensions/extras');

var bhttp = require('bhttp');

var userModel = require('../models/user');


exports.expedia = function(api, message){
	Promise.try(function (){
		return message.body.toLowerCase().substring(3); // remove @e and whitespace
	}).then(function (body) { // Check that from/to are found
		console.log(body);
		return extras.wit(body);
	}).then(function (witResponse) {
		var entities = witResponse.outcomes[0].entities;
		var keys = Object.keys(entities).length;
		var dateTime;
		if(entities.datetime){
			dateTime = entities.datetime[0].value.substring(0, entities.datetime[0].value.indexOf("T"));
		} else {
			dateTime = "2016-02-29"
		}
		if(message.body.includes("flight")){
			if(keys >= 2){ // from, to, location (?)
				expedia.getFlights(entities.from[0].entities.airport[0].value.toUpperCase(), entities.to[0].entities.airport[0].value.toUpperCase(), dateTime, api, message); // from, to, message, api
			} else if(keys === 1){
				api.sendMessage("Whoops, make sure to enter both departure and arrival airports.", message.threadID);
			} else {
				api.sendMessage("@e ran into an issue", message.threadID);
			}
		} else if(message.body.toLowerCase().includes("hotel")){
			if(keys === 1){ // Seattle, Baltimore, location...
				expedia.getHotels(entities.location[0].value, api, message);
			} else {
				api.sendMessage("@e ran into an issue, please make sure to give me a location. " + message.threadID);
			}
		} 
	}).catch(function (e){
		console.error(e)
	});
}


exports.uber = function (api, message){
	Promise.try(function (){
		return message.body.toLowerCase().substring(3);
	}).then(function (body){
		return extras.wit(body);
	}).then(function (witResponse){
		var entities = witResponse.outcomes[0].entities;
		var keys = Object.keys(entities).length;
		if(keys === 3){ // contact, from, to
			console.log('contact: ' + JSON.stringify(entities.contact[0]));
			uber.getCor(entities.from[0].entities.location[0].value, entities.to[0].entities.location[0].value, entities.contact[0].value, api, message) // from, to, contact (name), api, message
		} else if(keys < 3){
			api.sendMessage("Whoops, make sure to enter a name, pickup location and destination.", message.threadID);
		} else {
			api.sendMessage("Okay, I have no idea what went wrong. key: " + key, message.threadID);
		}
	}).catch(function (e){
		console.error(e);
	})
}

exports.twitter = function (api, message){
	Promise.try(function (){
		return message.body.toLowerCase().substring(3);
	}).then(function (body){
		console.log(body);
		return extras.wit(body);
	}).then(function (witResponse){
		var entities = witResponse.outcomes[0].entities;
		var keys = Object.keys(entities).length;
		if(keys === 1 && entities.twitter_user){ // Have twitter user in request
			twitter.getLastTweet(entities.twitter_user[0].value, api, message);
		} else if(keys === 2){
			twitter.getTweet(entities.twitter_user[0].value, entities.number[0].value , api, message)
		} else {
			api.sendMessage("Sorry, @t ran into an issue.")
		}
	}).catch(function (e){
		console.error(e);
	})
}