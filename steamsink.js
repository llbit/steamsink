var http = require('http');
var fs = require('fs');
var jsdom = require('jsdom');
var config = require('./config.json');

if (!fs.existsSync('./historical')) {
	fs.mkdirSync('./historical');
}

function datestring(date) {
	function pad (str) {
		if (str.length < 2) {
			return '0' + str;
		}
		return str;
	}
	var year = date.getUTCFullYear().toString();
	var month = pad((1 + date.getUTCMonth()).toString());
	var day = pad(date.getUTCDate().toString());
	return year+'-'+month+'-'+day;
}

function getXchg(date, callback) {
	var filename = './historical/'+datestring(date)+'.json';
	function done() {
		json = fs.readFileSync(filename, 'utf-8');
		callback(JSON.parse(json));
	}
	try {
		done();
	} catch (e) {
		//console.log('downloading ' + url);
		var url = 'http://openexchangerates.org/api/historical/'+datestring(date)+'.json?app_id='+config.app_id;
		var file = fs.createWriteStream(filename);
		file.on('finish', function() {
			file.close();
			done();
		});
		// TODO could create multiple asynchronous requests here, should only spawn one request per date
		var request = http.get(url, function(response) {
			response.pipe(file);
		}).on('error', function(e) {
			console.log('http error: ' + e.message);
			process.exit(1);
		});
	}
}

var sum = 0;

function addPrice(title, date, price, sum) {
	var currency = '???';
	var val = price;
	if (price.indexOf('$') !== -1) {
		currency = 'USD';
		val = price.substring(price.indexOf('$')+1);
	} else if (price.indexOf('\u20ac') !== -1) {
		currency = 'EUR';
		val = price.substring(0, price.indexOf('\u20ac'));
	}
	val = parseFloat(val.replace(/-/g, '0'));
	if (!isNaN(val)) {
		getXchg(date, function (xchg) {
			var rate = xchg.rates['SEK'] / xchg.rates[currency];
			var sek = val * rate;

			console.log(datestring(date));
			console.log(title);
			console.log(val + ' ' + currency + ' = ' + sek + ' SEK');
			console.log();
			sum(sek);
		});
	}
}

function readTransactions() {
	fs.readFile(config.account_filename, function (err, html) {
		if (err) {
			throw err;
		}
		var jquery = fs.readFileSync('./jquery.js', 'utf-8');
		jsdom.env({
			html: html,
			encoding: 'binary',
			src: [jquery],
			done: function (errors, window) {
				var $ = window.jQuery;
				var rows = $('#store_transactions .transactionRow');
				var numrows = rows.length;
				rows.each(function (index) {
					var event = $(this).children('.transactionRowEvent').text();
					if (event == 'Purchase') {
						var date = $(this).children('.transactionRowDate').text();
						var price = $(this).children('.transactionRowPrice').text();
						var title = $(this).find('.transactionRowTitle').text();
						addPrice(title, new Date(date), price, function (sek) {
							sum += sek;
							if ((index + 1) === numrows) {
								console.log('sum = ' + sum + ' SEK');
							}
						});
					}
				});
			}
		});
	});
}

if (!fs.existsSync('./jquery.js')) {
	console.log('downloading jquery.js');
	var file = fs.createWriteStream('./jquery.js');
	file.on('finish', function() {
		file.close();
		readTransactions();
	});
	var request = http.get('http://code.jquery.com/jquery.js', function(response) {
		response.pipe(file);
	}).on('error', function(e) {
		console.log('http error: ' + e.message);
		process.exit(1);
	});
} else {
	readTransactions();
}


