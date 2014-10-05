var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

var uristring = process.env.MONGOLAB_URI;



/* GET home page. */
router.get('/', function(req, res) {

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
