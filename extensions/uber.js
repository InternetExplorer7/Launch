var Promise = require('bluebird');
var bhttp = require('bhttp');

var locations = {
	senderID: '',
	pickup : {
		lat: '',
		lng: ''
	},

	dropoff : {
		lat: '',
		lng: ''
	}
}
exports.getCor = function (from, to, contact, api, message){
	console.log('to: ' + to + ' from: ' + from);
	return bhttp.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + from.replace(/\s+/g, "+") + '&key=+').then(function (response){
		locations.pickup.lat = response.body.results[0].geometry.location.lat;
		locations.pickup.lng = response.body.results[0].geometry.location.lng;
		return to.replace(/\s+/g,"+");
	}).then(function(formattedTo){
		return bhttp.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + formattedTo + '&key=+');
	}).then(function (dropoffResponse){
		locations.dropoff.lat = dropoffResponse.body.results[0].geometry.location.lat;
		locations.dropoff.lng = dropoffResponse.body.results[0].geometry.location.lng;
		console.log('locations: ' + JSON.stringify(locations))
		getUserFromGroup(api, message, contact);
		getPriceEstimate(api, message);
		//getTimeEstimates(from, api, message);
	});
}


function getUserFromGroup(api, message, contact){
	Promise.try(function (){
		return message.participantNames
	}).map(function(name, index){ // Not filter, get index.
		if(name.trim().toLowerCase() === contact){
			return index;
		} else {
			return -1;
			console.log('name: ' + name);
			console.log('contact: ' + contact);
		}
	}).filter(function(i){
		if(i > -1){
			return true;
		} else {
			return false;
		}
	}).then(function (i){
		locations.senderID = message.participantIDs[i];
	});
}

// function getTimeEstimates(from, api, message){
// 	// var ride = [{
// 	// 	car: "",
// 	// 	estimate: "",
// 	// 	price: ""
// 	// }]
// 	// ride = ride.filter(function (a){
// 	// 	return false;
// 	// })
// 	var txt = "Okay, here are your uber options.\n\n\n";
// 	return bhttp.get("https://api.uber.com/v1/estimates/time?start_latitude=" + locations.pickup.lat + "&start_longitude=" + locations.pickup.lng + "&server_token=+").then(function (uberResponse){
// 		return uberResponse.body.times;
// 	}).each(function (car, index){
// 		// ride.push({car: car.display_name, estimate: (car.estimate / 60)});
// 		txt += (index + ". " + "A " + car.display_name + " can pick you up in " + (car.estimate / 60) + " minutes \n\n");
// 	}).then(function(){
// 		api.sendMessage(txt, locations.senderID);
// 	})
// }

function getPriceEstimate(api, message){
	var txt = "Okay, here are your uber options.\n\n\n";
	return bhttp.get("https://api.uber.com/v1/estimates/price?start_latitude=" + locations.pickup.lat + "&start_longitude=" + locations.pickup.lng + "&end_latitude=" + locations.dropoff.lat + "&end_longitude=" + locations.dropoff.lng + "&server_token=+").then(function (uberResponse){
		return uberResponse.body.prices;
	}).each(function (car, i){
		console.log('car name: ' + car.localized_display_name + " cost: " + car.estimate + " your ride: " + car.distance + " and $: " + (car.duration / 60));
		txt += (i + ". " + "A " + car.localized_display_name + " would approximately cost " + car.estimate + ". Your ride would be about " + car.distance + " miles and will take about " + (car.duration / 60) + " minutes to reach your destination.\n\n\n")
	}).then(function(){
		api.sendMessage(txt,locations.senderID);
	});
}