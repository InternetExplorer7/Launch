var Promise = require('bluebird');

var bhttp = require('bhttp');
var fs = require('fs');

exports.getFlights = function (from, to, date ,api, message){
	console.log('from: ' + from + ' to: ' + to + ' messageBody: ' + message.body + ' date: ' + date);
	var price, legId, fromCity, toCity;
	Promise.try(function (){
		return bhttp.get('http://terminal2.expedia.com/x/mflights/search?departureAirport=' + from + '&arrivalAirport=' + to + '&departureDate=' + date + '&apikey=');
	}).then(function (res){
		if(res){
		price = res.body.offers[0].totalFarePrice.formattedWholePrice;
		legId = res.body.offers[0].legIds[0];
		return res.body.legs  
		} else {
			api.sendMessage("Whoops, ran into an error. Please make sure to enter airport names.")
		}
	}).filter(function (leg){
		if(leg.legId === legId){
			return true;
		} else {
			return false;
		}
	}).then(function (finalFlight){
		console.log('fflight: ' + JSON.stringify(finalFlight[0].segments));
		finalFlight = finalFlight[0].segments;
		if(finalFlight){ // Check to make sure data is valid. (not null/undefined)
			var intro = "I found the best deal for a flight that goes from " + from + " to " + to + ".\n\nThis flight costs each person about " + price + ".\nHere's what your trip would look like:\n\n\n";
			if(finalFlight.length === 1){
				fromCity = finalFlight[0].arrivalAirportLocation;
				toCity = finalFlight[0].departureAirportLocation;
				intro = intro.concat("This flight will be direct, no connections. " + finalFlight[0].airlineName + " ( " + finalFlight[0].airlineCode + " -- " + finalFlight[0].flightNumber + " ) \n\n\n");
				intro = intro.concat("You will be departing " + finalFlight[0].departureAirportLocation + " ( " + finalFlight[0].departureAirportCode + " ) at " + finalFlight[0].departureTime + ". You will arrive in " + finalFlight[0].arrivalAirportLocation + " ( " + finalFlight[0].arrivalAirportCode + " ) on " + finalFlight[0].arrivalTime);
			} else if(finalFlight.length > 1){ // multiple legs
				finalFlight.forEach(function (leg, index){
					console.log(index);
					if(index === 0){
						fromCity = leg.departureAirportLocation;
						intro = intro.concat("This flight will have " + finalFlight.length + " connections. \n\n\n");
						intro = intro.concat(index + ". You will be departing " + leg.departureAirportLocation + " ( " + leg.departureAirportCode + " ) on " + leg.departureTime + ". You will arrive in " + leg.arrivalAirportLocation + " ( " + leg.arrivalAirportCode + " ) on " + leg.arrivalTime + "\n\n\n");
					} else if(index === finalFlight.length - 1){ // Last item
						toCity = leg.arrivalAirportLocation;
						intro = intro.concat(index + ". Finally, will be departing " + leg.departureAirportLocation + " ( " + leg.departureAirportCode + " ) on " + leg.departureTime + ". You will arrive in " + leg.arrivalAirportLocation + " ( " + leg.arrivalAirportCode + " ) on " + leg.arrivalTime + "\n\n\n");
					} else { // Probably somewhere inbetween
						console.log('called 3');
						intro = intro.concat(index + ". Next, you will be departing " + leg.departureAirportLocation + " ( " + leg.departureAirportCode + " ) on " + leg.departureTime + ". You will arrive in " + leg.arrivalAirportLocation + " ( " + leg.arrivalAirportCode + " ) on " + leg.arrivalTime + "\n\n\n");
					}
				});
			}
			return intro;
		} else {
			return "Oops, something went wrong!"
		}
	}).then(function (txt){
		txt = txt.concat("To book, call Expedia at +1 (800) 397-3342")
		api.sendMessage(txt, message.threadID);
	})
}

function hotelUrgency(hotel){
	console.log('hotel: ' + hotel.HotelID);
	var a;
	bhttp.get("http://terminal2.expedia.com/x/trends/hotels/viewcount?hotelIds=" + hotel.HotelID + "&duration=30m&apikey=", {}, function (err, response){
		console.log(JSON.stringify(response.body.productResponseList.productData[0].count));
		a = response.body.productResponseList.productData[0].count;
	});
	return a;
}

exports.getHotels = function (location, api, message){
	var HotelIDs = [];
	var hotelNames = [];
	Promise.try(function (){
		return bhttp.get('http://terminal2.expedia.com/x/suggestions/regions?query=' + location + '&apikey=');
	}).then(function (regionObj){
		return regionObj.body.sr[0].id;
	}).then(function (rid){
		return bhttp.get('http://terminal2.expedia.com/x/hotels?regionids=' + rid + '&dates=2016-03-01,2016-03-02&maxhotels=4&adults=1&apikey=');
	}).then(function (hotelObj){
		// console.log(JSON.stringify(hotelObj.body.HotelInfoList.HotelInfo));
		return hotelObj.body.HotelInfoList.HotelInfo; // array
	}).filter(function (hotel){
		if(hotel.Price){
			return true;
		} else {
			return false;
		}
	}).each(function (hotel){
		HotelIDs.push(hotel.HotelID);
		hotelNames.push(hotel.Name);
		api.sendMessage(hotel.Name + ": " + hotel.Description + "\n\nIt is located at " + hotel.Location.StreetAddress + ", " + hotel.Location.City + ", " + hotel.Location.Province + ".\n\n\nThis hotel has a high guest rating of " + hotel.GuestRating + " with a total of " + hotel.GuestReviewCount + " guest reviews.\n\nYou would be getting a " + hotel.RoomTypeList.RoomType.Description + ", which will cost $" + hotel.RoomTypeList.RoomType.Price.BaseRate.Value + " per night.\n\n\n", message.threadID);
	}).then(function (){
		return bhttp.get("http://terminal2.expedia.com/x/trends/hotels/viewcount?hotelIds=" + HotelIDs.toString() + "&duration=30m&apikey=");
	}).then(function (response){
		 return response.body.productResponseList.productData;
	}).each(function (hotelCount, i){
		if(hotelCount.count > 0){
			api.sendMessage(hotelNames[i] + " was booked by " + hotelCount.count + " people in the last 30 minutes.", message.threadID)
		}
	}).then(function (){
		api.sendMessage("To book, call Expedia at +1 (800) 397-3342 and use code JFKD-AAD", message.threadID);
	}).catch(function (e){
		console.error(e);
	});
}