'use strict';
const FileService = require('./files');
const colors = require('colors');

module.exports = new (function() {

    var _self = this;

    /**
     * Given a search term, searches and returns the most valid games
     * @param  {string} system
     * @param  {string} term
     * @param  {number} maximum number of results returned
     * @return {Array}
     */
    this.Search = function(system, term, maximum, callback) {

        maximum = maximum || 20; //return 20 results unless otherwise stated
        term = term || '';
        term = term.replace(/\s+/g,' ').trim().replace(/[^a-zA-Z0-9\s]/gi,''); //sanitize term by trimming, removing invalid characters
        var result = [];
        var words = term.split(' '); //split all search terms
        
        FileService.Get('search.' + system, function(err, cache) {
            if (err) {
                return callback(err);
            }

            console.log(('serch: ' + term).magenta);

            //pass over all titles just once, the object iteration with for in was faster than an array iteration
            for (var data in cache) {

                //this structure is built on app start, see application.js
                var title = cache[data].t;
                var gk = cache[data].gk;
                var rank = cache[data].r;

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
                for (var _j = 0; _j < words.length; ++_j) {

                    var _word = words[_j];
                    var titlewords = title.split(' '); //split title's terms

                    var wholeterm = new RegExp('^' + _word + '(\\s|$)','i');        //word is a whole word at at the beginning of the result
                    var wordinside = new RegExp('\\s' + _word + '(\\s|$)', 'i');     //word is a whole word someplace in the result (space or endstring after word)
                    var beginswith = new RegExp('(^|\\s)' + _word,'i');              //is a partial word at at the beginning of the result or one of the words within
                    var partof     = new RegExp(_word, 'i');                         //word is partial word anyplace in the result

                    var termdepthscore = (words.length - _j) * 10; //word path score gives highest score to first term in entry (most likely what user is searching for)

                    //check each word against possible location in title and give score based on position
                    //continue at each check to prevent same word scoring mutliple times
                    if (title.match(wholeterm)) {
                        searchscore += (300 + termdepthscore); //most points awarded to first word in query
                        //log += _word + '=' + (300 + termdepthscore) + ' wholeterm (' + termdepthscore + '). ';
                        continue;
                    }
                    if (title.match(wordinside)) {
                        
                        var  wordinsidescore = 200;

                        //ok, which whole word inside title? more depth determines score
                        for (var _k = 0; _k < titlewords.length; ++_k) {
                            if (_word.toLowerCase() === titlewords[_k].toLowerCase()) {
                                wordinsidescore -= (10 * _k);
                            }
                        }

                        searchscore += (wordinsidescore + termdepthscore);
                        //log += _word + '=' + (wordinsidescore + termdepthscore) + ' wordinside (' + termdepthscore + '). ';
                        continue;
                    }
                    if (title.match(beginswith) && !title.match(wholeterm)) {
                        
                        var beginswithscore = 150;

                        //ok, which word inside title? more depth lessens score
                        for (var _k = 0; _k < titlewords.length; ++_k) {
                            var match = new RegExp(_word,'i');
                            if (titlewords[_k].match(match)) {
                                beginswithscore -= (10 * _k);
                            }
                        }

                        searchscore += (beginswithscore + termdepthscore);
                        //log += _word + '=' + (beginswithscore + termdepthscore) + ' beginswith (' + termdepthscore + '). ';
                        continue;
                    }
                    if (title.match(partof)) {
                        searchscore += (100 + termdepthscore);
                        //log += _word + '=' + (100 + termdepthscore) + ' partof (' + termdepthscore + '). ';
                        continue;
                    }
                }

                if (searchscore > 0) {

                    //the one's digit is a score based on how many words the title's title is. The fewer, the beter the match given the terms
                    searchscore += (10 - titlewords.length);
                    //log += 'title penalty: ' + (10 - titlewords.length) + '. ';

                    //the decimal places in the score represent the "playability" of the title. This way, titles with (U) and [!] will rank higher than those that are hacks or have brackets
                    searchscore += (rank * 0.1); //between 9.9 and 0.0

                    result.push([gk, searchscore]);
                }
            }

            //sort according to score
            result.sort(function(a, b) {
                if (a[1] > b[1]) {
                    return -1;
                }
                if (a[1] < b[1]) {
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
})();
