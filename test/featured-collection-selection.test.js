'use strict';

const assert = require('assert');
const selection = require('../public/javascripts/ces.featured.selection');

function closeTo(actual, expected, message) {
    assert.ok(Math.abs(actual - expected) < 1e-12, message + ': expected ' + expected + ', got ' + actual);
}

(function testEqualWeights() {
    const distribution = selection.buildWeightedRanges([{ weight: 1 }, { weight: 1 }]);
    assert.strictEqual(distribution.total, 2);
    closeTo(distribution.ranges[0].probability, 0.5, 'first equal weight probability');
    closeTo(distribution.ranges[1].probability, 0.5, 'second equal weight probability');
    assert.strictEqual(selection.chooseIndex([{ weight: 1 }, { weight: 1 }], () => 0.49), 0);
    assert.strictEqual(selection.chooseIndex([{ weight: 1 }, { weight: 1 }], () => 0.5), 1);
}());

(function testOneOneTwoRanges() {
    const distribution = selection.buildWeightedRanges([{ weight: 1 }, { weight: 1 }, { weight: 2 }]);
    assert.strictEqual(distribution.total, 4);
    closeTo(distribution.ranges[0].probability, 0.25, 'first 1/1/2 probability');
    closeTo(distribution.ranges[1].probability, 0.25, 'second 1/1/2 probability');
    closeTo(distribution.ranges[2].probability, 0.5, 'third 1/1/2 probability');
    assert.strictEqual(selection.chooseIndex([{ weight: 1 }, { weight: 1 }, { weight: 2 }], () => 0.249999), 0);
    assert.strictEqual(selection.chooseIndex([{ weight: 1 }, { weight: 1 }, { weight: 2 }], () => 0.25), 1);
    assert.strictEqual(selection.chooseIndex([{ weight: 1 }, { weight: 1 }, { weight: 2 }], () => 0.5), 2);
}());

(function testDecimalWeights() {
    const distribution = selection.buildWeightedRanges([{ weight: '0.5' }, { weight: '1.5' }]);
    assert.strictEqual(distribution.total, 2);
    closeTo(distribution.ranges[0].probability, 0.25, 'decimal first probability');
    closeTo(distribution.ranges[1].probability, 0.75, 'decimal second probability');
}());

(function testMissingWeightDefaultsToOne() {
    assert.strictEqual(selection.normalizeWeight(undefined), 1);
    assert.strictEqual(selection.normalizeWeight(null), 1);
    assert.strictEqual(selection.normalizeWeight(''), 1);
    const distribution = selection.buildWeightedRanges([{}, { weight: 2 }]);
    closeTo(distribution.ranges[0].probability, 1 / 3, 'missing weight probability');
    closeTo(distribution.ranges[1].probability, 2 / 3, 'explicit weight probability');
}());

(function testMalformedWeightsDoNotBreakSelection() {
    const malformed = [
        { weight: 'not-a-number' },
        { weight: NaN },
        { weight: Infinity },
        { weight: -5 },
        { weight: 0 },
        { weight: 101 }
    ];
    const distribution = selection.buildWeightedRanges(malformed);
    assert.strictEqual(distribution.uniformFallback, true);
    assert.strictEqual(distribution.total, malformed.length);
    distribution.ranges.forEach((range) => closeTo(range.probability, 1 / malformed.length, 'uniform fallback probability'));
    assert.doesNotThrow(() => selection.chooseIndex(malformed, () => NaN));
    assert.strictEqual(selection.chooseIndex(malformed, () => 0), 0);
    assert.strictEqual(selection.chooseIndex(malformed, () => 0.999999), malformed.length - 1);
}());

(function testMixedInvalidAndValidWeights() {
    const distribution = selection.buildWeightedRanges([{ weight: 'bad' }, { weight: 2 }]);
    assert.strictEqual(distribution.uniformFallback, false);
    assert.strictEqual(distribution.ranges[0].probability, 0);
    assert.strictEqual(distribution.ranges[1].probability, 1);
    assert.strictEqual(selection.chooseIndex([{ weight: 'bad' }, { weight: 2 }], () => 0), 1);
}());

(function testEmptyAndSingleCollections() {
    assert.strictEqual(selection.chooseIndex([]), -1);
    assert.strictEqual(selection.choose([], () => 0.5), null);

    const only = { id: 42, weight: 'bad' };
    [0, 0.25, 0.999999, NaN].forEach((random) => {
        assert.strictEqual(selection.chooseIndex([only], () => random), 0);
        assert.strictEqual(selection.choose([only], () => random), only);
    });
}());

console.log('featured collection weighted-selection tests passed');
