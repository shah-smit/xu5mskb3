var config = require('./config');
var Bot = require('node-telegram-bot-api');
var bot;


if(process.env.NODE_ENV === 'production') {
    bot = new Bot(config.TelegramToken);
    bot.setWebHook(config.TelegramProductionURL + bot.token);
}
else {
    bot = new Bot(config.TelegramToken, { polling: true });
}

console.log('secon-bot server started...');

var sheetNumber = "od6";
var url = "https://spreadsheets.google.com/feeds/list/" + config.googleSheetKey + "/" + sheetNumber + "/public/values?alt=json";

bot.onText(/(.+)$/, function (msg, match) {
    var keywords = match[1];
    var request = require("request");
    console.log(msg.chat.first_name + " " + msg.chat.last_name + " searched for " + keywords)

    request(url, function (error, response, body) {

        var parsed = JSON.parse(body);
        var formattedAnswer = "";


        var itemsFound = 0;
        // sending answers
        parsed.feed.entry.forEach(function (item) {

            var itemTitle = item.title.$t
            if (
                (itemTitle.toLowerCase().trim() == keywords.toLowerCase().trim())
            ) {
                // add the line break if not the first answer

                if (itemsFound == 0)
                    formattedAnswer += keywords.toUpperCase().trim() + " REQUESTED:\n\n";
                else
                    formattedAnswer += "\n\n";

                itemsFound++;
                formattedAnswer += '\u27a1' + item.content.$t; // add item content, '\u27a1' is the arrow emoji
            }

        });
        if (itemsFound != 0) {
            formattedAnswer += "\n\n" + itemsFound + " entries found. \n\n";
            bot.sendMessage(msg.chat.id, formattedAnswer).then(function () {
            });

        };
        if (itemsFound == 0) {

            var apiai = require('apiai');
            var app = apiai("c8db7e0325784b189f343bb5b571c3d9");

            var request = app.textRequest(keywords, {
                sessionId: '<unique session id>'
            });

            request.on('response', function (response) {
                console.log(response);
                var speech = JSON.stringify(response.result.fulfillment.speech);
                speech = speech.substring(1,speech.length-1);
                speech = speech.split(';').join('\n');

                formattedAnswer = speech;
                bot.sendMessage(msg.chat.id, formattedAnswer).then(function () {
                    // reply sent!
                });
            });

            request.on('error', function (error) {
                console.log(error);
            });
            request.end();
        }
    });
});

module.exports = bot;

