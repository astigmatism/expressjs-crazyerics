/*
 * Shared weighted-selection helpers for the public featured collection browser.
 * Missing weights use the application default of 1. Invalid runtime values are
 * neutralized to 0; if no positive weights remain, selection falls back to a
 * uniform distribution across the eligible collections.
 */
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }
    else {
        root.cesFeaturedSelection = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    'use strict';

    var DEFAULT_WEIGHT = 1;
    var MAX_WEIGHT = 100;
    var NUMBER_PATTERN = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))$/;

    var IsMissingWeight = function(value) {
        return value === null || typeof value === 'undefined' || (typeof value === 'string' && value.trim() === '');
    };

    var ParseStrictNumber = function(value) {

        if (typeof value === 'number') {
            return isFinite(value) ? value : null;
        }

        if (typeof value !== 'string') {
            return null;
        }

        value = value.trim();

        if (!NUMBER_PATTERN.test(value)) {
            return null;
        }

        value = parseFloat(value);

        return isFinite(value) ? value : null;
    };

    var NormalizeWeight = function(value) {

        if (IsMissingWeight(value)) {
            return DEFAULT_WEIGHT;
        }

        value = ParseStrictNumber(value);

        if (value === null || value <= 0 || value > MAX_WEIGHT) {
            return 0;
        }

        return Math.round(value * 10000) / 10000;
    };

    var BuildWeightedRanges = function(collections) {

        collections = Array.isArray(collections) ? collections : [];

        var weights = [];
        var total = 0;
        var i;

        for (i = 0; i < collections.length; ++i) {
            var weight = NormalizeWeight(collections[i] && collections[i].weight);
            weights.push(weight);
            total += weight;
        }

        var uniformFallback = total <= 0 && collections.length > 0;

        if (uniformFallback) {
            total = collections.length;
            for (i = 0; i < weights.length; ++i) {
                weights[i] = 1;
            }
        }

        var ranges = [];
        var cursor = 0;

        for (i = 0; i < collections.length; ++i) {
            var start = cursor;
            cursor += weights[i];

            ranges.push({
                index: i,
                weight: weights[i],
                start: start,
                end: cursor,
                probability: total > 0 ? weights[i] / total : 0
            });
        }

        return {
            total: total,
            ranges: ranges,
            uniformFallback: uniformFallback
        };
    };

    var NormalizeRandomValue = function(value) {

        if (typeof value !== 'number' || !isFinite(value)) {
            return 0;
        }

        if (value <= 0) {
            return 0;
        }

        if (value >= 1) {
            return 0.9999999999999999;
        }

        return value;
    };

    var ChooseIndex = function(collections, opt_random) {

        collections = Array.isArray(collections) ? collections : [];

        if (!collections.length) {
            return -1;
        }

        if (collections.length === 1) {
            return 0;
        }

        var distribution = BuildWeightedRanges(collections);

        if (!distribution.total || !distribution.ranges.length) {
            return -1;
        }

        var random = typeof opt_random === 'function' ? opt_random() : Math.random();
        var target = NormalizeRandomValue(random) * distribution.total;

        for (var i = 0; i < distribution.ranges.length; ++i) {
            if (distribution.ranges[i].weight > 0 && target < distribution.ranges[i].end) {
                return distribution.ranges[i].index;
            }
        }

        return distribution.ranges[distribution.ranges.length - 1].index;
    };

    var Choose = function(collections, opt_random) {
        var index = ChooseIndex(collections, opt_random);
        return index < 0 ? null : collections[index];
    };

    return {
        defaultWeight: DEFAULT_WEIGHT,
        maxWeight: MAX_WEIGHT,
        normalizeWeight: NormalizeWeight,
        buildWeightedRanges: BuildWeightedRanges,
        chooseIndex: ChooseIndex,
        choose: Choose
    };
}));
