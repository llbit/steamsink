var http = require('http');
var fs = require('fs');
var jsdom = require('jsdom');
var jquery = fs.readFileSync('./jquery-2.0.3.min.js', 'utf-8');

var account_filename = './account.html';// save https://store.steampowered.com/account/ as account.html
var app_id = '###';// Open Exchange Rates API ID - don't share this!

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
	var filename = './'+datestring(date)+'.json';
	var url = 'http://openexchangerates.org/api/historical/'+datestring(date)+'.json?app_id='+app_id;
	function done() {
		json = fs.readFileSync(filename, 'utf-8');
		callback(JSON.parse(json));
	}
	try {
		done();
	} catch (e) {
		//console.log('downloading ' + url);
		var file = fs.createWriteStream(filename);
		var request = http.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
				done();
			});
		}).on('error', function(e) {
			console.log("http error: " + e.message);
		});
	}
}

var sum = 0;

function addPrice(title, date, price) {
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
			sum += sek;
		});
	}
}

fs.readFile(account_filename, function (err, html) {
	if (err) {
		throw err;
	}
	jsdom.env({
		html: html,
		encoding: 'binary',
		src: [jquery],
		done: function (errors, window) {
			var $ = window.jQuery;
			fs.writeFile('errors.log', errors);
			var dates = window.$('#store_transactions .transactionRowDate');
			dates.each(function (index) {
				if (!$(this).parent().hasClass('transactionLegend')) {
					var date = $(this).text();
					var price = $(this).parent().children('.transactionRowPrice').text();
					var title = $(this).parent().find('.transactionRowTitle').text();
					addPrice(title, new Date(date), price);
				}
			});
			// done
			console.log('sum = ' + sum + ' SEK');
		}
	});
});
