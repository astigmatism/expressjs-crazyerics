'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var Read = function(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
};

var featured = Read('public/javascripts/ces.featured.js');
var suggestions = Read('public/javascripts/ces.suggestions.js');
var main = Read('public/javascripts/ces.main.js');
var collections = Read('public/javascripts/ces.collections.js');
var css = Read('public/stylesheets/style.css');
var packageJson = JSON.parse(Read('package.json'));

assert.ok(featured.indexOf('featured-collection-game collection-add-drag-source') >= 0, 'featured cards opt into the shared collection-add drag source');
assert.ok(featured.indexOf(".attr('draggable', 'false')") >= 0, 'featured cards disable native browser dragging');
assert.ok(featured.indexOf(".data('gameKey', game.gameKey)") >= 0, 'featured cards retain the canonical game key object from the cached payload');
assert.ok(suggestions.indexOf('suggestion-grid-item collection-add-drag-source') >= 0, 'suggestion cards use the same shared drag-source marker');

assert.ok(suggestions.indexOf('this.RegisterCollectionAddDragSource = function($sourceRoot)') >= 0, 'the existing suggestion gesture is exposed through a reusable source-root initializer');
assert.ok(main.indexOf("_Suggestions.RegisterCollectionAddDragSource($('#featuredCollectionsWrapper'));") >= 0, 'the persistent featured wrapper is registered once as a delegated drag root');
assert.ok(suggestions.indexOf(".on('pointerdown' + _suggestionDragNamespace, _collectionAddDragSourceSelector, StartSuggestionDragPointer)") >= 0, 'pointer drag activation is delegated through the shared source selector');
assert.ok(suggestions.indexOf(".on('mousedown' + _suggestionDragNamespace, _collectionAddDragSourceSelector, StartSuggestionDragPointer)") >= 0, 'mouse fallback activation is delegated through the same source selector');
assert.ok(suggestions.indexOf('$sourceRoot.data(\'suggestionClickSuppressorBound\', true);') >= 0, 'source-root click suppression is idempotent');
assert.ok(suggestions.indexOf('_suppressNextSuggestionClickItem && $clickedItem[0] !== _suppressNextSuggestionClickItem') >= 0, 'post-drag click suppression is scoped to the dragged card rather than featured navigation controls');
assert.ok(suggestions.indexOf('state.$sourceRoot.append($clone);') >= 0, 'the shared custom clone is attached to the source root for either region');

assert.ok(collections.indexOf('GetCollectionDragInsertionIndex(coords)') >= 0, 'the existing shelf insertion calculation remains the drop-position authority');
assert.ok(collections.indexOf('_self.AddTitleWithoutPlaying(gameKey, { source: \'suggestion-drop\' }') >= 0, 'the existing canonical collection-add request remains in use');
assert.ok(collections.indexOf('SaveManualCollectionOrder(previousOrder);') >= 0, 'the existing exact manual-order persistence remains in use');

assert.ok(css.indexOf('body.suggestion-drag-active .collection-add-drag-source') >= 0, 'active drag selection styling applies to every shared source');
assert.ok(css.indexOf('.suggestion-drag-clone .gamelink .box img') >= 0, 'the shared clone retains box-art sizing outside the suggestion grid');
assert.ok(packageJson.scripts.test.indexOf('featured-collection-drag-source.test.js') >= 0, 'the featured drag checks run through npm test');

console.log('Featured collection drag-source checks passed.');
