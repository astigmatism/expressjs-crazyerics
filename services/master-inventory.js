'use strict';
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_OUTPUT_FILENAME = 'master-inventory.tsv';
const DEFAULT_OUTPUT_PATH = path.join(PROJECT_ROOT, DEFAULT_OUTPUT_FILENAME);

module.exports = new (function() {

    this.Write = function(systemSources, callback, opt_outputPath) {

        var outputPath = opt_outputPath || DEFAULT_OUTPUT_PATH;
        var result;

        try {
            result = BuildInventory(systemSources || {});
        }
        catch (err) {
            return callback(err);
        }

        WriteFileAtomic(outputPath, SerializeTsv(result.entries), function(err) {
            if (err) {
                return callback(err);
            }

            result.file = outputPath;
            result.filename = path.basename(outputPath);
            result.count = result.entries.length;
            callback(null, result);
        });
    };

    this.BuildInventory = BuildInventory;
    this.GetOutputPath = function() {
        return DEFAULT_OUTPUT_PATH;
    };

    function BuildInventory(systemSources) {

        var stats = CreateStats();
        var candidates = [];
        var systems = Object.keys(systemSources || {}).sort();

        systems.forEach(function(system) {
            var source = systemSources[system] || {};
            var masterFile = source.master || {};
            var boxFrontTitles = BuildBoxFrontTitleMap(source.boxFronts, stats);
            var systemConfig = source.config || {};
            var systemAbbreviation = GetSystemAbbreviation(system, systemConfig, stats);
            var titles;

            if (!systemAbbreviation) {
                stats.skipped.missingSystem++;
                return;
            }

            if (!IsPlainObject(masterFile)) {
                stats.skipped.invalidMasterFiles++;
                return;
            }

            stats.systems++;
            titles = Object.keys(masterFile).sort();

            titles.forEach(function(title) {
                var titleRecord = masterFile[title];
                var bestFile;
                var romFilename;
                var candidate;

                stats.titles++;

                if (!NormalizeField(title)) {
                    stats.skipped.missingTitle++;
                    return;
                }

                if (!boxFrontTitles[title]) {
                    stats.skipped.noBoxArt++;
                    return;
                }

                bestFile = GetBestFileName(titleRecord);
                romFilename = NormalizeRomFilename(bestFile);

                if (!romFilename) {
                    stats.skipped.missingRom++;
                    return;
                }

                candidate = {
                    system: NormalizeField(systemAbbreviation),
                    title: NormalizeField(title, stats),
                    rom: NormalizeField(romFilename, stats)
                };

                if (!candidate.system || !candidate.title || !candidate.rom) {
                    stats.skipped.malformed++;
                    return;
                }

                candidate.dedupeKey = MakeDedupeKey(candidate);
                candidates.push(candidate);
            });

            AddUnmatchedBoxFrontCount(boxFrontTitles, masterFile, stats);
        });

        candidates.sort(CompareEntries);

        return {
            entries: DedupeEntries(candidates, stats),
            stats: stats
        };
    }

    function CreateStats() {
        return {
            systems: 0,
            titles: 0,
            boxFrontEntries: 0,
            unmatchedBoxFrontEntries: 0,
            explicitSystemAbbreviations: 0,
            systemKeyAbbreviationFallbacks: 0,
            sanitizedFields: 0,
            skipped: {
                noBoxArt: 0,
                missingTitle: 0,
                missingRom: 0,
                missingSystem: 0,
                invalidMasterFiles: 0,
                invalidBoxFrontEntries: 0,
                malformed: 0,
                duplicates: 0
            }
        };
    }

    function BuildBoxFrontTitleMap(boxFronts, stats) {

        var map = {};

        if (!boxFronts) {
            return map;
        }

        if (Array.isArray(boxFronts)) {
            boxFronts.forEach(function(item) {
                var title = typeof item === 'string' ? item : item && (item.title || item.name || item.t);

                title = NormalizeField(title);

                if (!title) {
                    stats.skipped.invalidBoxFrontEntries++;
                    return;
                }

                map[title] = true;
                stats.boxFrontEntries++;
            });

            return map;
        }

        if (!IsPlainObject(boxFronts)) {
            stats.skipped.invalidBoxFrontEntries++;
            return map;
        }

        Object.keys(boxFronts).forEach(function(title) {
            if (!NormalizeField(title)) {
                stats.skipped.invalidBoxFrontEntries++;
                return;
            }

            map[title] = true;
            stats.boxFrontEntries++;
        });

        return map;
    }

    function AddUnmatchedBoxFrontCount(boxFrontTitles, masterFile, stats) {

        Object.keys(boxFrontTitles).forEach(function(title) {
            if (!Object.prototype.hasOwnProperty.call(masterFile, title)) {
                stats.unmatchedBoxFrontEntries++;
            }
        });
    }

    function GetBestFileName(titleRecord) {

        var bestFile;

        if (!titleRecord || !titleRecord.f || !IsPlainObject(titleRecord.f)) {
            return '';
        }

        bestFile = titleRecord.b;

        if (bestFile && Object.prototype.hasOwnProperty.call(titleRecord.f, bestFile)) {
            return bestFile;
        }

        return '';
    }

    function GetSystemAbbreviation(system, systemConfig, stats) {

        var fields = ['abbreviation', 'abbr', 'shortkey', 'shortKey'];
        var value;
        var i;

        systemConfig = systemConfig || {};

        for (i = 0; i < fields.length; ++i) {
            value = NormalizeField(systemConfig[fields[i]]);
            if (value) {
                stats.explicitSystemAbbreviations++;
                return value.toUpperCase();
            }
        }

        value = NormalizeField(system);

        if (value) {
            stats.systemKeyAbbreviationFallbacks++;
            return value.toUpperCase();
        }

        return '';
    }

    function NormalizeRomFilename(value) {

        value = NormalizeField(value);

        if (!value) {
            return '';
        }

        value = value.replace(/\\/g, '/');
        return value.split('/').pop().trim();
    }

    function NormalizeField(value, stats) {

        var original;
        var normalized;

        if (typeof value === 'undefined' || value === null) {
            return '';
        }

        original = String(value);
        normalized = original.replace(/\0/g, '').replace(/[\t\r\n]+/g, ' ').trim();

        if (stats && normalized !== original) {
            stats.sanitizedFields++;
        }

        return normalized;
    }

    function MakeDedupeKey(entry) {
        return [entry.system, entry.rom].join('\u0000').toLowerCase();
    }

    function DedupeEntries(candidates, stats) {

        var seen = {};
        var entries = [];

        candidates.forEach(function(candidate) {
            if (seen[candidate.dedupeKey]) {
                stats.skipped.duplicates++;
                return;
            }

            seen[candidate.dedupeKey] = true;
            entries.push({
                system: candidate.system,
                title: candidate.title,
                rom: candidate.rom
            });
        });

        return entries;
    }

    function CompareEntries(a, b) {

        var aValues = [a.system, a.title, a.rom];
        var bValues = [b.system, b.title, b.rom];
        var i;

        for (i = 0; i < aValues.length; ++i) {
            if (aValues[i].toLowerCase() < bValues[i].toLowerCase()) {
                return -1;
            }
            if (aValues[i].toLowerCase() > bValues[i].toLowerCase()) {
                return 1;
            }
        }

        return 0;
    }

    function SerializeTsv(entries) {

        var lines = ['system\ttitle\trom'];

        entries.forEach(function(entry) {
            lines.push([entry.system, entry.title, entry.rom].join('\t'));
        });

        return lines.join('\n') + '\n';
    }

    function WriteFileAtomic(destinationPath, content, callback) {

        var tempPath = destinationPath + '.tmp-' + process.pid;

        fs.writeFile(tempPath, content, 'utf8', function(writeErr) {
            if (writeErr) {
                return callback(writeErr);
            }

            fs.rename(tempPath, destinationPath, function(renameErr) {
                if (renameErr) {
                    fs.unlink(tempPath, function() {
                        callback(renameErr);
                    });
                    return;
                }

                callback();
            });
        });
    }

    function IsPlainObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }
})();
