'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var Read = function(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
};
var FunctionBody = function(source, name, signature) {
    var expression = new RegExp('var ' + name + ' = function\\(' + signature + '\\) \\{([\\s\\S]*?)\\n\\};');
    var match = source.match(expression);

    assert.ok(match, name + ' function is present');
    return match[1];
};
var CssRule = function(css, selector) {
    var escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var match = css.match(new RegExp(escapedSelector + '\\s*\\{([\\s\\S]*?)\\}'));

    assert.ok(match, selector + ' rule is present');
    return match[1];
};

var client = Read('public/javascripts/ces.featured.js');
var css = Read('public/stylesheets/ces.featured.browser.css');
var siteCss = Read('public/stylesheets/style.css');
var packageJson = JSON.parse(Read('package.json'));

var ensureStructure = FunctionBody(client, 'EnsureStructure', '');
assert.ok(ensureStructure.indexOf('<button id="featuredCollectionsName"') >= 0, 'the displayed collection title is a native button');
assert.ok(ensureStructure.indexOf('aria-haspopup="menu"') >= 0, 'the title exposes its menu relationship');
assert.ok(ensureStructure.indexOf('aria-expanded="false"') >= 0, 'the title starts in the collapsed state');
assert.ok(ensureStructure.indexOf('aria-controls="featuredCollectionsMenu"') >= 0, 'the title points to the shortcut menu');
assert.ok(ensureStructure.indexOf('id="featuredCollectionsMenu"') >= 0, 'a dedicated featured collection shortcut menu is created');
assert.ok(ensureStructure.indexOf('role="menu"') >= 0, 'the shortcut container has menu semantics');
assert.ok(ensureStructure.indexOf('aria-orientation="vertical"') >= 0, 'the shortcut menu explicitly identifies its vertical orientation');
assert.ok(ensureStructure.indexOf("$header.append($eyebrow, $titleRow, $collectionMenu);") >= 0, 'the shortcut menu is anchored to the existing featured header');
assert.ok(ensureStructure.indexOf('BindCollectionMenu();') >= 0, 'the menu behavior is bound during structure creation');

var buildMenu = FunctionBody(client, 'BuildCollectionMenu', '');
assert.ok(buildMenu.indexOf('var displayedCollectionIndex = GetDisplayedCollectionIndex();') >= 0, 'the menu is based on the collection currently visible to the user');
assert.ok(buildMenu.indexOf('for (var offset = 1') >= 0, 'the current featured collection is omitted from the list');
assert.ok(buildMenu.indexOf('(displayedCollectionIndex + offset) % len') >= 0, 'shortcut order follows the same wrap-around order as arrow navigation');
assert.ok(buildMenu.indexOf('class="featured-collections-menu-item noselect" role="menuitem"') >= 0, 'every shortcut is a keyboard-capable button menu item');
assert.ok(buildMenu.indexOf('.text(collection.name)') >= 0, 'collection names are inserted as text rather than HTML');

var selectCollection = FunctionBody(client, 'SelectCollectionAtIndex', 'index');
assert.ok(selectCollection.indexOf('_activeCollectionIndex = index;') >= 0, 'a shortcut changes the active collection directly');
assert.ok(selectCollection.indexOf('RenderActiveCollection({ preserveCurrentGrid: true });') >= 0, 'shortcut selection retains the stable-height transition path');
assert.strictEqual(selectCollection.indexOf('_Sync.'), -1, 'shortcut selection makes no featured-data request');
assert.strictEqual(selectCollection.indexOf('_baseUrl'), -1, 'shortcut selection is entirely local');

var bindMenu = FunctionBody(client, 'BindCollectionMenu', '');
assert.ok(bindMenu.indexOf('ToggleCollectionMenu(keyboardActivated);') >= 0, 'clicking the title toggles the shortcut list');
assert.ok(bindMenu.indexOf("'.featured-collections-menu-item'") >= 0, 'menu item activation is delegated safely');
assert.ok(bindMenu.indexOf('SelectCollectionAtIndex') >= 0, 'menu item activation uses direct selection');
assert.ok(bindMenu.indexOf('key === 27') >= 0, 'Escape closes the menu');
assert.ok(bindMenu.indexOf('key === 38') >= 0 && bindMenu.indexOf('key === 40') >= 0, 'Up and Down arrows move through the list');
assert.ok(bindMenu.indexOf('key === 36') >= 0 && bindMenu.indexOf('key === 35') >= 0, 'Home and End reach the first and last shortcuts');
assert.ok(bindMenu.indexOf('cesFeaturedCollectionMenu') >= 0, 'outside-pointer closing uses a namespaced document handler');
assert.ok(bindMenu.indexOf("closest('#featuredCollectionsName, #featuredCollectionsMenu')") >= 0, 'clicks on the title or menu do not close it prematurely');

