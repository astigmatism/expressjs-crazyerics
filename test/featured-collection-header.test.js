'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var Read = function(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
};
var CssRule = function(css, selector) {
    var escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var match = css.match(new RegExp(escapedSelector + '\\s*\\{([\\s\\S]*?)\\}'));

    assert.ok(match, selector + ' rule is present');
    return match[1];
};

var client = Read('public/javascripts/ces.featured.js');
var css = Read('public/stylesheets/ces.featured.browser.css');

var ensureStructureMatch = client.match(/var EnsureStructure = function\(\) \{([\s\S]*?)\n\};/);
assert.ok(ensureStructureMatch, 'featured browser structure builder is present');

var ensureStructure = ensureStructureMatch[1];
assert.ok(ensureStructure.indexOf('id="featuredCollectionsHeader"') >= 0, 'a dedicated featured header is created');
assert.ok(ensureStructure.indexOf(".text('Featured Collection')") >= 0, 'the compact Featured Collection label is rendered');
assert.ok(ensureStructure.indexOf('$titleRow.append($previous, $name, $next);') >= 0, 'the title is flanked directly by previous and next controls');
assert.ok(ensureStructure.indexOf('$header.append($eyebrow, $titleRow, $collectionMenu);') >= 0, 'the small label sits above the title row and its shortcut menu');
assert.ok(ensureStructure.indexOf('$wrapper.append($header, $grid);') >= 0, 'the header is placed before the game grid');
assert.ok(ensureStructure.indexOf("featuredCollectionsEyebrow featuredCollectionsName") >= 0, 'the region is labelled by the concept and collection name');
assert.strictEqual(client.indexOf('featuredCollectionsFooter'), -1, 'the former bottom footer is no longer created');
assert.ok(client.indexOf('pending.$grid.insertAfter($header);') >= 0, 'replacement grids remain below the header');

var headerRule = CssRule(css, '#featuredCollectionsHeader');
assert.ok(headerRule.indexOf('radial-gradient') >= 0, 'the header uses the site steel-blue glow motif');
assert.ok(headerRule.indexOf('linear-gradient') >= 0, 'the header fades into the game area with a gradient');
assert.strictEqual(headerRule.indexOf('border-bottom'), -1, 'there is no separator border below the header');
assert.strictEqual(headerRule.indexOf('border-top'), -1, 'there is no separator border above the header');
assert.ok(headerRule.indexOf('border: 0px;') >= 0, 'the header itself is borderless');

var eyebrowRule = CssRule(css, '#featuredCollectionsEyebrow');
assert.ok(eyebrowRule.indexOf('font-size: 10px;') >= 0, 'the Featured Collection label is deliberately smaller than the title');
assert.ok(eyebrowRule.indexOf('text-transform: uppercase;') >= 0, 'the label follows the existing collection eyebrow convention');

var titleRowRule = CssRule(css, '.featured-collections-title-row');
assert.ok(titleRowRule.indexOf('justify-content: center;') >= 0, 'the compact title-and-arrows group is centered');

var previousRule = CssRule(css, '#featuredCollectionsPrevious');
var nextRule = CssRule(css, '#featuredCollectionsNext');
assert.ok(previousRule.indexOf('margin-right: 10px;') >= 0, 'the previous control sits just left of the title');
assert.ok(nextRule.indexOf('margin-left: 10px;') >= 0, 'the next control sits just right of the title');
assert.strictEqual(css.indexOf('justify-self: start'), -1, 'the previous control is no longer pinned to the far edge');
assert.strictEqual(css.indexOf('justify-self: end'), -1, 'the next control is no longer pinned to the far edge');
assert.strictEqual(css.indexOf('#featuredCollectionsFooter'), -1, 'footer styling has been fully removed');

console.log('Featured collection header checks passed.');
