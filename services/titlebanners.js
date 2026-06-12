'use strict';

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const config = require('config');
const Cache = require('./cache/cache.redis.js');

const cacheKey = 'titlebanners:list';
const projectRoot = path.join(__dirname, '..');
const defaultLocalPaths = [
    'public/images/titlebanners',
    'public/image/titlebanners',
    'images/titlebanners',
    'image/titlebanners'
];
const defaultSupportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const defaultFallbackFilename = '1.png';
const defaultCacheTimeoutMs = 750;

const titleBannerCache = new Cache(cacheKey, {
    stdTTL: 0
});

module.exports = new (function() {

    var _self = this;
    var _warnedRedisUnavailable = false;
    var _warnedNoImages = false;
    var _warnedDirectoryUnavailable = false;

    this.CacheKey = cacheKey;

    this.ApplicationStart = function(callback) {
        _self.WarmCache(callback);
    };

    this.WarmCache = function(callback) {
        callback = callback || function() {};

        BuildBannerList(function(err, result) {
            if (err) {
                WarnDirectoryUnavailable(err);
                return callback(null, []);
            }

            if (!result.filenames.length) {
                WarnNoImages();
                return callback(null, []);
            }

            console.log('titlebanner: loaded ' + result.filenames.length + ' banner filenames from local directory ' + result.relativeDirectory);

            CacheBannerList(result.filenames, function() {
                return callback(null, result.filenames);
            });
        });
    };

    this.GetRandomBannerUrl = function(callback) {
        GetBannerFilenames(function(err, filenames) {
            var filename = null;
            var titleBannerUrl = null;

            if (filenames && filenames.length) {
                filename = filenames[Math.floor(Math.random() * filenames.length)];
                titleBannerUrl = BuildCdnUrl(filename);
            }
            else {
                WarnNoImages();
                titleBannerUrl = BuildFallbackUrl();
            }

            return callback(null, titleBannerUrl);
        });
    };

    this.GetBannerFilenames = function(callback) {
        GetBannerFilenames(callback);
    };

    this.BuildCdnUrl = function(filename) {
        return BuildCdnUrl(filename);
    };

    function GetBannerFilenames(callback) {
        GetCachedBannerList(function(err, filenames) {
            if (err) {
                WarnRedisUnavailable();
                return GetBannerFilenamesDirect(callback);
            }

            if (filenames && filenames.length) {
                return callback(null, filenames);
            }

            BuildAndCacheBannerList(function(err, rebuiltFilenames) {
                if (err) {
                    return GetBannerFilenamesDirect(callback);
                }

                return callback(null, rebuiltFilenames);
            });
        });
    }

    function GetBannerFilenamesDirect(callback) {
        BuildBannerList(function(err, result) {
            if (err) {
                WarnDirectoryUnavailable(err);
                return callback(null, []);
            }

            if (!result.filenames.length) {
                WarnNoImages();
            }

            return callback(null, result.filenames);
        });
    }

    function BuildAndCacheBannerList(callback) {
        BuildBannerList(function(err, result) {
            if (err) {
                WarnDirectoryUnavailable(err);
                return callback(null, []);
            }

            if (!result.filenames.length) {
                WarnNoImages();
                return callback(null, []);
            }

            CacheBannerList(result.filenames, function() {
                return callback(null, result.filenames);
            });
        });
    }

    function GetCachedBannerList(callback) {
        RunCacheOperation(function(done) {
            titleBannerCache.Get([], done);
        }, function(err, filenames) {
            if (err) {
                return callback(err);
            }

            if (!Array.isArray(filenames)) {
                return callback(null, null);
            }

            return callback(null, filenames);
        });
    }

    function CacheBannerList(filenames, callback) {
        if (!filenames || !filenames.length) {
            return callback(null, false);
        }

        RunCacheOperation(function(done) {
            titleBannerCache.Set([], filenames, done);
        }, function(err) {
            if (err) {
                WarnRedisUnavailable();
                return callback(null, false);
            }

            console.log('titlebanner: cached banner filename list in Redis');
            return callback(null, true);
        });
    }

    function RunCacheOperation(operation, callback) {
        var complete = false;
        var timeout = setTimeout(function() {
            if (complete) return;
            complete = true;
            return callback(new Error('Redis cache operation timed out'));
        }, GetCacheTimeoutMs());

        try {
            operation(function(err, value) {
                if (complete) return;
                complete = true;
                clearTimeout(timeout);
                return callback(err, value);
            });
        }
        catch (err) {
            if (complete) return;
            complete = true;
            clearTimeout(timeout);
            return callback(err);
        }
    }

    function BuildBannerList(callback) {
        FindLocalDirectory(function(err, directory) {
            if (err) {
                return callback(err);
            }

            fs.readdir(directory, function(err, entries) {
                if (err) {
                    return callback(err);
                }

                async.filter(entries, function(entry, nextEntry) {
                    if (!entry || entry[0] === '.') {
                        return nextEntry(null, false);
                    }

                    if (!IsSupportedImage(entry)) {
                        return nextEntry(null, false);
                    }

                    fs.stat(path.join(directory, entry), function(err, stats) {
                        if (err || !stats.isFile()) {
                            return nextEntry(null, false);
                        }

                        return nextEntry(null, true);
                    });
                }, function(err, filenames) {
                    if (err) {
                        return callback(err);
                    }

                    filenames.sort();

                    return callback(null, {
                        directory: directory,
                        relativeDirectory: path.relative(projectRoot, directory) || directory,
                        filenames: filenames
                    });
                });
            });
        });
    }

    function FindLocalDirectory(callback) {
        var directories = GetLocalDirectories();

        async.detectSeries(directories, function(directory, nextDirectory) {
            fs.stat(directory, function(err, stats) {
                return nextDirectory(null, !err && stats.isDirectory());
            });
        }, function(err, directory) {
            if (err) {
                return callback(err);
            }

            if (!directory) {
                return callback(new Error('No local title banner directory found. Tried: ' + directories.join(', ')));
            }

            return callback(null, directory);
        });
    }

    function GetLocalDirectories() {
        var configured = null;

        if (config.has('titlebanners.localPaths')) {
            configured = config.get('titlebanners.localPaths');
        }
        else if (config.has('titlebanners.localPath')) {
            configured = config.get('titlebanners.localPath');
        }

        if (!configured) {
            configured = defaultLocalPaths;
        }

        if (typeof configured === 'string') {
            configured = [configured];
        }

        return configured.map(function(directory) {
            if (path.isAbsolute(directory)) {
                return directory;
            }

            return path.join(projectRoot, directory);
        });
    }

    function IsSupportedImage(filename) {
        return GetSupportedExtensions().indexOf(path.extname(filename).toLowerCase()) >= 0;
    }

    function GetSupportedExtensions() {
        var extensions = config.has('titlebanners.supportedExtensions') ? config.get('titlebanners.supportedExtensions') : defaultSupportedExtensions;

        return extensions.map(function(extension) {
            extension = String(extension).toLowerCase();
            return extension[0] === '.' ? extension : '.' + extension;
        });
    }

    function BuildCdnUrl(filename) {
        var relativePath = config.has('titlebanners.path') ? config.get('titlebanners.path') : 'titlebanners';
        relativePath = String(relativePath).replace(/^\/+|\/+$/g, '');

        return config.get('paths.images').replace(/\/+$/g, '') + '/' + relativePath + '/' + encodeURIComponent(filename);
    }

    function BuildFallbackUrl() {
        var fallbackFilename = config.has('titlebanners.fallbackFilename') ? config.get('titlebanners.fallbackFilename') : defaultFallbackFilename;

        if (!fallbackFilename) {
            return null;
        }

        return BuildCdnUrl(fallbackFilename);
    }

    function GetCacheTimeoutMs() {
        return config.has('titlebanners.cacheTimeoutMs') ? config.get('titlebanners.cacheTimeoutMs') : defaultCacheTimeoutMs;
    }

    function WarnRedisUnavailable() {
        if (_warnedRedisUnavailable) {
            return;
        }

        _warnedRedisUnavailable = true;
        console.log('titlebanner: Redis unavailable; using direct directory fallback');
    }

    function WarnNoImages() {
        if (_warnedNoImages) {
            return;
        }

        _warnedNoImages = true;
        console.log('titlebanner: no valid title banner images found; using fallback banner');
    }

    function WarnDirectoryUnavailable(err) {
        if (_warnedDirectoryUnavailable) {
            return;
        }

        _warnedDirectoryUnavailable = true;
        console.log('titlebanner: local directory unavailable; using fallback banner. ' + (err.message || err));
    }

})();