var updateControls = FunctionBody(client, 'UpdateNavigationControls', '');
assert.ok(updateControls.indexOf("$name\n        .prop('disabled', !hasMultiple)") >= 0, 'the title shortcut is disabled when there is no alternative collection');
assert.ok(updateControls.indexOf("Browse featured collections. Current collection:") >= 0, 'the title has an explicit accessible action label');
assert.ok(updateControls.indexOf('CloseCollectionMenu({ immediate: true });') >= 0, 'an empty shortcut set cannot leave an open menu behind');

var nameRule = CssRule(css, '#featuredCollectionsName');
assert.ok(nameRule.indexOf('cursor: pointer;') >= 0, 'the title visibly behaves as an interactive control');
assert.ok(nameRule.indexOf("font-family: 'Poppins', sans-serif;") >= 0, 'the existing featured title typography is retained');

var nameHoverRule = CssRule(css, '#featuredCollectionsName:hover,\n#featuredCollectionsName.featured-collections-name-open');
assert.ok(nameHoverRule.indexOf('rgba(125,166,207,0.32)') >= 0, 'title hover/open state uses the site steel-blue accent');
assert.strictEqual(nameHoverRule.indexOf('143,219,70'), -1, 'the title interaction does not introduce the old green accent');

var menuRule = CssRule(css, '#featuredCollectionsMenu');
assert.ok(menuRule.indexOf('position: absolute;') >= 0, 'the shortcut list overlays the grid instead of changing its height');
assert.ok(menuRule.indexOf('left: 50%;') >= 0, 'the shortcut list is centered beneath the title area');
assert.ok(menuRule.indexOf('max-height: 300px;') >= 0, 'large shortcut sets are height bounded');
assert.ok(menuRule.indexOf('overflow-y: auto;') >= 0, 'large shortcut sets remain usable by scrolling');
assert.ok(menuRule.indexOf('rgba(13,20,28,0.98)') >= 0, 'the menu uses the site dark upper gradient tone');
assert.ok(menuRule.indexOf('rgba(8,13,19,0.98)') >= 0, 'the menu uses the site dark lower gradient tone');
assert.ok(menuRule.indexOf('rgba(125,166,207,0.24)') >= 0, 'the menu uses the site steel-blue border tone');
assert.ok(siteCss.indexOf('rgba(13,20,28,0.98)') >= 0 && siteCss.indexOf('rgba(8,13,19,0.98)') >= 0, 'the selected gradient tones are already used by Crazyerics collection menus');

var menuItemRule = CssRule(css, '.featured-collections-menu-item');
assert.ok(menuItemRule.indexOf('display: block;') >= 0, 'shortcuts form a vertical list');
assert.ok(menuItemRule.indexOf('width: 100%;') >= 0, 'each shortcut occupies its own row');
assert.ok(menuItemRule.indexOf('text-align: center;') >= 0, 'shortcut text is center aligned');
assert.ok(menuItemRule.indexOf('white-space: normal;') >= 0, 'long collection names can wrap instead of overflowing');

var openRule = CssRule(css, '#featuredCollectionsMenu.featured-collections-menu-open');
assert.ok(openRule.indexOf('opacity: 1;') >= 0, 'the open menu becomes visible');
assert.ok(openRule.indexOf('pointer-events: auto;') >= 0, 'the open menu becomes interactive');
assert.ok(css.indexOf('@media (prefers-reduced-motion: reduce)') >= 0, 'the shortcut transition respects reduced-motion preferences');
assert.ok(css.indexOf('    #featuredCollectionsMenu,') >= 0, 'reduced-motion handling explicitly includes the shortcut menu');
assert.ok(packageJson.scripts.test.indexOf('featured-collection-shortcut-menu.test.js') >= 0, 'the shortcut regression checks run through npm test');

console.log('Featured collection shortcut-menu checks passed.');
