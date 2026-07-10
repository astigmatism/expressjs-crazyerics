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
var packageJson = JSON.parse(Read('package.json'));

var hoverRule = CssRule(css, '.featured-collections-nav:hover');
assert.ok(hoverRule.indexOf('rgba(125,166,207,0.48)') >= 0, 'hover uses the site steel-blue accent');
assert.ok(hoverRule.indexOf('rgba(81,97,112,0.46)') >= 0, 'hover uses the site slate button surface');
assert.strictEqual(hoverRule.indexOf('143,219,70'), -1, 'hover no longer uses the green accent');
assert.strictEqual(css.indexOf('.featured-collections-nav:hover,\n.featured-collections-nav:focus'), -1, 'mouse hover and persistent focus are no longer coupled');

var focusRule = CssRule(css, '.featured-collections-nav:focus');
assert.ok(focusRule.indexOf('outline: 1px dotted') >= 0, 'keyboard fallback focus remains visible');
assert.strictEqual(focusRule.indexOf('background:'), -1, 'plain focus does not leave a filled highlight behind');

var focusVisibleRule = CssRule(css, '.featured-collections-nav:focus-visible');
assert.ok(focusVisibleRule.indexOf('rgba(125,166,207,0.54)') >= 0, 'keyboard-visible focus uses the steel-blue palette');
assert.ok(focusVisibleRule.indexOf('outline: 1px dotted') >= 0, 'keyboard-visible focus has a clear outline');

var activeRule = CssRule(css, '.featured-collections-nav:active');
assert.ok(activeRule.indexOf('translateY(1px) scale(0.94)') >= 0, 'pressing the arrow visibly depresses it');
assert.ok(activeRule.indexOf('inset 0px 2px 4px') >= 0, 'the pressed state uses an inset shadow');
assert.ok(activeRule.indexOf('rgba(42,86,126,0.34)') >= 0, 'the pressed state remains within the blue/slate palette');

var bindingMatch = client.match(/var BindNavigationControl = function\(\$control, offset\) \{([\s\S]*?)\n\};/);
assert.ok(bindingMatch, 'navigation controls share a dedicated binding helper');
var binding = bindingMatch[1];
assert.ok(binding.indexOf('pointerdown.cesFeaturedBrowser') >= 0, 'pointer activation is tracked');
assert.ok(binding.indexOf("keydown.cesFeaturedBrowser") >= 0, 'keyboard activation is kept distinct');
assert.ok(binding.indexOf('if (pointerActivated && this.blur)') >= 0, 'pointer focus is released after activation');
assert.ok(binding.indexOf('this.blur();') >= 0, 'a clicked arrow cannot retain the highlighted focus state');
assert.ok(client.indexOf('BindNavigationControl($previous, -1);') >= 0, 'the previous arrow uses the shared behavior');
assert.ok(client.indexOf('BindNavigationControl($next, 1);') >= 0, 'the next arrow uses the shared behavior');
assert.ok(packageJson.scripts.test.indexOf('featured-collection-navigation-controls.test.js') >= 0, 'the refinement checks run through npm test');

console.log('Featured collection navigation-control checks passed.');
