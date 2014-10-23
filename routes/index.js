var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var geoip = require('geoip-lite');
var superagent = require('superagent');
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter);

var weatherApi = process.env.WUNDERGROUND || 'bcd80ed63443d581';
var uristring = process.env.MONGOLAB_URI || 'mongodb://heroku_app30267121:fkogs2hsmp6lgjjjks8r8ullb8@ds043170.mongolab.com:43170/heroku_app30267121';

var moment = require('moment');

module.exports = router;

/* GET home page. */
router.get('/', function(req, res) {

	var geo = geoip.lookup(req.ip);
	if (geo == null){geo = geoip.lookup('203.206.140.39');}
	geocoder.reverse(geo.ll[0], geo.ll[1], function(err, geores) {

		var country = geores[0].country;
		var city = geo.city;
		
		getWeatherData(country, city, res);
	});
});

/* GET Melourne page. */
router.get('/melbourne', function(req, res) {

	MongoClient.connect(uristring, function (err, db) {
		if (err) throw err;
		var cursor = db.collection('melbourneWeatherData');	

		// Since there is only 5 doc in the database skip the first 4 to get to the last
		cursor.find().skip(4).nextObject(function (err, doc) {
			db.close();
			res.render('index', doc);

		});	
	});

});

 /* GET City . */
router.get('/:country/:city', function(req, res) {
	var country = req.params.country;
	var city = req.params.city;

	getWeatherData(country, city, res);
});



function getWeatherData(country, city, res) {
	var weatherURL = 'http://api.wunderground.com/api/'+weatherApi+'/conditions/q/'+country+'/'+city+'.json';
	var astronomyURL = 'http://api.wunderground.com/api/'+weatherApi+'/astronomy/q/'+country+'/'+city+'.json';

	/* First Request to check sunrise and sunset hours */
	superagent.get(astronomyURL, function(response){

		var data = JSON.parse(response.text);
		var sunrise;
		var sundown;

		if (!data.hasOwnProperty('sun_phase')) {
			sunrise = 6;
			sundown = 20;
		} else {
			sunrise = data.sun_phase.sunrise.hour;
		    sundown = data.sun_phase.sunset.hour;
		}
		
	
		/* SEcond Request to weather*/
	  	superagent.get(weatherURL, function(response){

	  		var data = JSON.parse(response.text);
		console.log(data);

	  		/* Error handing */
	  		if (!data.hasOwnProperty('current_observation')) {
	  			res.render('chooseLocation');
	  			return;
	  		}

	  		var str = data.current_observation.local_time_rfc822.toString();
	  		/* Get Current Time */
	  		var h = moment(str, 'ddd, DD MMM YYYY HH:mm:ss').get('hour');

	  		/* Compare time against sunset and hours and prefix icon */
	  		if (h < sunrise.toString() || h > sundown.toString()){
	  			var prevVal = data.current_observation.icon;
	  			data.current_observation.icon = 'nt_' + prevVal;

	  			res.render('index', data);
			} else {

	  			res.render('index', JSON.parse(response.text));
			}
		});
	});
}