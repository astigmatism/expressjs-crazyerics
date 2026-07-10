'use strict';
const async = require('async');
const config = require('config');
const fs = require('fs');
const path = require('path');
const FileService = require('./files');
const SystemsSQL = require('../db/systems');
const UtilitiesService = require('./utilities');
const UserService = require('./users');
const CollectionService = require('./collections');
const PreferencesService = require('./preferences');
const SuggestionService = require('./suggestions');
const GamesService = require('./games');
const FeaturedService = require('./featured');
const SiteStatisticCollectionsService = require('./site-statistic-collections');
const CronService = require('./cron');
const TitleBannerService = require('./titlebanners');
const ShaderService = require('./shaders');
const MasterInventoryService = require('./master-inventory');

module.exports = new (function() {

    this._genreNames; //a private var for this object during the prep of application starting

    this.ApplicationEntry = function(req, callback) {

        if (req.session) {

            BuildComponentDataForEntry(req, (err, componentdata) => {
                if (err) { return callback(err); }

                BuildConfigForEntry((err, config) => {
                    if (err) { return callback(err); }

                    var result = {
                        config: config,
                        components: componentdata
                    };

                    return callback(null, result);

                });
            });
        }
        else {
            return callback('session not on request object');
        }
    };

    /**
     * This runs on application start. The goal here is to mainly cache freqently accessed data.
     */
    this.ApplicationStart = function(callback) {
        
        //warm the titlebanner filename list cache from the local image directory
        TitleBannerService.ApplicationStart(function(err) {
            if (err) console.log('titlebanner: startup cache warm failed', err);
        });

        //put into cache all the data files
        var systems = config.get('systems');

        var all_search = [];
        var all_suggestions_top = [];
        var all_suggestions_above = [];
        var total_titles = 0;

        var all_genres = {};
        var all_years = {};
        var masterInventorySources = {};

        //operations for each system
        async.each(Object.keys(systems), function(system, nextsystem) {

            if (config.has('systems.' + system + '.live') && !config.get('systems.' + system + '.live')) {
                console.log(system + ' is not live, skipping caching');
                return nextsystem();
            }

            //create features sets for this system
            //at some point during the hour, refresh the most played games feature for each system
            // CronService.RandomEveryHour(() => {
            //     FeaturedService.CreateMostPlayed(system, 6, 18, (err) => {
            //         if (err) console.log('Cron failed for CreateMostPlayed, system ' + system);
            //     });
            // }, true);

            //ok, lets open the data file (and also cache it)
            FileService.Get('/data/' + system + '_master', function(err, masterfile) {
                if (err) {
                    console.log('Could not find masterfile for ' + system + '.');
                    return nextsystem();
                }

                //best place for sql table insert check
                SystemsSQL.Exists(system, config.get('systems.' + system + '.name'), (err) => {
                    if (err) {
                        return callback(err);
                    }

                    //audit for metadata from the server (saved to file and cached)
                    FileService.Request(config.paths.audit + '/metadata/launchbox/' + system, (status, err, metadata) => {
                        if (err) metadata = {};

                        //callback includes categories for "all" suggestions and search
                        SuggestionService.CreateSystemSuggestions(system, masterfile, metadata, (err, search, top, above, genres, years, total, boxFrontData) => {
                            if (err) return nextsystem(err);

                            //append the all_search which appropriate titles discovered for this system
                            all_search = all_search.concat(search);
                            all_suggestions_top = all_suggestions_top.concat(top);
                            all_suggestions_above = all_suggestions_above.concat(above);

                            //expand genres object
                            for (var genre in genres) {
                                if (!all_genres.hasOwnProperty(genre)) {
                                    all_genres[genre] = [];
                                }
                                all_genres[genre] = all_genres[genre].concat(genres[genre]);
                            }

                            //expand years object
                            for (var year in years) {
                                if (!all_years.hasOwnProperty(year)) {
                                    all_years[year] = [];
                                }
                                all_years[year] = all_years[year].concat(years[year]);
                            }

                            total_titles += total;

                            if (boxFrontData && Object.keys(boxFrontData).length > 0) {
                                masterInventorySources[system] = {
                                    config: systems[system],
                                    master: masterfile,
                                    boxFronts: boxFrontData
                                };

                                return nextsystem();
                            }

                            FileService.Get('/data/' + system + '_boxfronts', function(err, localBoxFronts) {
                                masterInventorySources[system] = {
                                    config: systems[system],
                                    master: masterfile,
                                    boxFronts: err ? {} : localBoxFronts
                                };

                                return nextsystem();
                            });
                        });
                    }, '/data/' + system + '_metadata');
                });

            }); //open masterfile

        }, 
        //the end of for each system
        function(err) {

            if (err) return callback(err);

            //cache results in file service because it has unlimited ttl
            //all system specific caches:
            FileService.Set('suggestions.all.top', all_suggestions_top);
            FileService.Set('suggestions.all.above', all_suggestions_above);

            FileService.Set('suggestions.all.data', {
                lengths: {
                    top: all_suggestions_top.length,
                    above: all_suggestions_above.length,
                    titles: total_titles
                }
            });
            
            FileService.Set('search.all', all_search);

            //separate all genres into their own cache
            for (var genre in all_genres) {
                FileService.Set('suggestions.all.genre.' + genre, all_genres[genre]);
            }

            //separate all years into their own cache
            for (var year in all_years) {
                FileService.Set('suggestions.all.year.' + year, all_years[year]);
            }

            //put genre names in config object
            FileService.Set('metadata.genres', Object.keys(all_genres));
            FileService.Set('metadata.years', Object.keys(all_years));
            

            MasterInventoryService.Write(masterInventorySources, (inventoryErr, inventoryResult) => {
                if (inventoryErr) {
                    console.log('master-inventory: failed to generate master-inventory.tsv', inventoryErr);
                }
                else {
                    console.log('master-inventory: wrote ' + inventoryResult.count + ' titles to ' + inventoryResult.filename +
                        ' (skipped no box art: ' + inventoryResult.stats.skipped.noBoxArt +
                        ', malformed: ' + GetMasterInventoryMalformedCount(inventoryResult.stats) +
                        ', duplicates: ' + inventoryResult.stats.skipped.duplicates + ')');
                }

                //i found that generating a unique suggestions (for all, system) was inefficient, so I will create canned versions instead, the player will not notice :)
                SuggestionService.CreateCanned((err) => {
                    if (err) {
                        return callback(err);
                    }

                    console.log('Crazyerics application start-up complete! Enjoy ;)');

                    callback();
                });
            });
        });

        //build the server-persisted featured collections cache at startup
        FeaturedService.ApplicationStart((err) => {
            if (err) {
                console.log('featured: startup cache warm failed; public featured collections are disabled until a successful refresh:', err && err.message ? err.message : err);
            }
        });

        //build cached dynamic site statistic collections at startup
        SiteStatisticCollectionsService.ApplicationStart((err) => {
            if (err) console.log(err);
        });
    };

    var GetMasterInventoryMalformedCount = function(stats) {

        if (!stats || !stats.skipped) {
            return 0;
        }

        return stats.skipped.missingTitle +
            stats.skipped.missingRom +
            stats.skipped.missingSystem +
            stats.skipped.invalidMasterFiles +
            stats.skipped.invalidBoxFrontEntries +
            stats.skipped.malformed;
    };

    var BuildConfigForEntry = function(callback) {
        
        var configdata = {};
        var systems = config.get('systems');
        var canned = config.get('cannedRecipes');

        configdata['systemdetails'] = {};
        configdata['displaystyles'] = {
            configured: BuildConfiguredDisplayStyles(systems)
        };

        //system specific configs
        for (var system in systems) {
            
            //if system is "live" (ready to show for production)
            if (systems[system].live) {

                //a white list of config settings available to client:

                //required
                configdata.systemdetails[system] = {
                    'name': systems[system].name,
                    'shortname': systems[system].shortname,
                    'boxcdnversion': systems[system].boxcdnversion,
                    'romcdnversion': systems[system].romcdnversion,
                    'emuextention': systems[system].emuextention,
                    'emulatorpath': systems[system].emulatorpath,
                    'emuscript': systems[system].emuscript,
                    'retroarch': systems[system].retroarch,
                    'browserWorkarounds': systems[system].browserWorkarounds,
                    'controllerDiagram': systems[system].controllerDiagram,
                    'screenshotaspectratio': systems[system].screenshotaspectratio,
                    'supportfiles': systems[system].supportfiles,
                    'cannedSuggestion': false
                };

                //does this system have a canned receipe for suggestions?
                if (canned[system]) {
                    configdata.systemdetails[system].cannedSuggestion = true;
                }

                //defined or use default values
                configdata.systemdetails[system]['recommendedshaders'] = systems[system].recommendedshaders || systems.default.recommendedshaders;
            }
        }

        //default retroarch configuration
        configdata['retroarch'] = config.get('retroarch');

        //paths 
        configdata['paths'] = config.get('paths');

        //button mappings
        configdata['mappings'] = config.get('mappings');

        //keyboard input defaults used by the client controls reference
        configdata['input'] = config.get('input');

        //settings defaults for client
        configdata['defaults'] = config.get('defaults');

        configdata['collections'] = {
            renderCollectionTabs: config.has('collections.renderCollectionTabs') && config.get('collections.renderCollectionTabs') === true
        };

        if (config.has('normalSaveFiles')) {
            configdata['normalSaveFiles'] = config.get('normalSaveFiles');
        }

        TitleBannerService.GetRandomBannerUrl(function(err, titleBannerUrl) {
            if (err) {
                console.log('titlebanner: failed to select banner', err);
            }

            configdata['titlebanner'] = {
                backgroundImageUrl: titleBannerUrl || null
            };

            return callback(null, configdata);
        });
    };


    var _shaderRoot = path.join(__dirname, '..', 'public', 'shaders_glsl');

    var BuildConfiguredDisplayStyles = function(systems) {

        var result = [];
        var seen = {};
        var systemKeys = Object.keys(systems || {});

        systemKeys.forEach(function(system) {
            var systemConfig = systems[system] || {};
            var definitions = GetConfiguredDisplayStyleDefinitionsForSystem(systemConfig);
            var i;

            for (i = 0; i < definitions.length; i++) {
                var style = NormalizeConfiguredDisplayStyleDefinition(definitions[i], system, i);
                var key;

                if (!style) {
                    continue;
                }

                key = GetConfiguredDisplayStyleKey(style);

                if (!key || seen[key]) {
                    continue;
                }

                style.id = 'configured-display-style-' + result.length;
                result.push(style);
                seen[key] = true;
            }
        });

        return result;
    };

    var GetConfiguredDisplayStyleDefinitionsForSystem = function(systemConfig) {

        var result = [];
        var recommended = systemConfig.recommendedshaders || [];
        var workaround = systemConfig.browserWorkarounds && systemConfig.browserWorkarounds.postStartupShaderReapply ? systemConfig.browserWorkarounds.postStartupShaderReapply : null;
        var presets = workaround && Array.isArray(workaround.presets) ? workaround.presets : [];
        var workaroundTitle = StripConfiguredDisplayStyleLabelSuffix(workaround ? workaround.label || null : null);
        var i;

        if (Array.isArray(recommended)) {
            result = result.concat(recommended);
        }

        for (i = 0; i < presets.length; i++) {
            result.push({
                title: workaroundTitle,
                glslp: presets[i]
            });
        }

        return result;
    };

    var NormalizeConfiguredDisplayStyleDefinition = function(shaderDefinition, system, index) {

        var title = null;
        var shader = '';
        var glslp = null;
        var rawGlslp = null;
        var sourceValue = null;

        if (!shaderDefinition) {
            return null;
        }

        if (typeof shaderDefinition === 'string') {
            sourceValue = shaderDefinition;
            glslp = NormalizeConfiguredDisplayStylePreset(shaderDefinition);
            shader = glslp || NormalizeConfiguredDisplayStyleShaderValue(shaderDefinition);
            title = BuildConfiguredDisplayStyleTitle(shader, glslp, sourceValue);
        }
        else if (typeof shaderDefinition === 'object') {
            rawGlslp = shaderDefinition.glslp || shaderDefinition.preset || shaderDefinition.path || shaderDefinition.rawglsl || shaderDefinition.rawGlsl || shaderDefinition.raw_glsl || null;
            glslp = NormalizeConfiguredDisplayStylePreset(rawGlslp);

            if (rawGlslp && !glslp) {
                return null;
            }

            shader = NormalizeConfiguredDisplayStyleShaderValue(shaderDefinition.shader || glslp || '');

            if (!shader && glslp) {
                shader = glslp;
            }

            title = NormalizeConfiguredDisplayStyleTitle(shaderDefinition.title || shaderDefinition.name || null) || BuildConfiguredDisplayStyleTitle(shader, glslp, null);
        }

        if (!shader && !glslp) {
            return null;
        }

        if (glslp && !ConfiguredDisplayStylePresetExists(glslp)) {
            return null;
        }

        return {
            id: 'configured-display-style-pending-' + (index || 0),
            title: title || 'Display Style',
            name: title || 'Display Style',
            shader: shader || '',
            glslp: glslp,
            isPixelPerfect: false,
            sourceSystem: system || null
        };
    };

    var NormalizeConfiguredDisplayStylePreset = function(value) {

        var normalized;

        if (!value) {
            return null;
        }

        normalized = ShaderService.NormalizePresetPath(value);

        if (!normalized || path.extname(normalized).toLowerCase() !== '.glslp') {
            return null;
        }

        return normalized;
    };

    var NormalizeConfiguredDisplayStyleShaderValue = function(value) {

        value = String(value || '').replace(/\\/g, '/').trim();

        if (!value || value.indexOf('\0') >= 0 || value.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return '';
        }

        if (value.match(/\.glslp$/i)) {
            return NormalizeConfiguredDisplayStylePreset(value) || '';
        }

        if (value.charAt(0) === '/' || value.charAt(0) === '.' || value.indexOf('..') >= 0) {
            return '';
        }

        if (!value.match(/^[a-z0-9][a-z0-9_\.\/-]*$/i)) {
            return '';
        }

        return value;
    };

    var ConfiguredDisplayStylePresetExists = function(glslp) {

        var fullPath;
        var relativeFromRoot;

        if (!glslp) {
            return false;
        }

        fullPath = path.resolve(_shaderRoot, glslp);
        relativeFromRoot = path.relative(_shaderRoot, fullPath);

        if (!relativeFromRoot || relativeFromRoot.indexOf('..') === 0 || path.isAbsolute(relativeFromRoot)) {
            return false;
        }

        try {
            return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
        } catch (e) {
            return false;
        }
    };

    var GetConfiguredDisplayStyleKey = function(style) {

        var normalizedPath = NormalizeConfiguredDisplayStylePreset(style.glslp || style.shader || '');

        if (normalizedPath) {
            return 'glslp:' + normalizedPath.toLowerCase();
        }

        if (style.shader) {
            return 'shader:' + String(style.shader).toLowerCase();
        }

        return null;
    };

    var NormalizeConfiguredDisplayStyleTitle = function(value) {

        value = String(value || '').replace(/\s+/g, ' ').trim();
        return value || null;
    };

    var StripConfiguredDisplayStyleLabelSuffix = function(value) {

        value = NormalizeConfiguredDisplayStyleTitle(value);

        if (!value) {
            return null;
        }

        return value.replace(/\s+shader$/i, '').replace(/\s+display\s+style$/i, '').trim() || value;
    };

    var BuildConfiguredDisplayStyleTitle = function(shader, glslp, fallback) {

        var value = glslp || shader || fallback || '';

        if (value.match(/\.glslp$/i)) {
            value = path.posix.basename(value).replace(/\.glslp$/i, '');
        }

        return FriendlyDisplayStyleName(value);
    };

    var FriendlyDisplayStyleName = function(value) {

        var acronyms = {
            crt: 'CRT',
            lcd: 'LCD',
            ntsc: 'NTSC',
            pal: 'PAL',
            vhs: 'VHS',
            gba: 'GBA',
            gbc: 'GBC',
            nes: 'NES',
            snes: 'SNES',
            n64: 'N64',
            ngpc: 'NGPC',
            xbr: 'XBR',
            xbrz: 'XBRZ',
            hqx: 'HQX',
            fsr: 'FSR',
            fxaa: 'FXAA'
        };

        value = String(value || '').replace(/[_\-\/]+/g, ' ').replace(/\s+/g, ' ').trim();

        if (!value) {
            return 'Display Style';
        }

        return value.split(' ').map(function(part) {
            var lower = part.toLowerCase();

            if (acronyms[lower]) {
                return acronyms[lower];
            }

            if (part.match(/^\d+x?$/i)) {
                return part.toUpperCase();
            }

            return part.charAt(0).toUpperCase() + part.substr(1);
        }).join(' ');
    };

    //try only to include absolutely necessary data for entry
    var BuildComponentDataForEntry = function(req, callback) {

        //since this footprint is going out over the wire, use less characters for names
        var components = {
            c: {},
            p: {},
            f: {},
            sc: {}
        };

        if (req.user) {

            var userId = req.user.user_id;
            
            //get client data with sync
            CollectionService.Sync.Outgoing(userId, (err, collectionPayload) => {
                if (err) return callback(err);

                components.c = collectionPayload;

                PreferencesService.Sync.Outgoing(userId, (err, preferencesPayload) => {
                    if (err) return callback(err);

                    components.p = preferencesPayload;

                    FeaturedService.Sync.Outgoing((err, featuredPayload) => {
                        if (err) return callback(err);

                        components.f = featuredPayload;

                        SiteStatisticCollectionsService.Sync.Outgoing((err, siteStatisticCollectionsPayload) => {
                            if (err) return callback(err);

                            components.sc = siteStatisticCollectionsPayload;

                            callback(null, components);
                        });
                    });
                });
            });
        } else {
            return callback('user not on request object');
        }
    };
});
