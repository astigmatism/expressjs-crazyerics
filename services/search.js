var fs = require('fs');
var async = require('async');
var config = require('config');
var FileService = require('./fileservice.js');

/**
 * Constructor
 */
SearchService = function() {
};

/**
 * Given a search term, searches and returns the most valid games
 * @param  {string} system
 * @param  {string} term
 * @param  {number} maximum number of results returned
 * @return {Array}
 */
SearchService.search = function(systemfilter, term, maximum, callback) {

    maximum = maximum || 20; //return 20 results unless otherwise stated
    term = term || '';
    term = term.replace(/\s+/g,' ').trim().replace(/[^a-zA-Z0-9\s]/gi,''); //sanitize term by trimming, removing invalid characters
    var result = [];
    var i;
    var system;
    var file;
    var rank;
    var words = term.split(' '); //split all search terms

    FileService.getFile('/data/' + systemfilter + '_master', function(err, data) {
        if (err) {
            return callback(err);
        }

        //pass over all titles just once
        for (title in data) {

            //var log = ''; //for debugging scores of results. please include in result

            //edge case for "all" searches - the file is in a different format
            if (systemfilter === 'all') {
                system = data[title].system;
                file = data[title].file;
                rank = data[title].rank;
                //we append the system name to the title name for unique enries (ie "Sonic the Hedgehog" exists twice and we can't use it as a key without its system name)
                title = title.replace(new RegExp('\.' + system + '$', 'gi'),'');
            
            } else {
                system = systemfilter;
                file = data[title].b;
                rank = data[title].f[file];
            }

            /**
             * search scoring
             * hundreds digit: the strength of the regex scoring
             * tens digit: the order of the search query words (first is more relevant)
             * ones digit: the length of the title's title. a smaller title more closely matches the search making it more revelant
             * precision: the playability score of the title. this elevates titles that are (U) and [!] over ones that are hacks etc.
             */
            //the higher the search score, the more likely it is to show at the top of the auto complete list
            var searchscore = 0;

            //pass over all search terms
            for (i = 0; i < words.length; ++i) {

                var titlewords = title.split(' '); //split title's terms

                var wholeterm = new RegExp('^' + words[i] + '(\\s|$)','i');        //word is a whole word at at the beginning of the result
                var wordinside = new RegExp('\\s' + words[i] + '(\\s|$)', 'i');     //word is a whole word someplace in the result (space or endstring after word)
                var beginswith = new RegExp('(^|\\s)' + words[i],'i');              //is a partial word at at the beginning of the result or one of the words within
                var partof     = new RegExp(words[i], 'i');                         //word is partial word anyplace in the result

                var termdepthscore = (words.length - i) * 10; //word path score gives highest score to first term in entry (most likely what user is searching for)

                //check each word against possible location in title and give score based on position
                //continue at each check to prevent same word scoring mutliple times
                if (title.match(wholeterm)) {
                    searchscore += (300 + termdepthscore); //most points awarded to first word in query
                    //log += words[i] + '=' + (300 + termdepthscore) + ' wholeterm (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(wordinside)) {
                    
                    var  wordinsidescore = 200;

                    //ok, which whole word inside title? more depth determines score
                    for (var j = 0; j < titlewords.length; ++j) {
                        if (words[i].toLowerCase() === titlewords[j].toLowerCase()) {
                            wordinsidescore -= (10 * j);
                        }
                    }

                    searchscore += (wordinsidescore + termdepthscore);
                    //log += words[i] + '=' + (wordinsidescore + termdepthscore) + ' wordinside (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(beginswith) && !title.match(wholeterm)) {
                    
                    var beginswithscore = 150;

                    //ok, which word inside title? more depth lessens score
                    for (var j = 0; j < titlewords.length; ++j) {
                        var match = new RegExp(words[i],'i');
                        if (titlewords[j].match(match)) {
                            beginswithscore -= (10 * j);
                        }
                    }

                    searchscore += (beginswithscore + termdepthscore);
                    //log += words[i] + '=' + (beginswithscore + termdepthscore) + ' beginswith (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(partof)) {
                    searchscore += (100 + termdepthscore);
                    //log += words[i] + '=' + (100 + termdepthscore) + ' partof (' + termdepthscore + '). ';
                    continue;
                }
            }

            if (searchscore > 0) {

                //the one's digit is a score based on how many words the title's title is. The fewer, the beter the match given the terms
                searchscore += (10 - titlewords.length);
                //log += 'title penalty: ' + (10 - titlewords.length) + '. ';

                //the decimal places in the score represent the "playability" of the title. This way, titles with (U) and [!] will rank higher than those that are hacks or have brackets
                searchscore += (rank * 0.1); //between 9.9 and 0.0

                result.push([title, file, system, searchscore]);
            }
        }

        //sort according to score
        result.sort(function(a, b) {
            if (a[3] > b[3]) {
                return -1;
            }
            if (a[3] < b[3]) {
                return 1;
            }
            return 0;
        });

        //if over max, splice out
        if (result.length > maximum) {
            result.splice(maximum, result.length - 1);
        }

        return callback(null, result);
    });

    
};

module.exports = SearchService;
