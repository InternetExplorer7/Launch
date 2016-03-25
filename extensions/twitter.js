
var Twit = require('twit');

var T = new Twit({
  consumer_key:         '',
  consumer_secret:      '',
  access_token:         '',
  access_token_secret:  '',
})

var Promise = require('bluebird');

exports.getTweet = function (twitter_user, number, api, message){
	T.get('search/tweets', {q: twitter_user, count: 100}).then(function (result){
		api.sendMessage(result.data.statuses[number].text.substring(0, result.data.statuses[number].text.indexOf("https")), message.threadID);
	});
}

exports.getLastTweet = function(twitter_user, api, message){
	T.get('search/tweets', {q: twitter_user, count: 5}).then(function (result){
		// console.log(JSON.stringify(result));
		var tweet = result.data.statuses[0].text;
		tweet = tweet.substring(0, tweet.indexOf("https"));
		api.sendMessage(tweet, message.threadID);
	});
}