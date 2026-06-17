var cesVisualStyles = new (function() {

    var self = this;

    var PIXEL_PERFECT_ID = 'pixel-perfect';
    var PIXEL_PERFECT_TITLE = 'Pixel Perfect';

    this.GetForSystem = function(config, system) {

        var looks = [];
        var seen = {};

        AddLook(looks, seen, BuildPixelPerfectLook(), 'system');
        AddShaderDefinitions(looks, seen, GetSystemShaderDefinitions(config, system), 'system');
        DisambiguateDuplicateTitles(looks);

        return looks;
    };

    this.GetForDisplayStyleSlider = function(config, system) {

        var looks = [];
        var seen = {};

        AddLook(looks, seen, BuildPixelPerfectLook(), 'display');
        AddShaderDefinitions(looks, seen, GetSystemShaderDefinitions(config, system), 'display-system');
        AddShaderDefinitions(looks, seen, GetConfiguredShaderDefinitions(config), 'display-configured');
        DisambiguateDuplicateTitles(looks);

        return looks;
    };

    this.GetConfiguredLooks = function(config) {

        var looks = [];
        var seen = {};

        AddShaderDefinitions(looks, seen, GetConfiguredShaderDefinitions(config), 'configured');
        DisambiguateDuplicateTitles(looks);

        return looks;
    };

    this.BuildPixelPerfectLook = BuildPixelPerfectLook;

    this.NormalizeShaderDefinition = NormalizeShaderDefinition;

    this.ResolveLaunchValueForSystem = function(config, system, look) {

        if (!look || look.isPixelPerfect) {
            return '';
        }

        if (self.IsRawGlslShaderCapableSystem(config, system) && look.glslp) {
            return look.glslp;
        }

        return look.shader || look.glslp || '';
    };

    this.FindLookForSelection = function(config, system, selection) {

        var looks = self.GetForDisplayStyleSlider(config, system);
        var normalizedSelection = NormalizeSelection(selection);
        var normalizedPath = NormalizeShaderPath(normalizedSelection);
        var i;

        if (!normalizedSelection) {
            return looks[0];
        }

        for (i = 0; i < looks.length; i++) {
            var look = looks[i];
            var launchValue = NormalizeSelection(self.ResolveLaunchValueForSystem(config, system, look));
            var shaderValue = NormalizeSelection(look.shader);
            var presetValue = NormalizeSelection(look.glslp);

            if (normalizedSelection === launchValue || normalizedSelection === shaderValue || normalizedSelection === presetValue) {
                return look;
            }

            if (normalizedPath && (NormalizeShaderPath(launchValue) === normalizedPath || NormalizeShaderPath(shaderValue) === normalizedPath || NormalizeShaderPath(presetValue) === normalizedPath)) {
                return look;
            }
        }

        return null;
    };

    this.GetDisplayNameForSelection = function(config, system, selection) {

        var look = self.FindLookForSelection(config, system, selection);
        var normalizedPath;

        if (look) {
            return look.title;
        }

        if (!selection) {
            return PIXEL_PERFECT_TITLE;
        }

        normalizedPath = NormalizeShaderPath(selection);

        if (normalizedPath) {
            return FriendlyName(normalizedPath.replace(/\.glslp$/i, '').split('/').pop());
        }

        return FriendlyName(selection);
    };

    this.GetPreviewFallbackSrc = function(config, look) {

        var imageRoot = (config && config.paths && config.paths.images) ? config.paths.images : '';
        var shader = GetPreviewShaderKey(look);

        if (!shader) {
            return imageRoot + '/shaders/pixels.png';
        }

        return imageRoot + '/shaders/' + shader + '.png';
    };

    this.NormalizeShaderPath = NormalizeShaderPath;

    this.IsPixelPerfectSelection = function(selection) {
        return NormalizeSelection(selection) === '';
    };

    this.IsRawGlslShaderCapableSystem = function(config, system) {

        var systemDetails = GetSystemDetails(config, system) || {};
        return systemDetails.emuextention === '1.22.2-stable';
    };

    this.FriendlyName = FriendlyName;

    function BuildPixelPerfectLook() {

        return {
            id: PIXEL_PERFECT_ID,
            title: PIXEL_PERFECT_TITLE,
            name: PIXEL_PERFECT_TITLE,
            shader: '',
            glslp: null,
            isPixelPerfect: true
        };
    }

    function GetSystemShaderDefinitions(config, system) {

        var systemDetails = GetSystemDetails(config, system) || {};
        return systemDetails.recommendedshaders || [];
    }

    function GetConfiguredShaderDefinitions(config) {

        var configured = config && config.displaystyles && config.displaystyles.configured ? config.displaystyles.configured : null;
        var systemDetails;
        var result = [];
        var seen = {};

        if (Array.isArray(configured)) {
            return configured;
        }

        systemDetails = config && config.systemdetails ? config.systemdetails : {};

        Object.keys(systemDetails).forEach(function(system) {
            var definitions = GetConfiguredShaderDefinitionsForSystem(systemDetails[system] || {});
            var i;

            for (i = 0; i < definitions.length; i++) {
                var look = NormalizeShaderDefinition(definitions[i], i, system);
                var key;

                if (!look) {
                    continue;
                }

                key = GetLookKey(look);

                if (!key || seen[key]) {
                    continue;
                }

                seen[key] = true;
                result.push(look);
            }
        });

        return result;
    }

    function GetConfiguredShaderDefinitionsForSystem(systemDetails) {

        var result = [];
        var recommended = systemDetails.recommendedshaders || [];
        var workaround = systemDetails.browserWorkarounds && systemDetails.browserWorkarounds.postStartupShaderReapply ? systemDetails.browserWorkarounds.postStartupShaderReapply : null;
        var presets = workaround && Array.isArray(workaround.presets) ? workaround.presets : [];
        var title = StripLabelSuffix(NormalizeTitle(workaround ? workaround.label || null : null));
        var i;

        if (Array.isArray(recommended)) {
            result = result.concat(recommended);
        }

        for (i = 0; i < presets.length; i++) {
            result.push({
                title: title,
                glslp: presets[i]
            });
        }

        return result;
    }

    function AddShaderDefinitions(looks, seen, definitions, idPrefix) {

        var i;

        if (!Array.isArray(definitions)) {
            return;
        }

        for (i = 0; i < definitions.length; i++) {
            AddLook(looks, seen, NormalizeShaderDefinition(definitions[i], i), idPrefix);
        }
    }

    function AddLook(looks, seen, look, idPrefix) {

        var key;
        var copy;

        if (!look) {
            return;
        }

        key = GetLookKey(look);

        if (!key || seen[key]) {
            return;
        }

        copy = (typeof $ !== 'undefined' && $.extend) ? $.extend({}, look) : CloneLook(look);

        if (!copy.id || copy.id.indexOf('pending') >= 0) {
            copy.id = copy.isPixelPerfect ? PIXEL_PERFECT_ID : (idPrefix || 'look') + '-' + looks.length;
        }

        seen[key] = true;
        looks.push(copy);
    }

    function CloneLook(look) {

        var result = {};
        var key;

        for (key in look) {
            if (Object.prototype.hasOwnProperty.call(look, key)) {
                result[key] = look[key];
            }
        }

        return result;
    }

    function NormalizeShaderDefinition(shaderDefinition, index, sourceSystem) {

        var shader;
        var glslp;
        var title;
        var rawGlslp;
        var sourceValue;

        if (!shaderDefinition) {
            return null;
        }

        if (typeof shaderDefinition === 'string') {
            sourceValue = shaderDefinition;
            glslp = NormalizeShaderPath(shaderDefinition) || null;
            shader = glslp || NormalizeShaderValue(shaderDefinition);
            title = BuildTitle(shader, glslp, sourceValue);
        }
        else {
            rawGlslp = shaderDefinition.glslp || shaderDefinition.preset || shaderDefinition.path || shaderDefinition.rawglsl || shaderDefinition.rawGlsl || shaderDefinition.raw_glsl || null;
            glslp = NormalizeShaderPath(rawGlslp) || null;

            if (rawGlslp && !glslp) {
                return null;
            }

            shader = NormalizeShaderValue(shaderDefinition.shader || glslp || '');

            if (!shader && glslp) {
                shader = glslp;
            }

            title = NormalizeTitle(shaderDefinition.title || shaderDefinition.name || null) || BuildTitle(shader, glslp, null);
            sourceSystem = shaderDefinition.sourceSystem || sourceSystem || null;
        }

        if (!shader && !glslp) {
            return null;
        }

        return {
            id: 'curated-look-pending-' + (index || 0),
            title: title,
            name: title,
            shader: shader || '',
            glslp: glslp,
            isPixelPerfect: false,
            sourceSystem: sourceSystem || null
        };
    }

    function NormalizeShaderValue(value) {

        value = String(value || '').replace(/\\/g, '/').trim();

        if (!value || value.indexOf('\0') >= 0 || value.match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return '';
        }

        if (value.match(/\.glslp$/i)) {
            return NormalizeShaderPath(value) || '';
        }

        if (value.charAt(0) === '/' || value.charAt(0) === '.' || value.indexOf('..') >= 0) {
            return '';
        }

        if (!value.match(/^[a-z0-9][a-z0-9_./-]*$/i)) {
            return '';
        }

        return value;
    }

    function GetLookKey(look) {

        var normalizedPath;

        if (!look) {
            return null;
        }

        if (look.isPixelPerfect) {
            return 'pixel-perfect';
        }

        normalizedPath = NormalizeShaderPath(look.glslp || look.shader || '');

        if (normalizedPath) {
            return 'glslp:' + normalizedPath.toLowerCase();
        }

        if (look.shader) {
            return 'shader:' + String(look.shader).toLowerCase();
        }

        return null;
    }

    function GetPreviewShaderKey(look) {

        var shader = look ? look.previewShader || look.preview || look.shader || '' : '';

        if (!shader || NormalizeShaderPath(shader)) {
            return '';
        }

        if (String(shader).indexOf('..') >= 0 || String(shader).match(/^[a-z][a-z0-9+.-]*:\/\//i)) {
            return '';
        }

        return shader;
    }

    function DisambiguateDuplicateTitles(looks) {

        var counts = {};
        var used = {};
        var i;

        for (i = 0; i < looks.length; i++) {
            var countKey = NormalizeTitleKey(looks[i].title);
            counts[countKey] = (counts[countKey] || 0) + 1;
        }

        for (i = 0; i < looks.length; i++) {
            var look = looks[i];
            var titleKey = NormalizeTitleKey(look.title);
            var candidate = look.title;
            var descriptor;
            var suffix = 2;

            if (counts[titleKey] > 1 && used[titleKey]) {
                descriptor = GetLookDescriptor(look);
                candidate = look.title + (descriptor ? ' (' + descriptor + ')' : '');

                while (used[NormalizeTitleKey(candidate)]) {
                    candidate = look.title + (descriptor ? ' (' + descriptor + ' ' + suffix + ')' : ' (' + suffix + ')');
                    suffix++;
                }

                look.title = candidate;
                look.name = candidate;
                titleKey = NormalizeTitleKey(candidate);
            }

            used[titleKey] = true;
        }
    }

    function GetLookDescriptor(look) {

        var normalizedPath = NormalizeShaderPath(look.glslp || look.shader || '');
        var value = normalizedPath || look.shader || '';

        if (normalizedPath) {
            value = normalizedPath.replace(/\.glslp$/i, '').split('/').pop();
        }

        value = FriendlyName(value);

        if (NormalizeTitleKey(value) === NormalizeTitleKey(look.title)) {
            return '';
        }

        return value;
    }

    function NormalizeTitleKey(value) {

        return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function NormalizeTitle(value) {

        value = String(value || '').replace(/\s+/g, ' ').trim();
        return value || null;
    }

    function StripLabelSuffix(value) {

        value = NormalizeTitle(value);

        if (!value) {
            return null;
        }

        return value.replace(/\s+shader$/i, '').replace(/\s+display\s+style$/i, '').trim() || value;
    }

    function BuildTitle(shader, glslp, fallback) {

        var value = glslp || shader || fallback || 'Display Style';

        if (value.match(/\.glslp$/i)) {
            value = value.replace(/\.glslp$/i, '').split('/').pop();
        }

        return FriendlyName(value);
    }

    function GetSystemDetails(config, system) {

        if (config && config.systemdetails && system && config.systemdetails[system]) {
            return config.systemdetails[system];
        }

        return null;
    }

    function NormalizeSelection(selection) {

        if (selection === null || typeof selection === 'undefined') {
            return '';
        }

        return String(selection);
    }

    function NormalizeShaderPath(path) {

        var normalized;
        var parts;
        var safe = [];
        var i;

        if (typeof path !== 'string') {
            return '';
        }

        normalized = path.replace(/\\/g, '/').trim();
        normalized = normalized.replace(/[?#].*$/, '');
        normalized = normalized.replace(/^\.\//, '');
        normalized = normalized.replace(/^.*\/public\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^public\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^\/?shaders_glsl\//i, '');
        normalized = normalized.replace(/^\/?shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^:\/shaders\/shaders_glsl\//i, '');
        normalized = normalized.replace(/^:\/shaders_glsl\//i, '');

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
                return '';
            }

            safe.push(part);
        }

        normalized = safe.join('/');
        return normalized.match(/\.glslp$/i) ? normalized : '';
    }

    function FriendlyName(value) {

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
            dmg: 'DMG',
            ngpc: 'NGPC',
            xbr: 'XBR',
            xbrz: 'XBRZ',
            hqx: 'HQX',
            fsr: 'FSR',
            fxaa: 'FXAA'
        };

        value = String(value || '').replace(/[_\-\/]+/g, ' ').replace(/\s+/g, ' ').trim();

        if (!value) {
            return PIXEL_PERFECT_TITLE;
        }

        return value.split(' ').map(function(part) {
            var lower = part.toLowerCase();
            var acronymMatch = lower.match(/^(crt|lcd|xbrz|xbr|hqx)(\d.*)$/);

            if (acronyms[lower]) {
                return acronyms[lower];
            }

            if (acronymMatch && acronyms[acronymMatch[1]]) {
                return acronyms[acronymMatch[1]] + acronymMatch[2].toUpperCase();
            }

            if (part.match(/^\d+x?$/i)) {
                return part.toUpperCase();
            }

            return part.charAt(0).toUpperCase() + part.substr(1);
        }).join(' ');
    }

    return this;
})();
