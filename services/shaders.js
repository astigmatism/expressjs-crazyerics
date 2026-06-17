'use strict';

const fs = require('fs');
const path = require('path');
const config = require('config');
const PreferencesService = require('./preferences');

module.exports = new (function() {

    var _self = this;
    var _publicShaderRoot = '/shaders_glsl';
    var _shaderRoot = path.join(__dirname, '..', 'public', 'shaders_glsl');
    var _compatiblePresetExtensions = ['.glslp'];

    this.ListPresets = function(callback) {

        var result = {
            ok: true,
            root: _publicShaderRoot,
            compatibleExtensions: _compatiblePresetExtensions.slice(0),
            categories: [],
            count: 0,
            missingRoot: false
        };

        fs.stat(_shaderRoot, function(err, stat) {
            var categoryMap;
            var entries;

            if (err || !stat || !stat.isDirectory()) {
                result.missingRoot = true;
                result.message = 'Shader folder was not found.';
                return callback(null, result);
            }

            try {
                entries = WalkShaderDirectory(_shaderRoot, '');
                categoryMap = GroupPresetEntries(entries);
                result.categories = Object.keys(categoryMap).map(function(key) {
                    return categoryMap[key];
                }).sort(CompareCategories);

                result.categories.forEach(function(category) {
                    category.shaders.sort(CompareShaderEntries);
                    result.count += category.shaders.length;
                });
            } catch (e) {
                return callback(e);
            }

            callback(null, result);
        });
    };

    this.ValidatePresetPath = function(shaderPath, callback) {

        var normalized = NormalizePresetPath(shaderPath);
        var fullPath;

        if (!normalized) {
            return callback(BuildError('Invalid shader preset path.', 400));
        }

        if (!IsCompatiblePreset(normalized)) {
            return callback(BuildError('Only RetroArch GLSL preset files (.glslp) can be selected.', 400));
        }

        fullPath = ResolvePresetFullPath(normalized);

        if (!fullPath) {
            return callback(BuildError('Invalid shader preset path.', 400));
        }

        fs.stat(fullPath, function(err, stat) {
            if (err || !stat || !stat.isFile()) {
                return callback(BuildError('Shader preset was not found.', 404));
            }

            callback(null, BuildPresetEntry(normalized));
        });
    };

    this.SaveSystemDefault = function(userId, system, shaderPath, callback) {

        if (!userId) {
            return callback(BuildError('User is not available.', 401));
        }

        if (!IsKnownSystem(system)) {
            return callback(BuildError('Unknown game system.', 400));
        }

        if (shaderPath === '') {
            return PreferencesService.Set(userId, BuildPreferenceKey(system), '', function(err) {
                if (err) {
                    return callback(err);
                }

                callback(null, {
                    system: system,
                    shader: '',
                    entry: null
                });
            });
        }

        SaveValidatedSystemDefault(userId, system, shaderPath, callback);
    };

    var SaveValidatedSystemDefault = function(userId, system, shaderPath, callback) {

        var curatedDefault = ResolveCuratedDefaultSelection(system, shaderPath);
        var valueToSave;

        if (!curatedDefault) {
            return callback(BuildError('Display style is not configured for this application.', 400));
        }

        valueToSave = curatedDefault.value;

        if (!IsCompatiblePreset(valueToSave)) {
            return PreferencesService.Set(userId, BuildPreferenceKey(system), valueToSave, function(err) {
                if (err) {
                    return callback(err);
                }

                callback(null, {
                    system: system,
                    shader: valueToSave,
                    entry: null,
                    curated: true
                });
            });
        }

        _self.ValidatePresetPath(valueToSave, function(err, entry) {
            if (err) {
                return callback(err);
            }

            PreferencesService.Set(userId, BuildPreferenceKey(system), entry.path, function(err) {
                if (err) {
                    return callback(err);
                }

                callback(null, {
                    system: system,
                    shader: entry.path,
                    entry: entry,
                    curated: !!curatedDefault
                });
            });
        });
    };

    this.ClearSystemDefault = function(userId, system, callback) {

        if (!userId) {
            return callback(BuildError('User is not available.', 401));
        }

        if (!IsKnownSystem(system)) {
            return callback(BuildError('Unknown game system.', 400));
        }

        if (typeof PreferencesService.Remove === 'function') {
            return PreferencesService.Remove(userId, BuildPreferenceKey(system), function(err) {
                if (err) {
                    return callback(err);
                }

                callback(null, {
                    system: system,
                    cleared: true
                });
            });
        }

        callback(BuildError('Preference clearing is not available.', 500));
    };

    var ResolveCuratedDefaultSelection = function(system, selection) {

        var normalizedSelection = NormalizeSelectionValue(selection);
        var normalizedPath = NormalizePresetPath(normalizedSelection);
        var definitions = GetCuratedShaderDefinitions(system);
        var i;

        for (i = 0; i < definitions.length; i++) {
            var definition = NormalizeShaderDefinition(definitions[i]);
            var launchValue;

            if (!definition) {
                continue;
            }

            launchValue = ResolveLaunchValueForSystem(system, definition);

            if (SelectionMatchesDefinition(normalizedSelection, normalizedPath, definition, launchValue)) {
                return {
                    value: launchValue,
                    definition: definition
                };
            }
        }

        return null;
    };

    var GetCuratedShaderDefinitions = function(system) {

        var result = [];
        var seen = {};

        AddShaderDefinitions(result, seen, GetRecommendedShaderDefinitions(system));
        AddAllConfiguredShaderDefinitions(result, seen);

        return result;
    };

    var AddAllConfiguredShaderDefinitions = function(result, seen) {

        var systems;

        if (!config.has('systems')) {
            return;
        }

        systems = config.get('systems') || {};

        Object.keys(systems).forEach(function(systemKey) {
            var systemConfig = systems[systemKey] || {};
            AddShaderDefinitions(result, seen, GetConfiguredShaderDefinitionsForSystem(systemConfig));
        });
    };

    var GetConfiguredShaderDefinitionsForSystem = function(systemConfig) {

        var result = [];
        var recommended = systemConfig.recommendedshaders || [];
        var workaround = systemConfig.browserWorkarounds && systemConfig.browserWorkarounds.postStartupShaderReapply ? systemConfig.browserWorkarounds.postStartupShaderReapply : null;
        var presets = workaround && Array.isArray(workaround.presets) ? workaround.presets : [];
        var i;

        if (Array.isArray(recommended)) {
            result = result.concat(recommended);
        }

        for (i = 0; i < presets.length; i++) {
            result.push({
                glslp: presets[i]
            });
        }

        return result;
    };

    var AddShaderDefinitions = function(result, seen, definitions) {

        var i;

        if (!Array.isArray(definitions)) {
            return;
        }

        for (i = 0; i < definitions.length; i++) {
            var definition = NormalizeShaderDefinition(definitions[i]);
            var key;

            if (!definition) {
                continue;
            }

            key = GetShaderDefinitionKey(definition);

            if (!key || seen[key]) {
                continue;
            }

            seen[key] = true;
            result.push(definition);
        }
    };

    var GetShaderDefinitionKey = function(definition) {

        var normalizedPath = NormalizePresetPath(definition.glslp || definition.shader || '');

        if (normalizedPath && IsCompatiblePreset(normalizedPath)) {
            return 'glslp:' + normalizedPath.toLowerCase();
        }

        if (definition.shader) {
            return 'shader:' + String(definition.shader).toLowerCase();
        }

        return null;
    };

    var GetRecommendedShaderDefinitions = function(system) {

        var systems;
        var systemConfig;
        var defaultConfig;

        if (!config.has('systems')) {
            return [];
        }

        systems = config.get('systems') || {};
        systemConfig = systems[system] || {};
        defaultConfig = systems.default || {};

        return systemConfig.recommendedshaders || defaultConfig.recommendedshaders || [];
    };

    var NormalizeShaderDefinition = function(shaderDefinition) {

        var glslp;
        var shader;
        var rawGlslp;

        if (!shaderDefinition) {
            return null;
        }

        if (typeof shaderDefinition === 'string') {
            glslp = NormalizePresetPath(shaderDefinition);
            shader = glslp || NormalizeShaderValue(shaderDefinition);

            if (!shader && !glslp) {
                return null;
            }

            return {
                shader: shader,
                glslp: glslp || null
            };
        }

        rawGlslp = shaderDefinition.glslp || shaderDefinition.preset || shaderDefinition.path || shaderDefinition.rawglsl || shaderDefinition.rawGlsl || shaderDefinition.raw_glsl || null;
        glslp = NormalizePresetPath(rawGlslp);

        if (rawGlslp && !glslp) {
            return null;
        }

        shader = NormalizeShaderValue(shaderDefinition.shader || glslp || '');

        if (!shader && glslp) {
            shader = glslp;
        }

        if (!shader && !glslp) {
            return null;
        }

        return {
            shader: shader,
            glslp: glslp || null
        };
    };

    var NormalizeShaderValue = function(value) {

        value = String(value || '').replace(/\\/g, '/').trim();

        if (!value || value.indexOf('\0') >= 0 || value.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return '';
        }

        if (value.match(/\.glslp$/i)) {
            return NormalizePresetPath(value) || '';
        }

        if (value.charAt(0) === '/' || value.charAt(0) === '.' || value.indexOf('..') >= 0) {
            return '';
        }

        if (!value.match(/^[a-z0-9][a-z0-9_\.\/-]*$/i)) {
            return '';
        }

        return value;
    };

    var ResolveLaunchValueForSystem = function(system, definition) {

        if (IsRawGlslShaderCapableSystem(system) && definition.glslp) {
            return definition.glslp;
        }

        return definition.shader || '';
    };

    var SelectionMatchesDefinition = function(normalizedSelection, normalizedPath, definition, launchValue) {

        return SelectionValueMatches(normalizedSelection, normalizedPath, launchValue) ||
            SelectionValueMatches(normalizedSelection, normalizedPath, definition.shader) ||
            SelectionValueMatches(normalizedSelection, normalizedPath, definition.glslp);
    };

    var SelectionValueMatches = function(normalizedSelection, normalizedPath, candidate) {

        var normalizedCandidate = NormalizeSelectionValue(candidate);
        var candidatePath = NormalizePresetPath(normalizedCandidate);

        if (!normalizedCandidate && !normalizedSelection) {
            return true;
        }

        if (normalizedCandidate && normalizedCandidate === normalizedSelection) {
            return true;
        }

        return !!(normalizedPath && candidatePath && normalizedPath === candidatePath);
    };

    var NormalizeSelectionValue = function(value) {

        if (value === null || typeof value === 'undefined') {
            return '';
        }

        return String(value).trim();
    };

    var IsRawGlslShaderCapableSystem = function(system) {

        var systems;
        var systemConfig;

        if (!config.has('systems')) {
            return false;
        }

        systems = config.get('systems') || {};
        systemConfig = systems[system] || {};

        return systemConfig.emuextention === '1.22.2-stable';
    };

    var WalkShaderDirectory = function(directory, relativeDirectory) {

        var entries = [];
        var names = fs.readdirSync(directory);

        names.forEach(function(name) {
            var relativePath;
            var fullPath;
            var stat;

            if (!name || name.charAt(0) === '.') {
                return;
            }

            relativePath = relativeDirectory ? relativeDirectory + '/' + name : name;
            fullPath = path.join(directory, name);
            stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                entries = entries.concat(WalkShaderDirectory(fullPath, relativePath));
                return;
            }

            if (!stat.isFile() || !IsCompatiblePreset(relativePath)) {
                return;
            }

            entries.push(BuildPresetEntry(relativePath));
        });

        return entries;
    };

    var GroupPresetEntries = function(entries) {

        var categoryMap = {};

        entries.forEach(function(entry) {
            var firstSegment = entry.path.indexOf('/') >= 0 ? entry.path.split('/')[0] : '';
            var categoryKey = firstSegment || '_general';
            var categoryName = firstSegment ? FriendlyName(firstSegment) : 'General';

            if (!categoryMap[categoryKey]) {
                categoryMap[categoryKey] = {
                    key: categoryKey,
                    name: categoryName,
                    folder: firstSegment,
                    shaders: []
                };
            }

            entry.categoryKey = categoryKey;
            entry.category = categoryName;
            categoryMap[categoryKey].shaders.push(entry);
        });

        return categoryMap;
    };

    var BuildPresetEntry = function(relativePath) {

        relativePath = NormalizePresetPath(relativePath);

        return {
            path: relativePath,
            url: BuildPublicUrl(relativePath),
            file: path.posix.basename(relativePath),
            folder: GetPosixDirectoryName(relativePath),
            name: FriendlyName(path.posix.basename(relativePath).replace(/\.glslp$/i, '')),
            extension: '.glslp'
        };
    };

    var NormalizePresetPath = function(shaderPath) {

        var normalized;
        var parts;
        var safeParts = [];
        var i;

        if (typeof shaderPath !== 'string') {
            return null;
        }

        normalized = shaderPath.replace(/\\/g, '/').trim();
        normalized = normalized.replace(/[?#].*$/, '');
        normalized = normalized.replace(/^\.\//, '');
        normalized = normalized.replace(/^.*\/public\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^public\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^\/?shaders_glsl\//i, '');
        normalized = normalized.replace(/^\/?shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^:\/shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^:\/shaders_glsl\//i, '');

        if (!normalized || normalized.indexOf('\0') >= 0 || normalized.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return null;
        }

        while (normalized.charAt(0) === '/') {
            normalized = normalized.substr(1);
        }

        parts = normalized.split('/');

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];

            if (!part || part === '.') {
                continue;
            }

            if (part === '..' || part.charAt(0) === '.') {
                return null;
            }

            safeParts.push(part);
        }

        normalized = safeParts.join('/');

        if (!normalized || normalized.indexOf('..') >= 0) {
            return null;
        }

        return normalized;
    };

    this.NormalizePresetPath = NormalizePresetPath;

    var ResolvePresetFullPath = function(relativePath) {

        var fullPath;
        var relativeFromRoot;

        relativePath = NormalizePresetPath(relativePath);

        if (!relativePath) {
            return null;
        }

        fullPath = path.resolve(_shaderRoot, relativePath);
        relativeFromRoot = path.relative(_shaderRoot, fullPath);

        if (!relativeFromRoot || relativeFromRoot.indexOf('..') === 0 || path.isAbsolute(relativeFromRoot)) {
            return null;
        }

        return fullPath;
    };

    var BuildPublicUrl = function(relativePath) {

        return _publicShaderRoot + '/' + EncodePathSegments(relativePath);
    };

    var EncodePathSegments = function(relativePath) {

        return String(relativePath || '').split('/').map(function(part) {
            return encodeURIComponent(part);
        }).join('/');
    };

    var GetPosixDirectoryName = function(relativePath) {

        var index = relativePath.lastIndexOf('/');

        if (index < 0) {
            return '';
        }

        return relativePath.substr(0, index);
    };

    var FriendlyName = function(value) {

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
            gbaa: 'GBAA',
            xbr: 'XBR',
            xbrz: 'XBRZ',
            hqx: 'HQX',
            fsr: 'FSR',
            fxaa: 'FXAA',
            ntscjp: 'NTSC-JP'
        };

        value = String(value || '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

        if (!value) {
            return 'Shader Preset';
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

    var IsCompatiblePreset = function(relativePath) {

        return !!(relativePath && path.extname(relativePath).toLowerCase() === '.glslp');
    };

    var CompareCategories = function(a, b) {

        if (a.key === '_general') {
            return -1;
        }

        if (b.key === '_general') {
            return 1;
        }

        return a.name.localeCompare(b.name);
    };

    var CompareShaderEntries = function(a, b) {

        return a.name.localeCompare(b.name) || a.path.localeCompare(b.path);
    };

    var BuildPreferenceKey = function(system) {

        return 'systems.' + system + '.shader';
    };

    var IsKnownSystem = function(system) {

        var systems;

        if (!system || String(system).match(/[^a-z0-9_\-]/i)) {
            return false;
        }

        if (!config.has('systems')) {
            return true;
        }

        systems = config.get('systems');
        return !!(systems && Object.prototype.hasOwnProperty.call(systems, system));
    };

    var BuildError = function(message, status) {

        var err = new Error(message);
        err.status = status || 500;
        return err;
    };

})();
