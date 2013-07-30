steamsink
=========

Steam is a money sink. This program calculates your total spending on Steam.

Prerequisites:

* NodeJS
* jQuery
* An [Open Exchange Rates](https://openexchangerates.org/) account

Do this:

1. Place jquery.js in the steamsink directory
2. Download HTML page at https://store.steampowered.com/account/
3. Create a config.json that points to the downloaded HTML file and includes
your APP ID for Open Exchange Rates:

        { "account_filename": "./account.html",
          "app_id": "secret - do not share!" }

4. Change the currency calculations if you are not interested in SEK output
5. `$ npm install`
6. `$ node steamsink.js`
