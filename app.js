/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path');

var io = require('socket.io-client');
var http = require('http');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var Mongoose = require('mongoose');
var db = Mongoose.connect('mongodb://localhost/test');


var BidSchema = new Mongoose.Schema({
    price : { type : Number },
    amount : { type : Number } }, 
    { capped: { size: 5242880, max: 1000, autoIndexId: true }});


var Bid = db.model('bidSchema', BidSchema);

var bidStream = Bid.find().tailable().stream();

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

var ioserver = require('socket.io').listen(server);
var clientsocket = null;


ioserver.sockets.on('connection', function(socket){
	clientsocket = socket;
	var timeout = null;
	
	bidStream.on('data', function (doc) {	
		clientsocket.emit('bid', doc);
	}).on('error', function (err) {
	  console.log('error: '+err);
	}).on('close', function () {
	  // the stream is closed
	  system.debug('close');
	});
});

app.post('/placebid', function(req, res) {
	var bid = new Bid({
		'price' : parseFloat(req.body.bid.price),
		'amount' : parseFloat(req.body.bid.amount)
	})

	bid.save(function(err){
        if (err) return console.log(err);
            Bid.findById(bid, function (err, doc) {
                if (err) return console.log(err);
                  console.log(doc); // { name: 'mongodb.org', _id: '50341373e894ad16347efe12' }
            	  res.json({
            	  	bid : bid
            	  });
            });
    });

	
});

app.get('/', function(req, res) {
	res.render('index', {
	});
});