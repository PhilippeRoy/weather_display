var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var geoip = require('geoip-lite');
var superagent = require('superagent');
var geocoderProvider = 'google';
var httpAdapter = 'http';
var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter);

var weatherApi = process.env.WUNDERGROUND;
var uristring = process.env.MONGOLAB_URI;

/* GET home page. */
router.get('/', function(req, res) {
	var geo = geoip.lookup(req.ip);
	console.log(req.connection.remoteAddress);
	console.log(req.ip);
	if (geo == null){geo = geoip.lookup('203.206.140.39');}
	geocoder.reverse(geo.ll[0], geo.ll[1], function(err, geores) {

		var url = 'http://api.wunderground.com/api/'+weatherApi+'/conditions/q/'+geores[0].country+'/'+geo.city+'.json';

		superagent.get(url, function(response){
		  res.render('index', JSON.parse(response.text));
		});
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


module.exports = router;
 