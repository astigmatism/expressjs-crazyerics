'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var Read = function(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
};

var client = Read('public/javascripts/ces.featured.js');
var css = Read('public/stylesheets/ces.featured.browser.css');

assert.ok(client.indexOf('var _pendingRender = null;') >= 0, 'a pending detached render is tracked');
assert.ok(client.indexOf('imageLoader.always(MarkImagesSettled);') >= 0, 'incoming box art is preloaded before the preferred navigation swap');
assert.ok(client.indexOf('var canPreserveCurrentGrid = preserveCurrentGrid === true') >= 0, 'navigation can keep the current grid visible while loading');
assert.ok(client.indexOf('RenderActiveCollection({ preserveCurrentGrid: true });') >= 0, 'arrow navigation opts into the stable transition path');
assert.ok(client.indexOf('Math.max(startingHeight, naturalHeight)') >= 0, 'an unsettled incoming grid cannot collapse below the outgoing grid height');
assert.ok(client.indexOf('MeasureNaturalGridHeight') >= 0, 'the destination grid height is measured before release');
assert.ok(client.indexOf('AnimateGridHeight') >= 0, 'height changes use the dedicated transition helper');
assert.ok(client.indexOf('SettleCommittedRender') >= 0, 'the locked height is released after media settles');
assert.ok(client.indexOf('_navigationPreloadTimeout = 700') >= 0, 'preloading has a bounded navigation delay');
assert.ok(client.indexOf('_mediaHardSettleTimeout = 2600') >= 0, 'slow or stalled media cannot hold the grid height indefinitely');

var navigateMatch = client.match(/var Navigate = function\(offset\) \{([\s\S]*?)\n\};/);
assert.ok(navigateMatch, 'navigation function is present');
assert.strictEqual(navigateMatch[1].indexOf('_Sync.'), -1, 'arrow navigation still makes no featured-data request');

assert.ok(css.indexOf('min-height: 120px;') >= 0, 'the grid retains a baseline footprint before media dimensions are available');
assert.ok(css.indexOf('#featuredCollectionsGrid.featured-collections-grid-transition') >= 0, 'height and opacity transition styling is present');
assert.ok(css.indexOf('transition: height 240ms') >= 0, 'height changes are eased rather than snapped');
assert.ok(css.indexOf('#featuredCollectionsWrapper.featured-collections-is-loading > #featuredCollectionsGrid') >= 0, 'the outgoing grid receives a restrained loading treatment');
assert.ok(css.indexOf('@media (prefers-reduced-motion: reduce)') >= 0, 'reduced-motion behavior remains supported');
assert.ok(css.indexOf('#featuredCollectionsGrid.featured-collections-grid-transition,') >= 0, 'reduced-motion disables the new grid transition');

console.log('Featured collection transition checks passed.');
