!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.BrowserFS=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(b,c,d){!function(){function b(){}function d(a){var b=!1;return function(){if(b)throw new Error("Callback was already called.");b=!0,a.apply(this,arguments)}}function e(a){var b=!1;return function(){b||(b=!0,a.apply(this,arguments))}}function f(a){return K(a)||"number"==typeof a.length&&a.length>=0&&a.length%1===0}function g(a,b){return f(a)?h(a,b):l(a,b)}function h(a,b){for(var c=-1,d=a.length;++c<d;)b(a[c],c,a)}function i(a,b){for(var c=-1,d=a.length,e=Array(d);++c<d;)e[c]=b(a[c],c,a);return e}function j(a){return i(Array(a),function(a,b){return b})}function k(a,b,c){return h(a,function(a,d,e){c=b(c,a,d,e)}),c}function l(a,b){h(L(a),function(c){b(a[c],c)})}function m(a){var b,c,d=-1;return f(a)?(b=a.length,function(){return d++,b>d?d:null}):(c=L(a),b=c.length,function(){return d++,b>d?c[d]:null})}function n(a,b){b=b||0;var c=-1,d=a.length;b&&(d-=b,d=0>d?0:d);for(var e=Array(d);++c<d;)e[c]=a[c+b];return e}function o(a){return function(b,c,d){return a(b,d)}}function p(a){return function(c,f,g){g=e(g||b),c=c||[];var h=m(c);if(0>=a)return g(null);var i=!1,j=0,k=!1;!function l(){if(i&&0>=j)return g(null);for(;a>j&&!k;){var b=h();if(null===b)return i=!0,void(0>=j&&g(null));j+=1,f(c[b],b,d(function(a){j-=1,a?(g(a),k=!0):l()}))}}()}}function q(a){return function(b,c,d){return a(H.eachOf,b,c,d)}}function r(a,b){return function(c,d,e){return b(p(a),c,d,e)}}function s(a){return function(b,c,d){return a(H.eachOfSeries,b,c,d)}}function t(a,c,d,f){f=e(f||b);var g=[];a(c,function(a,b,c){d(a,function(a,d){g[b]=d,c(a)})},function(a){f(a,g)})}function u(a){return r(a,t)}function v(a,b,c,d){var e=[];b=i(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b,d){c(a.value,function(b){b&&e.push(a),d()})},function(){d(i(e.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})}function w(a,b,c,d){var e=[];b=i(b,function(a,b){return{index:b,value:a}}),a(b,function(a,b,d){c(a.value,function(b){b||e.push(a),d()})},function(){d(i(e.sort(function(a,b){return a.index-b.index}),function(a){return a.value}))})}function x(a,c,d,e){a(c,function(a,c,f){d(a,function(c){c?(e(a),e=b):f()})},function(){e()})}function y(a,c,d){d=d||b;var e=f(c)?[]:{};a(c,function(a,b,c){a(function(a){var d=n(arguments,1);d.length<=1&&(d=d[0]),e[b]=d,c(a)})},function(a){d(a,e)})}function z(a,b,c,d){var e=[];a(b,function(a,b,d){c(a,function(a,b){e=e.concat(b||[]),d(a)})},function(a){d(a,e)})}function A(a,c,e){function f(a,c,d,e){if(null!=e&&"function"!=typeof e)throw new Error("task callback must be a function");return a.started=!0,K(c)||(c=[c]),0===c.length&&a.idle()?H.setImmediate(function(){a.drain()}):(h(c,function(c){var f={data:c,callback:e||b};d?a.tasks.unshift(f):a.tasks.push(f),a.tasks.length===a.concurrency&&a.saturated()}),void H.setImmediate(a.process))}function g(a,b){return function(){j-=1;var c=arguments;h(b,function(a){a.callback.apply(a,c)}),a.tasks.length+j===0&&a.drain(),a.process()}}if(null==c)c=1;else if(0===c)throw new Error("Concurrency must not be zero");var j=0,k={tasks:[],concurrency:c,saturated:b,empty:b,drain:b,started:!1,paused:!1,push:function(a,b){f(k,a,!1,b)},kill:function(){k.drain=b,k.tasks=[]},unshift:function(a,b){f(k,a,!0,b)},process:function(){if(!k.paused&&j<k.concurrency&&k.tasks.length)for(;j<k.concurrency&&k.tasks.length;){var b=e?k.tasks.splice(0,e):k.tasks.splice(0,k.tasks.length),c=i(b,function(a){return a.data});0===k.tasks.length&&k.empty(),j+=1;var f=d(g(k,b));a(c,f)}},length:function(){return k.tasks.length},running:function(){return j},idle:function(){return k.tasks.length+j===0},pause:function(){k.paused=!0},resume:function(){if(k.paused!==!1){k.paused=!1;for(var a=Math.min(k.concurrency,k.tasks.length),b=1;a>=b;b++)H.setImmediate(k.process)}}};return k}function B(a){return function(b){var c=n(arguments,1);b.apply(null,c.concat([function(b){var c=n(arguments,1);"undefined"!=typeof console&&(b?console.error&&console.error(b):console[a]&&h(c,function(b){console[a](b)}))}]))}}function C(a){return function(b,c,d){a(j(b),c,d)}}function D(a,b){function c(){var c=this,d=n(arguments),e=d.pop();return a(b,function(a,b,e){a.apply(c,d.concat([e]))},e)}if(arguments.length>2){var d=n(arguments,2);return c.apply(this,d)}return c}function E(a){return function(){var b=n(arguments),c=b.pop();b.push(function(){var a=arguments;d?H.setImmediate(function(){c.apply(null,a)}):c.apply(null,a)});var d=!0;a.apply(this,b),d=!1}}var F,G,H={};F="object"==typeof window&&this===window?window:"object"==typeof global&&this===global?global:this,null!=F&&(G=F.async),H.noConflict=function(){return F.async=G,H};var I,J=Object.prototype.toString,K=Array.isArray||function(a){return"[object Array]"===J.call(a)},L=Object.keys||function(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b};"function"==typeof setImmediate&&(I=setImmediate),"undefined"!=typeof process&&process.nextTick?(H.nextTick=process.nextTick,I?H.setImmediate=function(a){I(a)}:H.setImmediate=H.nextTick):I?(H.nextTick=function(a){I(a)},H.setImmediate=H.nextTick):(H.nextTick=function(a){setTimeout(a,0)},H.setImmediate=H.nextTick),H.forEach=H.each=function(a,b,c){return H.eachOf(a,o(b),c)},H.forEachSeries=H.eachSeries=function(a,b,c){return H.eachOfSeries(a,o(b),c)},H.forEachLimit=H.eachLimit=function(a,b,c,d){return p(b)(a,o(c),d)},H.forEachOf=H.eachOf=function(a,c,h){function i(a){a?h(a):(k+=1,k>=j&&h(null))}h=e(h||b),a=a||[];var j=f(a)?a.length:L(a).length,k=0;return j?void g(a,function(b,e){c(a[e],e,d(i))}):h(null)},H.forEachOfSeries=H.eachOfSeries=function(a,c,f){function g(){var b=!0;return null===i?f(null):(c(a[i],i,d(function(a){if(a)f(a);else{if(i=h(),null===i)return f(null);b?H.nextTick(g):g()}})),void(b=!1))}f=e(f||b),a=a||[];var h=m(a),i=h();g()},H.forEachOfLimit=H.eachOfLimit=function(a,b,c,d){p(b)(a,c,d)},H.map=q(t),H.mapSeries=s(t),H.mapLimit=function(a,b,c,d){return u(b)(a,c,d)},H.inject=H.foldl=H.reduce=function(a,b,c,d){H.eachOfSeries(a,function(a,d,e){c(b,a,function(a,c){b=c,e(a)})},function(a){d(a||null,b)})},H.foldr=H.reduceRight=function(a,b,c,d){var e=i(a,function(a){return a}).reverse();H.reduce(e,b,c,d)},H.select=H.filter=q(v),H.selectSeries=H.filterSeries=s(v),H.reject=q(w),H.rejectSeries=s(w),H.detect=q(x),H.detectSeries=s(x),H.any=H.some=function(a,c,d){H.eachOf(a,function(a,e,f){c(a,function(a){a&&(d(!0),d=b),f()})},function(){d(!1)})},H.all=H.every=function(a,c,d){H.eachOf(a,function(a,e,f){c(a,function(a){a||(d(!1),d=b),f()})},function(){d(!0)})},H.sortBy=function(a,b,c){function d(a,b){var c=a.criteria,d=b.criteria;return d>c?-1:c>d?1:0}H.map(a,function(a,c){b(a,function(b,d){b?c(b):c(null,{value:a,criteria:d})})},function(a,b){return a?c(a):void c(null,i(b.sort(d),function(a){return a.value}))})},H.auto=function(a,c){function d(a){m.unshift(a)}function f(a){for(var b=0;b<m.length;b+=1)if(m[b]===a)return void m.splice(b,1)}function g(){j--,h(m.slice(0),function(a){a()})}c=e(c||b);var i=L(a),j=i.length;if(!j)return c(null);var l={},m=[];d(function(){j||c(null,l)}),h(i,function(b){function e(a){var d=n(arguments,1);if(d.length<=1&&(d=d[0]),a){var e={};h(L(l),function(a){e[a]=l[a]}),e[b]=d,c(a,e)}else l[b]=d,H.setImmediate(g)}function i(){return k(p,function(a,b){return a&&l.hasOwnProperty(b)},!0)&&!l.hasOwnProperty(b)}function j(){i()&&(f(j),o[o.length-1](e,l))}for(var m,o=K(a[b])?a[b]:[a[b]],p=o.slice(0,Math.abs(o.length-1))||[],q=p.length;q--;){if(!(m=a[p[q]]))throw new Error("Has inexistant dependency");if(K(m)&&~m.indexOf(b))throw new Error("Has cyclic dependencies")}i()?o[o.length-1](e,l):d(j)})},H.retry=function(a,b,c){function d(d,e){function g(a,b){return function(c){a(function(a,d){c(!a||b,{err:a,result:d})},e)}}for(;a;)f.push(g(b,!(a-=1)));H.series(f,function(a,b){b=b[b.length-1],(d||c)(b.err,b.result)})}var e=5,f=[];return"function"==typeof a&&(c=b,b=a,a=e),a=parseInt(a,10)||e,c?d():d},H.waterfall=function(a,c){function d(a){return function(b){if(b)c.apply(null,arguments);else{var e=n(arguments,1),f=a.next();f?e.push(d(f)):e.push(c),E(a).apply(null,e)}}}if(c=e(c||b),!K(a)){var f=new Error("First argument to waterfall must be an array of functions");return c(f)}return a.length?void d(H.iterator(a))():c()},H.parallel=function(a,b){y(H.eachOf,a,b)},H.parallelLimit=function(a,b,c){y(p(b),a,c)},H.series=function(a,c){c=c||b;var d=f(a)?[]:{};H.eachOfSeries(a,function(a,b,c){a(function(a){var e=n(arguments,1);e.length<=1&&(e=e[0]),d[b]=e,c(a)})},function(a){c(a,d)})},H.iterator=function(a){function b(c){function d(){return a.length&&a[c].apply(null,arguments),d.next()}return d.next=function(){return c<a.length-1?b(c+1):null},d}return b(0)},H.apply=function(a){var b=n(arguments,1);return function(){return a.apply(null,b.concat(n(arguments)))}},H.concat=q(z),H.concatSeries=s(z),H.whilst=function(a,b,c){a()?b(function(d){return d?c(d):void H.whilst(a,b,c)}):c(null)},H.doWhilst=function(a,b,c){a(function(d){if(d)return c(d);var e=n(arguments,1);b.apply(null,e)?H.doWhilst(a,b,c):c(null)})},H.until=function(a,b,c){a()?c(null):b(function(d){return d?c(d):void H.until(a,b,c)})},H.doUntil=function(a,b,c){a(function(d){if(d)return c(d);var e=n(arguments,1);b.apply(null,e)?c(null):H.doUntil(a,b,c)})},H.queue=function(a,b){var c=A(function(b,c){a(b[0],c)},b,1);return c},H.priorityQueue=function(a,c){function d(a,b){return a.priority-b.priority}function e(a,b,c){for(var d=-1,e=a.length-1;e>d;){var f=d+(e-d+1>>>1);c(b,a[f])>=0?d=f:e=f-1}return d}function f(a,c,f,g){if(null!=g&&"function"!=typeof g)throw new Error("task callback must be a function");return a.started=!0,K(c)||(c=[c]),0===c.length?H.setImmediate(function(){a.drain()}):void h(c,function(c){var h={data:c,priority:f,callback:"function"==typeof g?g:b};a.tasks.splice(e(a.tasks,h,d)+1,0,h),a.tasks.length===a.concurrency&&a.saturated(),H.setImmediate(a.process)})}var g=H.queue(a,c);return g.push=function(a,b,c){f(g,a,b,c)},delete g.unshift,g},H.cargo=function(a,b){return A(a,1,b)},H.log=B("log"),H.dir=B("dir"),H.memoize=function(a,b){function c(){var c=n(arguments),f=c.pop(),g=b.apply(null,c);g in d?H.nextTick(function(){f.apply(null,d[g])}):g in e?e[g].push(f):(e[g]=[f],a.apply(null,c.concat([function(){d[g]=n(arguments);var a=e[g];delete e[g];for(var b=0,c=a.length;c>b;b++)a[b].apply(null,arguments)}])))}var d={},e={};return b=b||function(a){return a},c.memo=d,c.unmemoized=a,c},H.unmemoize=function(a){return function(){return(a.unmemoized||a).apply(null,arguments)}},H.times=C(H.map),H.timesSeries=C(H.mapSeries),H.timesLimit=function(a,b,c,d){return H.mapLimit(j(a),b,c,d)},H.seq=function(){var a=arguments;return function(){var c=this,d=n(arguments),e=d.slice(-1)[0];"function"==typeof e?d.pop():e=b,H.reduce(a,d,function(a,b,d){b.apply(c,a.concat([function(){var a=arguments[0],b=n(arguments,1);d(a,b)}]))},function(a,b){e.apply(c,[a].concat(b))})}},H.compose=function(){return H.seq.apply(null,Array.prototype.reverse.call(arguments))},H.applyEach=function(){var a=n(arguments);return D.apply(null,[H.eachOf].concat(a))},H.applyEachSeries=function(){var a=n(arguments);return D.apply(null,[H.eachOfSeries].concat(a))},H.forever=function(a,c){function e(a){return a?f(a):void g(e)}var f=d(c||b),g=E(a);e()},H.ensureAsync=E,"undefined"!=typeof c&&c.exports?c.exports=H:"undefined"!=typeof a&&a.amd?a([],function(){return H}):F.async=H}()},{}],2:[function(b,c,d){!function(b){if("object"==typeof d&&"undefined"!=typeof c)c.exports=b();else if("function"==typeof a&&a.amd)a([],b);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.pako=b()}}(function(){return function a(c,d,e){function f(h,i){if(!d[h]){if(!c[h]){var j="function"==typeof b&&b;if(!i&&j)return j(h,!0);if(g)return g(h,!0);var k=new Error("Cannot find module '"+h+"'");throw k.code="MODULE_NOT_FOUND",k}var l=d[h]={exports:{}};c[h][0].call(l.exports,function(a){var b=c[h][1][a];return f(b?b:a)},l,l.exports,a,c,d,e)}return d[h].exports}for(var g="function"==typeof b&&b,h=0;h<e.length;h++)f(e[h]);return f}({1:[function(a,b,c){"use strict";var d="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;c.assign=function(a){for(var b=Array.prototype.slice.call(arguments,1);b.length;){var c=b.shift();if(c){if("object"!=typeof c)throw new TypeError(c+"must be non-object");for(var d in c)c.hasOwnProperty(d)&&(a[d]=c[d])}}return a},c.shrinkBuf=function(a,b){return a.length===b?a:a.subarray?a.subarray(0,b):(a.length=b,a)};var e={arraySet:function(a,b,c,d,e){if(b.subarray&&a.subarray)return void a.set(b.subarray(c,c+d),e);for(var f=0;d>f;f++)a[e+f]=b[c+f]},flattenChunks:function(a){var b,c,d,e,f,g;for(d=0,b=0,c=a.length;c>b;b++)d+=a[b].length;for(g=new Uint8Array(d),e=0,b=0,c=a.length;c>b;b++)f=a[b],g.set(f,e),e+=f.length;return g}},f={arraySet:function(a,b,c,d,e){for(var f=0;d>f;f++)a[e+f]=b[c+f]},flattenChunks:function(a){return[].concat.apply([],a)}};c.setTyped=function(a){a?(c.Buf8=Uint8Array,c.Buf16=Uint16Array,c.Buf32=Int32Array,c.assign(c,e)):(c.Buf8=Array,c.Buf16=Array,c.Buf32=Array,c.assign(c,f))},c.setTyped(d)},{}],2:[function(a,b,c){"use strict";function d(a,b){if(65537>b&&(a.subarray&&g||!a.subarray&&f))return String.fromCharCode.apply(null,e.shrinkBuf(a,b));for(var c="",d=0;b>d;d++)c+=String.fromCharCode(a[d]);return c}var e=a("./common"),f=!0,g=!0;try{String.fromCharCode.apply(null,[0])}catch(h){f=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(h){g=!1}for(var i=new e.Buf8(256),j=0;256>j;j++)i[j]=j>=252?6:j>=248?5:j>=240?4:j>=224?3:j>=192?2:1;i[254]=i[254]=1,c.string2buf=function(a){var b,c,d,f,g,h=a.length,i=0;for(f=0;h>f;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),i+=128>c?1:2048>c?2:65536>c?3:4;for(b=new e.Buf8(i),g=0,f=0;i>g;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),128>c?b[g++]=c:2048>c?(b[g++]=192|c>>>6,b[g++]=128|63&c):65536>c?(b[g++]=224|c>>>12,b[g++]=128|c>>>6&63,b[g++]=128|63&c):(b[g++]=240|c>>>18,b[g++]=128|c>>>12&63,b[g++]=128|c>>>6&63,b[g++]=128|63&c);return b},c.buf2binstring=function(a){return d(a,a.length)},c.binstring2buf=function(a){for(var b=new e.Buf8(a.length),c=0,d=b.length;d>c;c++)b[c]=a.charCodeAt(c);return b},c.buf2string=function(a,b){var c,e,f,g,h=b||a.length,j=new Array(2*h);for(e=0,c=0;h>c;)if(f=a[c++],128>f)j[e++]=f;else if(g=i[f],g>4)j[e++]=65533,c+=g-1;else{for(f&=2===g?31:3===g?15:7;g>1&&h>c;)f=f<<6|63&a[c++],g--;g>1?j[e++]=65533:65536>f?j[e++]=f:(f-=65536,j[e++]=55296|f>>10&1023,j[e++]=56320|1023&f)}return d(j,e)},c.utf8border=function(a,b){var c;for(b=b||a.length,b>a.length&&(b=a.length),c=b-1;c>=0&&128===(192&a[c]);)c--;return 0>c?b:0===c?b:c+i[a[c]]>b?c:b}},{"./common":1}],3:[function(a,b,c){"use strict";function d(a,b,c,d){for(var e=65535&a|0,f=a>>>16&65535|0,g=0;0!==c;){g=c>2e3?2e3:c,c-=g;do e=e+b[d++]|0,f=f+e|0;while(--g);e%=65521,f%=65521}return e|f<<16|0}b.exports=d},{}],4:[function(a,b,c){b.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],5:[function(a,b,c){"use strict";function d(){for(var a,b=[],c=0;256>c;c++){a=c;for(var d=0;8>d;d++)a=1&a?3988292384^a>>>1:a>>>1;b[c]=a}return b}function e(a,b,c,d){var e=f,g=d+c;a=-1^a;for(var h=d;g>h;h++)a=a>>>8^e[255&(a^b[h])];return-1^a}var f=d();b.exports=e},{}],6:[function(a,b,c){"use strict";function d(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}b.exports=d},{}],7:[function(a,b,c){"use strict";var d=30,e=12;b.exports=function(a,b){var c,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C;c=a.state,f=a.next_in,B=a.input,g=f+(a.avail_in-5),h=a.next_out,C=a.output,i=h-(b-a.avail_out),j=h+(a.avail_out-257),k=c.dmax,l=c.wsize,m=c.whave,n=c.wnext,o=c.window,p=c.hold,q=c.bits,r=c.lencode,s=c.distcode,t=(1<<c.lenbits)-1,u=(1<<c.distbits)-1;a:do{15>q&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=r[p&t];b:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,0===w)C[h++]=65535&v;else{if(!(16&w)){if(0===(64&w)){v=r[(65535&v)+(p&(1<<w)-1)];continue b}if(32&w){c.mode=e;break a}a.msg="invalid literal/length code",c.mode=d;break a}x=65535&v,w&=15,w&&(w>q&&(p+=B[f++]<<q,q+=8),x+=p&(1<<w)-1,p>>>=w,q-=w),15>q&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=s[p&u];c:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,!(16&w)){if(0===(64&w)){v=s[(65535&v)+(p&(1<<w)-1)];continue c}a.msg="invalid distance code",c.mode=d;break a}if(y=65535&v,w&=15,w>q&&(p+=B[f++]<<q,q+=8,w>q&&(p+=B[f++]<<q,q+=8)),y+=p&(1<<w)-1,y>k){a.msg="invalid distance too far back",c.mode=d;break a}if(p>>>=w,q-=w,w=h-i,y>w){if(w=y-w,w>m&&c.sane){a.msg="invalid distance too far back",c.mode=d;break a}if(z=0,A=o,0===n){if(z+=l-w,x>w){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}else if(w>n){if(z+=l+n-w,w-=n,x>w){x-=w;do C[h++]=o[z++];while(--w);if(z=0,x>n){w=n,x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}}else if(z+=n-w,x>w){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}for(;x>2;)C[h++]=A[z++],C[h++]=A[z++],C[h++]=A[z++],x-=3;x&&(C[h++]=A[z++],x>1&&(C[h++]=A[z++]))}else{z=h-y;do C[h++]=C[z++],C[h++]=C[z++],C[h++]=C[z++],x-=3;while(x>2);x&&(C[h++]=C[z++],x>1&&(C[h++]=C[z++]))}break}}break}}while(g>f&&j>h);x=q>>3,f-=x,q-=x<<3,p&=(1<<q)-1,a.next_in=f,a.next_out=h,a.avail_in=g>f?5+(g-f):5-(f-g),a.avail_out=j>h?257+(j-h):257-(h-j),c.hold=p,c.bits=q}},{}],8:[function(a,b,c){"use strict";function d(a){return(a>>>24&255)+(a>>>8&65280)+((65280&a)<<8)+((255&a)<<24)}function e(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new r.Buf16(320),this.work=new r.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function f(a){var b;return a&&a.state?(b=a.state,a.total_in=a.total_out=b.total=0,a.msg="",b.wrap&&(a.adler=1&b.wrap),b.mode=K,b.last=0,b.havedict=0,b.dmax=32768,b.head=null,b.hold=0,b.bits=0,b.lencode=b.lendyn=new r.Buf32(oa),b.distcode=b.distdyn=new r.Buf32(pa),b.sane=1,b.back=-1,C):F}function g(a){var b;return a&&a.state?(b=a.state,b.wsize=0,b.whave=0,b.wnext=0,f(a)):F}function h(a,b){var c,d;return a&&a.state?(d=a.state,0>b?(c=0,b=-b):(c=(b>>4)+1,48>b&&(b&=15)),b&&(8>b||b>15)?F:(null!==d.window&&d.wbits!==b&&(d.window=null),d.wrap=c,d.wbits=b,g(a))):F}function i(a,b){var c,d;return a?(d=new e,a.state=d,d.window=null,c=h(a,b),c!==C&&(a.state=null),c):F}function j(a){return i(a,ra)}function k(a){if(sa){var b;for(p=new r.Buf32(512),q=new r.Buf32(32),b=0;144>b;)a.lens[b++]=8;for(;256>b;)a.lens[b++]=9;for(;280>b;)a.lens[b++]=7;for(;288>b;)a.lens[b++]=8;for(v(x,a.lens,0,288,p,0,a.work,{bits:9}),b=0;32>b;)a.lens[b++]=5;v(y,a.lens,0,32,q,0,a.work,{bits:5}),sa=!1}a.lencode=p,a.lenbits=9,a.distcode=q,a.distbits=5}function l(a,b,c,d){var e,f=a.state;return null===f.window&&(f.wsize=1<<f.wbits,f.wnext=0,f.whave=0,f.window=new r.Buf8(f.wsize)),d>=f.wsize?(r.arraySet(f.window,b,c-f.wsize,f.wsize,0),f.wnext=0,f.whave=f.wsize):(e=f.wsize-f.wnext,e>d&&(e=d),r.arraySet(f.window,b,c-d,e,f.wnext),d-=e,d?(r.arraySet(f.window,b,c-d,d,0),f.wnext=d,f.whave=f.wsize):(f.wnext+=e,f.wnext===f.wsize&&(f.wnext=0),f.whave<f.wsize&&(f.whave+=e))),0}function m(a,b){var c,e,f,g,h,i,j,m,n,o,p,q,oa,pa,qa,ra,sa,ta,ua,va,wa,xa,ya,za,Aa=0,Ba=new r.Buf8(4),Ca=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!a||!a.state||!a.output||!a.input&&0!==a.avail_in)return F;c=a.state,c.mode===V&&(c.mode=W),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,o=i,p=j,xa=C;a:for(;;)switch(c.mode){case K:if(0===c.wrap){c.mode=W;break}for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(2&c.wrap&&35615===m){c.check=0,Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=t(c.check,Ba,2,0),m=0,n=0,c.mode=L;break}if(c.flags=0,c.head&&(c.head.done=!1),!(1&c.wrap)||(((255&m)<<8)+(m>>8))%31){a.msg="incorrect header check",c.mode=la;break}if((15&m)!==J){a.msg="unknown compression method",c.mode=la;break}if(m>>>=4,n-=4,wa=(15&m)+8,0===c.wbits)c.wbits=wa;else if(wa>c.wbits){a.msg="invalid window size",c.mode=la;break}c.dmax=1<<wa,a.adler=c.check=1,c.mode=512&m?T:V,m=0,n=0;break;case L:for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.flags=m,(255&c.flags)!==J){a.msg="unknown compression method",c.mode=la;break}if(57344&c.flags){a.msg="unknown header flags set",c.mode=la;break}c.head&&(c.head.text=m>>8&1),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=t(c.check,Ba,2,0)),m=0,n=0,c.mode=M;case M:for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.time=m),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,Ba[2]=m>>>16&255,Ba[3]=m>>>24&255,c.check=t(c.check,Ba,4,0)),m=0,n=0,c.mode=N;case N:for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.xflags=255&m,c.head.os=m>>8),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=t(c.check,Ba,2,0)),m=0,n=0,c.mode=O;case O:if(1024&c.flags){for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length=m,c.head&&(c.head.extra_len=m),512&c.flags&&(Ba[0]=255&m,Ba[1]=m>>>8&255,c.check=t(c.check,Ba,2,0)),m=0,n=0}else c.head&&(c.head.extra=null);c.mode=P;case P:if(1024&c.flags&&(q=c.length,q>i&&(q=i),q&&(c.head&&(wa=c.head.extra_len-c.length,c.head.extra||(c.head.extra=new Array(c.head.extra_len)),r.arraySet(c.head.extra,e,g,q,wa)),512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,c.length-=q),c.length))break a;c.length=0,c.mode=Q;case Q:if(2048&c.flags){if(0===i)break a;q=0;do wa=e[g+q++],c.head&&wa&&c.length<65536&&(c.head.name+=String.fromCharCode(wa));while(wa&&i>q);if(512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,wa)break a}else c.head&&(c.head.name=null);c.length=0,c.mode=R;case R:if(4096&c.flags){if(0===i)break a;q=0;do wa=e[g+q++],c.head&&wa&&c.length<65536&&(c.head.comment+=String.fromCharCode(wa));while(wa&&i>q);if(512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,wa)break a}else c.head&&(c.head.comment=null);c.mode=S;case S:if(512&c.flags){for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(65535&c.check)){a.msg="header crc mismatch",c.mode=la;break}m=0,n=0}c.head&&(c.head.hcrc=c.flags>>9&1,c.head.done=!0),a.adler=c.check=0,c.mode=V;break;case T:for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}a.adler=c.check=d(m),m=0,n=0,c.mode=U;case U:if(0===c.havedict)return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,E;a.adler=c.check=1,c.mode=V;case V:if(b===A||b===B)break a;case W:if(c.last){m>>>=7&n,n-=7&n,c.mode=ia;break}for(;3>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}switch(c.last=1&m,m>>>=1,n-=1,3&m){case 0:c.mode=X;break;case 1:if(k(c),c.mode=ba,b===B){m>>>=2,n-=2;break a}break;case 2:c.mode=$;break;case 3:a.msg="invalid block type",c.mode=la}m>>>=2,n-=2;break;case X:for(m>>>=7&n,n-=7&n;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if((65535&m)!==(m>>>16^65535)){a.msg="invalid stored block lengths",c.mode=la;break}if(c.length=65535&m,m=0,n=0,c.mode=Y,b===B)break a;case Y:c.mode=Z;case Z:if(q=c.length){if(q>i&&(q=i),q>j&&(q=j),0===q)break a;r.arraySet(f,e,g,q,h),i-=q,g+=q,j-=q,h+=q,c.length-=q;break}c.mode=V;break;case $:for(;14>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.nlen=(31&m)+257,m>>>=5,n-=5,c.ndist=(31&m)+1,m>>>=5,n-=5,c.ncode=(15&m)+4,m>>>=4,n-=4,c.nlen>286||c.ndist>30){a.msg="too many length or distance symbols",c.mode=la;break}c.have=0,c.mode=_;case _:for(;c.have<c.ncode;){for(;3>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.lens[Ca[c.have++]]=7&m,m>>>=3,n-=3}for(;c.have<19;)c.lens[Ca[c.have++]]=0;if(c.lencode=c.lendyn,c.lenbits=7,ya={bits:c.lenbits},xa=v(w,c.lens,0,19,c.lencode,0,c.work,ya),c.lenbits=ya.bits,xa){a.msg="invalid code lengths set",c.mode=la;break}c.have=0,c.mode=aa;case aa:for(;c.have<c.nlen+c.ndist;){for(;Aa=c.lencode[m&(1<<c.lenbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(n>=qa);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(16>sa)m>>>=qa,n-=qa,c.lens[c.have++]=sa;else{if(16===sa){for(za=qa+2;za>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m>>>=qa,n-=qa,0===c.have){a.msg="invalid bit length repeat",c.mode=la;break}wa=c.lens[c.have-1],q=3+(3&m),m>>>=2,n-=2}else if(17===sa){for(za=qa+3;za>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qa,n-=qa,wa=0,q=3+(7&m),m>>>=3,n-=3}else{for(za=qa+7;za>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qa,n-=qa,wa=0,q=11+(127&m),m>>>=7,n-=7}if(c.have+q>c.nlen+c.ndist){a.msg="invalid bit length repeat",c.mode=la;break}for(;q--;)c.lens[c.have++]=wa}}if(c.mode===la)break;if(0===c.lens[256]){a.msg="invalid code -- missing end-of-block",c.mode=la;break}if(c.lenbits=9,ya={bits:c.lenbits},xa=v(x,c.lens,0,c.nlen,c.lencode,0,c.work,ya),c.lenbits=ya.bits,xa){a.msg="invalid literal/lengths set",c.mode=la;break}if(c.distbits=6,c.distcode=c.distdyn,ya={bits:c.distbits},xa=v(y,c.lens,c.nlen,c.ndist,c.distcode,0,c.work,ya),c.distbits=ya.bits,xa){a.msg="invalid distances set",c.mode=la;break}if(c.mode=ba,b===B)break a;case ba:c.mode=ca;case ca:if(i>=6&&j>=258){a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,u(a,p),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,c.mode===V&&(c.back=-1);break}for(c.back=0;Aa=c.lencode[m&(1<<c.lenbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(n>=qa);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(ra&&0===(240&ra)){for(ta=qa,ua=ra,va=sa;Aa=c.lencode[va+((m&(1<<ta+ua)-1)>>ta)],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(n>=ta+qa);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=ta,n-=ta,c.back+=ta}if(m>>>=qa,n-=qa,c.back+=qa,c.length=sa,0===ra){c.mode=ha;break}if(32&ra){c.back=-1,c.mode=V;break}if(64&ra){a.msg="invalid literal/length code",c.mode=la;break}c.extra=15&ra,c.mode=da;case da:if(c.extra){for(za=c.extra;za>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}c.was=c.length,c.mode=ea;case ea:for(;Aa=c.distcode[m&(1<<c.distbits)-1],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(n>=qa);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(0===(240&ra)){for(ta=qa,ua=ra,va=sa;Aa=c.distcode[va+((m&(1<<ta+ua)-1)>>ta)],qa=Aa>>>24,ra=Aa>>>16&255,sa=65535&Aa,!(n>=ta+qa);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=ta,n-=ta,c.back+=ta}if(m>>>=qa,n-=qa,c.back+=qa,64&ra){a.msg="invalid distance code",c.mode=la;break}c.offset=sa,c.extra=15&ra,c.mode=fa;case fa:if(c.extra){for(za=c.extra;za>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.offset+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}if(c.offset>c.dmax){a.msg="invalid distance too far back",c.mode=la;break}c.mode=ga;case ga:if(0===j)break a;if(q=p-j,c.offset>q){if(q=c.offset-q,q>c.whave&&c.sane){a.msg="invalid distance too far back",c.mode=la;break}q>c.wnext?(q-=c.wnext,oa=c.wsize-q):oa=c.wnext-q,q>c.length&&(q=c.length),pa=c.window}else pa=f,oa=h-c.offset,q=c.length;q>j&&(q=j),j-=q,c.length-=q;do f[h++]=pa[oa++];while(--q);0===c.length&&(c.mode=ca);break;case ha:if(0===j)break a;f[h++]=c.length,j--,c.mode=ca;break;case ia:if(c.wrap){for(;32>n;){if(0===i)break a;i--,m|=e[g++]<<n,n+=8}if(p-=j,a.total_out+=p,c.total+=p,p&&(a.adler=c.check=c.flags?t(c.check,f,p,h-p):s(c.check,f,p,h-p)),p=j,(c.flags?m:d(m))!==c.check){a.msg="incorrect data check",c.mode=la;break}m=0,n=0}c.mode=ja;case ja:if(c.wrap&&c.flags){for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(4294967295&c.total)){a.msg="incorrect length check",c.mode=la;break}m=0,n=0}c.mode=ka;case ka:xa=D;break a;case la:xa=G;break a;case ma:return H;case na:default:return F}return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,(c.wsize||p!==a.avail_out&&c.mode<la&&(c.mode<ia||b!==z))&&l(a,a.output,a.next_out,p-a.avail_out)?(c.mode=ma,H):(o-=a.avail_in,p-=a.avail_out,a.total_in+=o,a.total_out+=p,c.total+=p,c.wrap&&p&&(a.adler=c.check=c.flags?t(c.check,f,p,a.next_out-p):s(c.check,f,p,a.next_out-p)),a.data_type=c.bits+(c.last?64:0)+(c.mode===V?128:0)+(c.mode===ba||c.mode===Y?256:0),(0===o&&0===p||b===z)&&xa===C&&(xa=I),xa)}function n(a){if(!a||!a.state)return F;var b=a.state;return b.window&&(b.window=null),a.state=null,C}function o(a,b){var c;return a&&a.state?(c=a.state,0===(2&c.wrap)?F:(c.head=b,b.done=!1,C)):F}var p,q,r=a("../utils/common"),s=a("./adler32"),t=a("./crc32"),u=a("./inffast"),v=a("./inftrees"),w=0,x=1,y=2,z=4,A=5,B=6,C=0,D=1,E=2,F=-2,G=-3,H=-4,I=-5,J=8,K=1,L=2,M=3,N=4,O=5,P=6,Q=7,R=8,S=9,T=10,U=11,V=12,W=13,X=14,Y=15,Z=16,$=17,_=18,aa=19,ba=20,ca=21,da=22,ea=23,fa=24,ga=25,ha=26,ia=27,ja=28,ka=29,la=30,ma=31,na=32,oa=852,pa=592,qa=15,ra=qa,sa=!0;c.inflateReset=g,c.inflateReset2=h,c.inflateResetKeep=f,c.inflateInit=j,c.inflateInit2=i,c.inflate=m,c.inflateEnd=n,c.inflateGetHeader=o,c.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":1,"./adler32":3,"./crc32":5,"./inffast":7,"./inftrees":9}],9:[function(a,b,c){"use strict";var d=a("../utils/common"),e=15,f=852,g=592,h=0,i=1,j=2,k=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],l=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],m=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],n=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];b.exports=function(a,b,c,o,p,q,r,s){var t,u,v,w,x,y,z,A,B,C=s.bits,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=null,O=0,P=new d.Buf16(e+1),Q=new d.Buf16(e+1),R=null,S=0;for(D=0;e>=D;D++)P[D]=0;for(E=0;o>E;E++)P[b[c+E]]++;for(H=C,G=e;G>=1&&0===P[G];G--);if(H>G&&(H=G),0===G)return p[q++]=20971520,p[q++]=20971520,s.bits=1,0;for(F=1;G>F&&0===P[F];F++);for(F>H&&(H=F),K=1,D=1;e>=D;D++)if(K<<=1,K-=P[D],0>K)return-1;if(K>0&&(a===h||1!==G))return-1;for(Q[1]=0,D=1;e>D;D++)Q[D+1]=Q[D]+P[D];for(E=0;o>E;E++)0!==b[c+E]&&(r[Q[b[c+E]]++]=E);if(a===h?(N=R=r,y=19):a===i?(N=k,O-=257,R=l,S-=257,y=256):(N=m,R=n,y=-1),M=0,E=0,D=F,x=q,I=H,J=0,v=-1,L=1<<H,w=L-1,a===i&&L>f||a===j&&L>g)return 1;for(var T=0;;){T++,z=D-J,r[E]<y?(A=0,B=r[E]):r[E]>y?(A=R[S+r[E]],B=N[O+r[E]]):(A=96,B=0),t=1<<D-J,u=1<<I,F=u;do u-=t,p[x+(M>>J)+u]=z<<24|A<<16|B|0;while(0!==u);for(t=1<<D-1;M&t;)t>>=1;if(0!==t?(M&=t-1,M+=t):M=0,E++,0===--P[D]){if(D===G)break;D=b[c+r[E]]}if(D>H&&(M&w)!==v){for(0===J&&(J=H),x+=F,I=D-J,K=1<<I;G>I+J&&(K-=P[I+J],!(0>=K));)I++,K<<=1;if(L+=1<<I,a===i&&L>f||a===j&&L>g)return 1;v=M&w,p[v]=H<<24|I<<16|x-q|0}}return 0!==M&&(p[x+M]=D-J<<24|64<<16|0),s.bits=H,0}},{"../utils/common":1}],10:[function(a,b,c){"use strict";b.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],11:[function(a,b,c){"use strict";function d(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,
this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}b.exports=d},{}],"/lib/inflate.js":[function(a,b,c){"use strict";function d(a,b){var c=new n(b);if(c.push(a,!0),c.err)throw c.msg;return c.result}function e(a,b){return b=b||{},b.raw=!0,d(a,b)}var f=a("./zlib/inflate.js"),g=a("./utils/common"),h=a("./utils/strings"),i=a("./zlib/constants"),j=a("./zlib/messages"),k=a("./zlib/zstream"),l=a("./zlib/gzheader"),m=Object.prototype.toString,n=function(a){this.options=g.assign({chunkSize:16384,windowBits:0,to:""},a||{});var b=this.options;b.raw&&b.windowBits>=0&&b.windowBits<16&&(b.windowBits=-b.windowBits,0===b.windowBits&&(b.windowBits=-15)),!(b.windowBits>=0&&b.windowBits<16)||a&&a.windowBits||(b.windowBits+=32),b.windowBits>15&&b.windowBits<48&&0===(15&b.windowBits)&&(b.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new k,this.strm.avail_out=0;var c=f.inflateInit2(this.strm,b.windowBits);if(c!==i.Z_OK)throw new Error(j[c]);this.header=new l,f.inflateGetHeader(this.strm,this.header)};n.prototype.push=function(a,b){var c,d,e,j,k,l=this.strm,n=this.options.chunkSize;if(this.ended)return!1;d=b===~~b?b:b===!0?i.Z_FINISH:i.Z_NO_FLUSH,"string"==typeof a?l.input=h.binstring2buf(a):"[object ArrayBuffer]"===m.call(a)?l.input=new Uint8Array(a):l.input=a,l.next_in=0,l.avail_in=l.input.length;do{if(0===l.avail_out&&(l.output=new g.Buf8(n),l.next_out=0,l.avail_out=n),c=f.inflate(l,i.Z_NO_FLUSH),c!==i.Z_STREAM_END&&c!==i.Z_OK)return this.onEnd(c),this.ended=!0,!1;l.next_out&&(0===l.avail_out||c===i.Z_STREAM_END||0===l.avail_in&&(d===i.Z_FINISH||d===i.Z_SYNC_FLUSH))&&("string"===this.options.to?(e=h.utf8border(l.output,l.next_out),j=l.next_out-e,k=h.buf2string(l.output,e),l.next_out=j,l.avail_out=n-j,j&&g.arraySet(l.output,l.output,e,j,0),this.onData(k)):this.onData(g.shrinkBuf(l.output,l.next_out)))}while(l.avail_in>0&&c!==i.Z_STREAM_END);return c===i.Z_STREAM_END&&(d=i.Z_FINISH),d===i.Z_FINISH?(c=f.inflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===i.Z_OK):d===i.Z_SYNC_FLUSH?(this.onEnd(i.Z_OK),l.avail_out=0,!0):!0},n.prototype.onData=function(a){this.chunks.push(a)},n.prototype.onEnd=function(a){a===i.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=g.flattenChunks(this.chunks)),this.chunks=[],this.err=a,this.msg=this.strm.msg},c.Inflate=n,c.inflate=d,c.inflateRaw=e,c.ungzip=d},{"./utils/common":1,"./utils/strings":2,"./zlib/constants":4,"./zlib/gzheader":6,"./zlib/inflate.js":8,"./zlib/messages":10,"./zlib/zstream":11}]},{},[])("/lib/inflate.js")})},{}],3:[function(a,b,c){function d(a,b){switch(void 0===b&&(b=a.toString()),a.name){case"NotFoundError":return new o(p.ENOENT,b);case"QuotaExceededError":return new o(p.ENOSPC,b);default:return new o(p.EIO,b)}}function e(a,b,c){return void 0===b&&(b=p.EIO),void 0===c&&(c=null),function(d){d.preventDefault(),a(new o(b,c))}}function f(a){var b=a.getBufferCore();b instanceof l.BufferCoreArrayBuffer||(a=new n(this._buffer.length),this._buffer.copy(a),b=a.getBufferCore());var c=b.getDataView();return c.buffer}var g=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},h=a("../core/buffer"),i=a("../core/browserfs"),j=a("../generic/key_value_filesystem"),k=a("../core/api_error"),l=a("../core/buffer_core_arraybuffer"),m=a("../core/global"),n=h.Buffer,o=k.ApiError,p=k.ErrorCode,q=m.indexedDB||m.mozIndexedDB||m.webkitIndexedDB||m.msIndexedDB,r=function(){function a(a,b){this.tx=a,this.store=b}return a.prototype.get=function(a,b){try{var c=this.store.get(a);c.onerror=e(b),c.onsuccess=function(a){var c=a.target.result;void 0===c?b(null,c):b(null,new n(c))}}catch(f){b(d(f))}},a}();c.IndexedDBROTransaction=r;var s=function(a){function b(b,c){a.call(this,b,c)}return g(b,a),b.prototype.put=function(a,b,c,g){try{var h,i=f(b);h=c?this.store.put(i,a):this.store.add(i,a),h.onerror=e(g),h.onsuccess=function(a){g(null,!0)}}catch(j){g(d(j))}},b.prototype["delete"]=function(a,b){try{var c=this.store["delete"](a);c.onerror=e(b),c.onsuccess=function(a){b()}}catch(f){b(d(f))}},b.prototype.commit=function(a){setTimeout(a,0)},b.prototype.abort=function(a){var b;try{this.tx.abort()}catch(c){b=d(c)}finally{a(b)}},b}(r);c.IndexedDBRWTransaction=s;var t=function(){function a(a,b){var c=this;void 0===b&&(b="browserfs"),this.storeName=b;var d=q.open(this.storeName,1);d.onupgradeneeded=function(a){var b=a.target.result;b.objectStoreNames.contains(c.storeName)&&b.deleteObjectStore(c.storeName),b.createObjectStore(c.storeName)},d.onsuccess=function(b){c.db=b.target.result,a(null,c)},d.onerror=e(a,p.EACCES)}return a.prototype.name=function(){return"IndexedDB - "+this.storeName},a.prototype.clear=function(a){try{var b=this.db.transaction(this.storeName,"readwrite"),c=b.objectStore(this.storeName),f=c.clear();f.onsuccess=function(b){setTimeout(a,0)},f.onerror=e(a)}catch(g){a(d(g))}},a.prototype.beginTransaction=function(a){void 0===a&&(a="readonly");var b=this.db.transaction(this.storeName,a),c=b.objectStore(this.storeName);if("readwrite"===a)return new s(b,c);if("readonly"===a)return new r(b,c);throw new o(p.EINVAL,"Invalid transaction type.")},a}();c.IndexedDBStore=t;var u=function(a){function b(b,c){var d=this;a.call(this),new t(function(a,c){a?b(a):d.init(c,function(a){b(a,d)})},c)}return g(b,a),b.isAvailable=function(){try{return"undefined"!=typeof q&&null!==q.open("__browserfs_test__")}catch(a){return!1}},b}(j.AsyncKeyValueFileSystem);c.IndexedDBFileSystem=u,i.registerFileSystem("IndexedDB",u)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/buffer_core_arraybuffer":19,"../core/global":24,"../generic/key_value_filesystem":35}],4:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("../core/file_system"),f=a("../generic/file_index"),g=a("../core/buffer"),h=a("../core/api_error"),i=a("../core/file_flag"),j=a("../generic/preload_file"),k=a("../core/browserfs"),l=a("../generic/xhr"),m=(g.Buffer,h.ApiError),n=h.ErrorCode,o=(i.FileFlag,i.ActionType),p=function(a){function b(b,c){void 0===c&&(c=""),a.call(this),null==b&&(b="index.json"),c.length>0&&"/"!==c.charAt(c.length-1)&&(c+="/"),this.prefix_url=c;var d=this._requestFileSync(b,"json");if(null==d)throw new Error("Unable to find listing at URL: "+b);this._index=f.FileIndex.from_listing(d)}return d(b,a),b.prototype.empty=function(){this._index.fileIterator(function(a){a.file_data=null})},b.prototype.getXhrPath=function(a){return"/"===a.charAt(0)&&(a=a.slice(1)),this.prefix_url+a},b.prototype._requestFileSizeAsync=function(a,b){l.getFileSizeAsync(this.getXhrPath(a),b)},b.prototype._requestFileSizeSync=function(a){return l.getFileSizeSync(this.getXhrPath(a))},b.prototype._requestFileAsync=function(a,b,c){l.asyncDownloadFile(this.getXhrPath(a),b,c)},b.prototype._requestFileSync=function(a,b){return l.syncDownloadFile(this.getXhrPath(a),b)},b.prototype.getName=function(){return"XmlHttpRequest"},b.isAvailable=function(){return"undefined"!=typeof XMLHttpRequest&&null!==XMLHttpRequest},b.prototype.diskSpace=function(a,b){b(0,0)},b.prototype.isReadOnly=function(){return!0},b.prototype.supportsLinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.preloadFile=function(a,b){var c=this._index.getInode(a);if(null===c)throw m.ENOENT(a);var d=c.getData();d.size=b.length,d.file_data=b},b.prototype.stat=function(a,b,c){var d=this._index.getInode(a);if(null===d)return c(m.ENOENT(a));var e;d.isFile()?(e=d.getData(),e.size<0?this._requestFileSizeAsync(a,function(a,b){return a?c(a):(e.size=b,void c(null,e.clone()))}):c(null,e.clone())):(e=d.getStats(),c(null,e))},b.prototype.statSync=function(a,b){var c=this._index.getInode(a);if(null===c)throw m.ENOENT(a);var d;return c.isFile()?(d=c.getData(),d.size<0&&(d.size=this._requestFileSizeSync(a))):d=c.getStats(),d},b.prototype.open=function(a,b,c,d){if(b.isWriteable())return d(new m(n.EPERM,a));var e=this,f=this._index.getInode(a);if(null===f)return d(m.ENOENT(a));if(f.isDir())return d(m.EISDIR(a));var g=f.getData();switch(b.pathExistsAction()){case o.THROW_EXCEPTION:case o.TRUNCATE_FILE:return d(m.EEXIST(a));case o.NOP:if(null!=g.file_data)return d(null,new j.NoSyncFile(e,a,b,g.clone(),g.file_data));this._requestFileAsync(a,"buffer",function(c,f){return c?d(c):(g.size=f.length,g.file_data=f,d(null,new j.NoSyncFile(e,a,b,g.clone(),f)))});break;default:return d(new m(n.EINVAL,"Invalid FileMode object."))}},b.prototype.openSync=function(a,b,c){if(b.isWriteable())throw new m(n.EPERM,a);var d=this._index.getInode(a);if(null===d)throw m.ENOENT(a);if(d.isDir())throw m.EISDIR(a);var e=d.getData();switch(b.pathExistsAction()){case o.THROW_EXCEPTION:case o.TRUNCATE_FILE:throw m.EEXIST(a);case o.NOP:if(null!=e.file_data)return new j.NoSyncFile(this,a,b,e.clone(),e.file_data);var f=this._requestFileSync(a,"buffer");return e.size=f.length,e.file_data=f,new j.NoSyncFile(this,a,b,e.clone(),f);default:throw new m(n.EINVAL,"Invalid FileMode object.")}},b.prototype.readdir=function(a,b){try{b(null,this.readdirSync(a))}catch(c){b(c)}},b.prototype.readdirSync=function(a){var b=this._index.getInode(a);if(null===b)throw m.ENOENT(a);if(b.isFile())throw m.ENOTDIR(a);return b.getListing()},b.prototype.readFile=function(a,b,c,d){var e=d;this.open(a,c,420,function(a,c){if(a)return d(a);d=function(a,b){c.close(function(c){return null==a&&(a=c),e(a,b)})};var f=c,h=f.getBuffer();if(null===b)return h.length>0?d(a,h.sliceCopy()):d(a,new g.Buffer(0));try{d(null,h.toString(b))}catch(i){d(i)}})},b.prototype.readFileSync=function(a,b,c){var d=this.openSync(a,c,420);try{var e=d,f=e.getBuffer();return null===b?f.length>0?f.sliceCopy():new g.Buffer(0):f.toString(b)}finally{d.closeSync()}},b}(e.BaseFileSystem);c.XmlHttpRequest=p,k.registerFileSystem("XmlHttpRequest",p)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/file_flag":22,"../core/file_system":23,"../generic/file_index":33,"../generic/preload_file":36,"../generic/xhr":37}],5:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("../core/file_system"),f=a("../core/file_flag"),g=a("../generic/preload_file"),h=a("../core/browserfs"),i=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return d(b,a),b.prototype.syncSync=function(){this.isDirty()&&(this._fs._syncSync(this),this.resetDirty())},b.prototype.closeSync=function(){this.syncSync()},b}(g.PreloadFile),j=function(a){function b(b,c){if(a.call(this),this._queue=[],this._queueRunning=!1,this._isInitialized=!1,this._sync=b,this._async=c,!b.supportsSynch())throw new Error("Expected synchronous storage.");if(c.supportsSynch())throw new Error("Expected asynchronous storage.")}return d(b,a),b.prototype.getName=function(){return"AsyncMirror"},b.isAvailable=function(){return!0},b.prototype._syncSync=function(a){this._sync.writeFileSync(a.getPath(),a.getBuffer(),null,f.FileFlag.getFileFlag("w"),a.getStats().mode),this.enqueueOp({apiMethod:"writeFile",arguments:[a.getPath(),a.getBuffer(),null,a.getFlag(),a.getStats().mode]})},b.prototype.initialize=function(a){var b=this;if(this._isInitialized)a();else{var c=function(a,c,d){"/"!==a&&b._sync.mkdirSync(a,c),b._async.readdir(a,function(b,c){function f(b){b?d(b):g<c.length?(e(a+"/"+c[g],f),g++):d()}if(b)d(b);else{var g=0;f()}})},d=function(a,c,d){b._async.readFile(a,null,f.FileFlag.getFileFlag("r"),function(e,g){if(e)d(e);else try{b._sync.writeFileSync(a,g,null,f.FileFlag.getFileFlag("w"),c)}catch(h){e=h}finally{d(e)}})},e=function(a,e){b._async.stat(a,!1,function(b,f){b?e(b):f.isDirectory()?c(a,f.mode,e):d(a,f.mode,e)})};c("/",0,function(c){c?a(c):(b._isInitialized=!0,a())})}},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.supportsLinks=function(){return!1},b.prototype.supportsProps=function(){return this._sync.supportsProps()&&this._async.supportsProps()},b.prototype.enqueueOp=function(a){var b=this;if(this._queue.push(a),!this._queueRunning){this._queueRunning=!0;var c=function(a){if(a&&console.error("WARNING: File system has desynchronized. Received following error: "+a+"\n$"),b._queue.length>0){var d=b._queue.shift(),e=d.arguments;e.push(c),b._async[d.apiMethod].apply(b._async,e)}else b._queueRunning=!1};c()}},b.prototype.renameSync=function(a,b){this._sync.renameSync(a,b),this.enqueueOp({apiMethod:"rename",arguments:[a,b]})},b.prototype.statSync=function(a,b){return this._sync.statSync(a,b)},b.prototype.openSync=function(a,b,c){var d=this._sync.openSync(a,b,c);return d.closeSync(),new i(this,a,b,this._sync.statSync(a,!1),this._sync.readFileSync(a,null,f.FileFlag.getFileFlag("r")))},b.prototype.unlinkSync=function(a){this._sync.unlinkSync(a),this.enqueueOp({apiMethod:"unlink",arguments:[a]})},b.prototype.rmdirSync=function(a){this._sync.rmdirSync(a),this.enqueueOp({apiMethod:"rmdir",arguments:[a]})},b.prototype.mkdirSync=function(a,b){this._sync.mkdirSync(a,b),this.enqueueOp({apiMethod:"mkdir",arguments:[a,b]})},b.prototype.readdirSync=function(a){return this._sync.readdirSync(a)},b.prototype.existsSync=function(a){return this._sync.existsSync(a)},b.prototype.chmodSync=function(a,b,c){this._sync.chmodSync(a,b,c),this.enqueueOp({apiMethod:"chmod",arguments:[a,b,c]})},b.prototype.chownSync=function(a,b,c,d){this._sync.chownSync(a,b,c,d),this.enqueueOp({apiMethod:"chown",arguments:[a,b,c,d]})},b.prototype.utimesSync=function(a,b,c){this._sync.utimesSync(a,b,c),this.enqueueOp({apiMethod:"utimes",arguments:[a,b,c]})},b}(e.SynchronousFileSystem);h.registerFileSystem("AsyncMirrorFS",j),b.exports=j},{"../core/browserfs":15,"../core/file_flag":22,"../core/file_system":23,"../generic/preload_file":36}],6:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("../generic/preload_file"),f=a("../core/file_system"),g=a("../core/node_fs_stats"),h=a("../core/buffer"),i=a("../core/api_error"),j=a("../core/node_path"),k=a("../core/browserfs"),l=a("../core/buffer_core_arraybuffer"),m=a("async"),n=h.Buffer,o=g.Stats,p=i.ApiError,q=i.ErrorCode,r=g.FileType,s=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return d(b,a),b.prototype.sync=function(a){var b=this;if(this.isDirty()){var c=this.getBuffer(),d=c.getBufferCore();d instanceof l.BufferCoreArrayBuffer||(c=new n(c.length),this.getBuffer().copy(c),d=c.getBufferCore());var e=d.getDataView(),f=new DataView(e.buffer,e.byteOffset+c.getOffset(),c.length);this._fs._writeFileStrict(this.getPath(),f,function(c){c||b.resetDirty(),a(c)})}else a()},b.prototype.close=function(a){this.sync(a)},b}(e.PreloadFile);c.DropboxFile=s;var t=function(a){function b(b){a.call(this),this.client=b}return d(b,a),b.prototype.getName=function(){return"Dropbox"},b.isAvailable=function(){return"undefined"!=typeof Dropbox},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSymlinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!1},b.prototype.empty=function(a){var b=this;this.client.readdir("/",function(c,d,e,f){if(c)a(b.convert(c));else{var g=function(a,c){b.client.remove(a.path,function(a,d){c(a?b.convert(a):a)})},h=function(c){c?a(b.convert(c)):a()};m.each(f,g,h)}})},b.prototype.rename=function(a,b,c){this.client.move(a,b,function(d,e){if(d){var f=d.response.error.indexOf(a)>-1?a:b;c(new p(q.ENOENT,f+" doesn't exist"))}else c()})},b.prototype.stat=function(a,b,c){var d=this;this.client.stat(a,function(b,e){if(!(b||null!=e&&e.isRemoved)){var f=new o(d._statType(e),e.size);return c(null,f)}c(new p(q.ENOENT,a+" doesn't exist"))})},b.prototype.open=function(a,b,c,d){var e=this;this.client.readFile(a,{arrayBuffer:!0},function(c,f,g,h){if(!c){var i;i=new n(null===f?0:f);var j=e._makeFile(a,b,g,i);return d(null,j)}if(b.isReadable())d(new p(q.ENOENT,a+" doesn't exist"));else switch(c.status){case 0:return console.error("No connection");case 404:var k=new ArrayBuffer(0);return e._writeFileStrict(a,k,function(c,f){if(c)d(c);else{var g=e._makeFile(a,b,f,new n(k));d(null,g)}});default:return console.log("Unhandled error: "+c)}})},b.prototype._writeFileStrict=function(a,b,c){var d=this,e=j.dirname(a);this.stat(e,!1,function(f,g){f?c(new p(q.ENOENT,"Can't create "+a+" because "+e+" doesn't exist")):d.client.writeFile(a,b,function(a,b){a?c(d.convert(a)):c(null,b)})})},b.prototype._statType=function(a){return a.isFile?r.FILE:r.DIRECTORY},b.prototype._makeFile=function(a,b,c,d){var e=this._statType(c),f=new o(e,c.size);return new s(this,a,b,f,d)},b.prototype._remove=function(a,b,c){var d=this;this.client.stat(a,function(e,f){e?b(new p(q.ENOENT,a+" doesn't exist")):f.isFile&&!c?b(new p(q.ENOTDIR,a+" is a file.")):!f.isFile&&c?b(new p(q.EISDIR,a+" is a directory.")):d.client.remove(a,function(c,d){b(c?new p(q.EIO,"Failed to remove "+a):null)})})},b.prototype.unlink=function(a,b){this._remove(a,b,!0)},b.prototype.rmdir=function(a,b){this._remove(a,b,!1)},b.prototype.mkdir=function(a,b,c){var d=this,e=j.dirname(a);this.client.stat(e,function(b,f){b?c(new p(q.ENOENT,"Can't create "+a+" because "+e+" doesn't exist")):d.client.mkdir(a,function(b,d){c(b?new p(q.EEXIST,a+" already exists"):null)})})},b.prototype.readdir=function(a,b){var c=this;this.client.readdir(a,function(a,d,e,f){return a?b(c.convert(a)):b(null,d)})},b.prototype.convert=function(a,b){switch(void 0===b&&(b=""),a.status){case 400:return new p(q.EINVAL,b);case 401:case 403:return new p(q.EIO,b);case 404:return new p(q.ENOENT,b);case 405:return new p(q.ENOTSUP,b);case 0:case 304:case 406:case 409:default:return new p(q.EIO,b)}},b}(f.BaseFileSystem);c.DropboxFileSystem=t,k.registerFileSystem("Dropbox",t)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/buffer_core_arraybuffer":19,"../core/file_system":23,"../core/node_fs_stats":27,"../core/node_path":28,"../generic/preload_file":36,async:1}],7:[function(a,b,c){function d(a,b,c,d){if("undefined"!=typeof navigator.webkitPersistentStorage)switch(a){case p.PERSISTENT:navigator.webkitPersistentStorage.requestQuota(b,c,d);break;case p.TEMPORARY:navigator.webkitTemporaryStorage.requestQuota(b,c,d);break;default:d(null)}else p.webkitStorageInfo.requestQuota(a,b,c,d)}function e(a){return Array.prototype.slice.call(a||[],0)}var f=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},g=a("../generic/preload_file"),h=a("../core/file_system"),i=a("../core/api_error"),j=a("../core/file_flag"),k=a("../core/node_fs_stats"),l=a("../core/buffer"),m=a("../core/browserfs"),n=a("../core/buffer_core_arraybuffer"),o=a("../core/node_path"),p=a("../core/global"),q=a("async"),r=l.Buffer,s=k.Stats,t=k.FileType,u=i.ApiError,v=i.ErrorCode,w=j.ActionType,x=p.webkitRequestFileSystem||p.requestFileSystem||null,y=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return f(b,a),b.prototype.sync=function(a){var b=this;if(this.isDirty()){var c={create:!1},d=this._fs,e=function(c){c.createWriter(function(c){var e=b.getBuffer(),f=e.getBufferCore();f instanceof n.BufferCoreArrayBuffer||(e=new r(e.length),b.getBuffer().copy(e),f=e.getBufferCore());var g=f.getDataView(),h=new DataView(g.buffer,g.byteOffset+e.getOffset(),e.length),i=new Blob([h]),j=i.size;c.onwriteend=function(){c.onwriteend=null,c.truncate(j),b.resetDirty(),a()},c.onerror=function(b){a(d.convert(b))},c.write(i)})},f=function(b){a(d.convert(b))};d.fs.root.getFile(this.getPath(),c,e,f)}else a()},b.prototype.close=function(a){this.sync(a)},b}(g.PreloadFile);c.HTML5FSFile=y;var z=function(a){function b(b,c){a.call(this),this.size=null!=b?b:5,this.type=null!=c?c:p.PERSISTENT;var d=1024,e=d*d;this.size*=e}return f(b,a),b.prototype.getName=function(){return"HTML5 FileSystem"},b.isAvailable=function(){return null!=x},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSymlinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!1},b.prototype.convert=function(a,b){switch(void 0===b&&(b=""),a.name){case"QuotaExceededError":return new u(v.ENOSPC,b);case"NotFoundError":return new u(v.ENOENT,b);case"SecurityError":return new u(v.EACCES,b);case"InvalidModificationError":return new u(v.EPERM,b);case"SyntaxError":case"TypeMismatchError":return new u(v.EINVAL,b);default:return new u(v.EINVAL,b)}},b.prototype.convertErrorEvent=function(a,b){return void 0===b&&(b=""),new u(v.ENOENT,a.message+"; "+b)},b.prototype.allocate=function(a){var b=this;void 0===a&&(a=function(){});var c=function(c){b.fs=c,a()},e=function(c){a(b.convert(c))};this.type===p.PERSISTENT?d(this.type,this.size,function(a){x(b.type,a,c,e)},e):x(this.type,this.size,c,e)},b.prototype.empty=function(a){var b=this;this._readdir("/",function(c,d){if(c)console.error("Failed to empty FS"),a(c);else{var e=function(b){c?(console.error("Failed to empty FS"),a(c)):a()},f=function(a,c){var d=function(){c()},e=function(d){c(b.convert(d,a.fullPath))};a.isFile?a.remove(d,e):a.removeRecursively(d,e)};q.each(d,f,e)}})},b.prototype.rename=function(a,b,c){var d=this,e=2,f=0,g=this.fs.root,h=function(f){0===--e&&c(d.convert(f,"Failed to rename "+a+" to "+b+"."))},i=function(e){return 2===++f?void console.error("Something was identified as both a file and a directory. This should never happen."):a===b?c():void g.getDirectory(o.dirname(b),{},function(f){e.moveTo(f,o.basename(b),function(a){c()},function(f){e.isDirectory?d.unlink(b,function(e){e?h(f):d.rename(a,b,c)}):h(f)})},h)};g.getFile(a,{},i,h),g.getDirectory(a,{},i,h)},b.prototype.stat=function(a,b,c){var d=this,e={create:!1},f=function(a){var b=function(a){var b=new s(t.FILE,a.size);c(null,b)};a.file(b,h)},g=function(a){var b=4096,d=new s(t.DIRECTORY,b);c(null,d)},h=function(b){c(d.convert(b,a))},i=function(){d.fs.root.getDirectory(a,e,g,h)};this.fs.root.getFile(a,e,f,i)},b.prototype.open=function(a,b,c,d){var e=this,f={create:b.pathNotExistsAction()===w.CREATE_FILE,exclusive:b.isExclusive()},g=function(b){d(e.convertErrorEvent(b,a))},h=function(b){d(e.convert(b,a))},i=function(c){var f=function(c){var f=new FileReader;f.onloadend=function(g){var h=e._makeFile(a,b,c,f.result);d(null,h)},f.onerror=g,f.readAsArrayBuffer(c)};c.file(f,h)};this.fs.root.getFile(a,f,i,g)},b.prototype._statType=function(a){return a.isFile?t.FILE:t.DIRECTORY},b.prototype._makeFile=function(a,b,c,d){void 0===d&&(d=new ArrayBuffer(0));var e=new s(t.FILE,c.size),f=new r(d);return new y(this,a,b,e,f)},b.prototype._remove=function(a,b,c){var d=this,e=function(c){var e=function(){b()},f=function(c){b(d.convert(c,a))};c.remove(e,f)},f=function(c){b(d.convert(c,a))},g={create:!1};c?this.fs.root.getFile(a,g,e,f):this.fs.root.getDirectory(a,g,e,f)},b.prototype.unlink=function(a,b){this._remove(a,b,!0)},b.prototype.rmdir=function(a,b){this._remove(a,b,!1)},b.prototype.mkdir=function(a,b,c){var d=this,e={create:!0,exclusive:!0},f=function(a){c()},g=function(b){c(d.convert(b,a))};this.fs.root.getDirectory(a,e,f,g)},b.prototype._readdir=function(a,b){var c=this;this.fs.root.getDirectory(a,{create:!1},function(d){var f=d.createReader(),g=[],h=function(d){b(c.convert(d,a))},i=function(){f.readEntries(function(a){a.length?(g=g.concat(e(a)),i()):b(null,g)},h)};i()})},b.prototype.readdir=function(a,b){this._readdir(a,function(a,c){if(null!=a)return b(a);for(var d=[],e=0;e<c.length;e++)d.push(c[e].name);b(null,d)})},b}(h.BaseFileSystem);c.HTML5FS=z,m.registerFileSystem("HTML5FS",z)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/buffer_core_arraybuffer":19,"../core/file_flag":22,"../core/file_system":23,"../core/global":24,"../core/node_fs_stats":27,"../core/node_path":28,"../generic/preload_file":36,async:1}],8:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("../generic/key_value_filesystem"),f=a("../core/browserfs"),g=function(){function a(){this.store={}}return a.prototype.name=function(){return"In-memory"},a.prototype.clear=function(){this.store={}},a.prototype.beginTransaction=function(a){return new e.SimpleSyncRWTransaction(this)},a.prototype.get=function(a){return this.store[a]},a.prototype.put=function(a,b,c){return!c&&this.store.hasOwnProperty(a)?!1:(this.store[a]=b,!0)},a.prototype["delete"]=function(a){delete this.store[a]},a}();c.InMemoryStore=g;var h=function(a){function b(){a.call(this,{store:new g})}return d(b,a),b}(e.SyncKeyValueFileSystem);c.InMemoryFileSystem=h,f.registerFileSystem("InMemory",h)},{"../core/browserfs":15,"../generic/key_value_filesystem":35}],9:[function(a,b,c){var d,e=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},f=a("../core/buffer"),g=a("../core/browserfs"),h=a("../generic/key_value_filesystem"),i=a("../core/api_error"),j=a("../core/global"),k=f.Buffer,l=i.ApiError,m=i.ErrorCode,n=!1;try{j.localStorage.setItem("__test__",String.fromCharCode(55296)),n=j.localStorage.getItem("__test__")===String.fromCharCode(55296)}catch(o){n=!1}d=n?"binary_string":"binary_string_ie";var p=function(){function a(){}return a.prototype.name=function(){return"LocalStorage"},a.prototype.clear=function(){j.localStorage.clear()},a.prototype.beginTransaction=function(a){return new h.SimpleSyncRWTransaction(this)},a.prototype.get=function(a){try{var b=j.localStorage.getItem(a);if(null!==b)return new k(b,d)}catch(c){}return void 0},a.prototype.put=function(a,b,c){try{return c||null===j.localStorage.getItem(a)?(j.localStorage.setItem(a,b.toString(d)),!0):!1}catch(e){throw new l(m.ENOSPC,"LocalStorage is full.")}},a.prototype["delete"]=function(a){try{j.localStorage.removeItem(a)}catch(b){throw new l(m.EIO,"Unable to delete key "+a+": "+b)}},a}();c.LocalStorageStore=p;var q=function(a){function b(){a.call(this,{store:new p})}return e(b,a),b.isAvailable=function(){return"undefined"!=typeof j.localStorage},b}(h.SyncKeyValueFileSystem);c.LocalStorageFileSystem=q,g.registerFileSystem("LocalStorage",q)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/global":24,"../generic/key_value_filesystem":35}],10:[function(a,b,c){function d(a,b,c){return b?function(){for(var b=[],c=0;c<arguments.length;c++)b[c-0]=arguments[c];var d=b[0],e=this._get_fs(d);b[0]=e.path;try{return e.fs[a].apply(e.fs,b)}catch(f){throw this.standardizeError(f,e.path,d),f}}:function(){for(var b=[],c=0;c<arguments.length;c++)b[c-0]=arguments[c];var d=b[0],e=this._get_fs(d);if(b[0]=e.path,"function"==typeof b[b.length-1]){var f=b[b.length-1],g=this;b[b.length-1]=function(){for(var a=[],b=0;b<arguments.length;b++)a[b-0]=arguments[b];a.length>0&&a[0]instanceof h.ApiError&&g.standardizeError(a[0],e.path,d),f.apply(null,a)}}return e.fs[a].apply(e.fs,b)}}var e=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},f=a("../core/file_system"),g=a("./in_memory"),h=a("../core/api_error"),i=a("../core/node_fs"),j=a("../core/browserfs"),k=h.ApiError,l=h.ErrorCode,m=function(a){function b(){a.call(this),this.mntMap={},this.rootFs=new g.InMemoryFileSystem}return e(b,a),b.prototype.mount=function(a,b){if(this.mntMap[a])throw new k(l.EINVAL,"Mount point "+a+" is already taken.");this.rootFs.mkdirSync(a,511),this.mntMap[a]=b},b.prototype.umount=function(a){if(!this.mntMap[a])throw new k(l.EINVAL,"Mount point "+a+" is already unmounted.");delete this.mntMap[a],this.rootFs.rmdirSync(a)},b.prototype._get_fs=function(a){for(var b in this.mntMap){var c=this.mntMap[b];if(0===a.indexOf(b))return a=a.substr(b.length>1?b.length:0),""===a&&(a="/"),{fs:c,path:a}}return{fs:this.rootFs,path:a}},b.prototype.getName=function(){return"MountableFileSystem"},b.isAvailable=function(){return!0},b.prototype.diskSpace=function(a,b){b(0,0)},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsLinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.standardizeError=function(a,b,c){var d;return-1!==(d=a.message.indexOf(b))&&(a.message=a.message.substr(0,d)+c+a.message.substr(d+b.length)),a},b.prototype.rename=function(a,b,c){var d=this._get_fs(a),e=this._get_fs(b);if(d.fs===e.fs){var f=this;return d.fs.rename(d.path,e.path,function(g){g&&f.standardizeError(f.standardizeError(g,d.path,a),e.path,b),c(g)})}return i.readFile(a,function(d,e){return d?c(d):void i.writeFile(b,e,function(b){return b?c(b):void i.unlink(a,c)})})},b.prototype.renameSync=function(a,b){var c=this._get_fs(a),d=this._get_fs(b);if(c.fs===d.fs)try{return c.fs.renameSync(c.path,d.path)}catch(e){throw this.standardizeError(this.standardizeError(e,c.path,a),d.path,b),e}var f=i.readFileSync(a);return i.writeFileSync(b,f),i.unlinkSync(a)},b}(f.BaseFileSystem);c.MountableFileSystem=m;for(var n=[["readdir","exists","unlink","rmdir","readlink"],["stat","mkdir","realpath","truncate"],["open","readFile","chmod","utimes"],["chown"],["writeFile","appendFile"]],o=0;o<n.length;o++)for(var p=n[o],q=0;q<p.length;q++){var r=p[q];m.prototype[r]=d(r,!1,o+1),m.prototype[r+"Sync"]=d(r+"Sync",!0,o+1)}j.registerFileSystem("MountableFileSystem",m)},{"../core/api_error":14,"../core/browserfs":15,"../core/file_system":23,"../core/node_fs":26,"./in_memory":8}],11:[function(a,b,c){function d(a){return 146|a}var e=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},f=a("../core/file_system"),g=a("../core/buffer"),h=a("../core/api_error"),i=a("../core/file_flag"),j=a("../generic/preload_file"),k=a("../core/browserfs"),l=a("../core/node_path"),m=h.ApiError,n=g.Buffer,o=h.ErrorCode,p="/.deletedFiles.log",q=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return e(b,a),b.prototype.syncSync=function(){this.isDirty()&&(this._fs._syncSync(this),this.resetDirty())},b.prototype.closeSync=function(){this.syncSync()},b}(j.PreloadFile),r=function(a){function b(b,c){if(a.call(this),this._isInitialized=!1,this._deletedFiles={},this._deleteLog=null,this._writable=b,this._readable=c,this._writable.isReadOnly())throw new m(o.EINVAL,"Writable file system must be writable.");if(!this._writable.supportsSynch()||!this._readable.supportsSynch())throw new m(o.EINVAL,"OverlayFS currently only operates on synchronous file systems.")}return e(b,a),b.prototype.getOverlayedFileSystems=function(){return{readable:this._readable,writable:this._writable}},b.prototype.createParentDirectories=function(a){for(var b=this,c=l.dirname(a),d=[];!this._writable.existsSync(c);)d.push(c),c=l.dirname(c);d=d.reverse(),d.forEach(function(a){b._writable.mkdirSync(a,b.statSync(a,!1).mode)})},b.isAvailable=function(){return!0},b.prototype._syncSync=function(a){this.createParentDirectories(a.getPath()),this._writable.writeFileSync(a.getPath(),a.getBuffer(),null,i.FileFlag.getFileFlag("w"),a.getStats().mode)},b.prototype.getName=function(){return"OverlayFS"},b.prototype.initialize=function(a){var b=this;this._isInitialized?a():this._writable.readFile(p,"utf8",i.FileFlag.getFileFlag("r"),function(c,d){if(c){if(c.type!==o.ENOENT)return a(c)}else d.split("\n").forEach(function(a){b._deletedFiles[a.slice(1)]="d"===a.slice(0,1)});b._writable.open(p,i.FileFlag.getFileFlag("a"),420,function(c,d){c?a(c):(b._deleteLog=d,a())})})},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.supportsLinks=function(){return!1},b.prototype.supportsProps=function(){return this._readable.supportsProps()&&this._writable.supportsProps();
},b.prototype.deletePath=function(a){this._deletedFiles[a]=!0;var b=new n("d"+a+"\n");this._deleteLog.writeSync(b,0,b.length,null),this._deleteLog.syncSync()},b.prototype.undeletePath=function(a){if(this._deletedFiles[a]){this._deletedFiles[a]=!1;var b=new n("u"+a);this._deleteLog.writeSync(b,0,b.length,null),this._deleteLog.syncSync()}},b.prototype.renameSync=function(a,b){var c=this,d=this.statSync(a,!1);if(d.isDirectory()){if(a===b)return;var e=511;if(this.existsSync(b)){var f=this.statSync(b,!1),e=f.mode;if(!f.isDirectory())throw new m(o.ENOTDIR,"Path "+b+" is a file.");if(this.readdirSync(b).length>0)throw new m(o.ENOTEMPTY,"Path "+b+" not empty.")}this._writable.existsSync(a)?this._writable.renameSync(a,b):this._writable.existsSync(b)||this._writable.mkdirSync(b,e),this._readable.existsSync(a)&&this._readable.readdirSync(a).forEach(function(d){c.renameSync(l.resolve(a,d),l.resolve(b,d))})}else{if(this.existsSync(b)&&this.statSync(b,!1).isDirectory())throw new m(o.EISDIR,"Path "+b+" is a directory.");this.writeFileSync(b,this.readFileSync(a,null,i.FileFlag.getFileFlag("r")),null,i.FileFlag.getFileFlag("w"),d.mode)}a!==b&&this.existsSync(a)&&this.unlinkSync(a)},b.prototype.statSync=function(a,b){try{return this._writable.statSync(a,b)}catch(c){if(this._deletedFiles[a])throw new m(o.ENOENT,"Path "+a+" does not exist.");var e=this._readable.statSync(a,b).clone();return e.mode=d(e.mode),e}},b.prototype.openSync=function(a,b,c){if(this.existsSync(a))switch(b.pathExistsAction()){case i.ActionType.TRUNCATE_FILE:return this.createParentDirectories(a),this._writable.openSync(a,b,c);case i.ActionType.NOP:if(this._writable.existsSync(a))return this._writable.openSync(a,b,c);var d=this._readable.statSync(a,!1).clone();return d.mode=c,new q(this,a,b,d,this._readable.readFileSync(a,null,i.FileFlag.getFileFlag("r")));default:throw new m(o.EEXIST,"Path "+a+" exists.")}else switch(b.pathNotExistsAction()){case i.ActionType.CREATE_FILE:return this.createParentDirectories(a),this._writable.openSync(a,b,c);default:throw new m(o.ENOENT,"Path "+a+" does not exist.")}},b.prototype.unlinkSync=function(a){if(!this.existsSync(a))throw new m(o.ENOENT,"Path "+a+" does not exist.");this._writable.existsSync(a)&&this._writable.unlinkSync(a),this.existsSync(a)&&this.deletePath(a)},b.prototype.rmdirSync=function(a){if(!this.existsSync(a))throw new m(o.ENOENT,"Path "+a+" does not exist.");if(this._writable.existsSync(a)&&this._writable.rmdirSync(a),this.existsSync(a)){if(this.readdirSync(a).length>0)throw new m(o.ENOTEMPTY,"Directory "+a+" is not empty.");this.deletePath(a)}},b.prototype.mkdirSync=function(a,b){if(this.existsSync(a))throw new m(o.EEXIST,"Path "+a+" already exists.");this.createParentDirectories(a),this._writable.mkdirSync(a,b)},b.prototype.readdirSync=function(a){var b=this,c=this.statSync(a,!1);if(!c.isDirectory())throw new m(o.ENOTDIR,"Path "+a+" is not a directory.");var d=[];try{d=d.concat(this._writable.readdirSync(a))}catch(e){}try{d=d.concat(this._readable.readdirSync(a))}catch(e){}var f={};return d.filter(function(c){var d=void 0===f[c]&&b._deletedFiles[a+"/"+c]!==!0;return f[c]=!0,d})},b.prototype.existsSync=function(a){return this._writable.existsSync(a)||this._readable.existsSync(a)&&this._deletedFiles[a]!==!0},b.prototype.chmodSync=function(a,b,c){var d=this;this.operateOnWritable(a,function(){d._writable.chmodSync(a,b,c)})},b.prototype.chownSync=function(a,b,c,d){var e=this;this.operateOnWritable(a,function(){e._writable.chownSync(a,b,c,d)})},b.prototype.utimesSync=function(a,b,c){var d=this;this.operateOnWritable(a,function(){d._writable.utimesSync(a,b,c)})},b.prototype.operateOnWritable=function(a,b){if(!this.existsSync(a))throw new m(o.ENOENT,"Path "+a+" does not exist.");this._writable.existsSync(a)||this.copyToWritable(a),b()},b.prototype.copyToWritable=function(a){var b=this.statSync(a,!1);b.isDirectory()?this._writable.mkdirSync(a,b.mode):this.writeFileSync(a,this._readable.readFileSync(a,null,i.FileFlag.getFileFlag("r")),null,i.FileFlag.getFileFlag("w"),this.statSync(a,!1).mode)},b}(f.SynchronousFileSystem);k.registerFileSystem("OverlayFS",r),b.exports=r},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/file_flag":22,"../core/file_system":23,"../core/node_path":28,"../generic/preload_file":36}],12:[function(a,b,c){function d(a){return{type:l.ERROR,errorData:a.writeToBuffer().toArrayBuffer()}}function e(a){return p.ApiError.fromBuffer(new v(a.errorData))}function f(a){return{type:l.STATS,statsData:a.toBuffer().toArrayBuffer()}}function g(a){return s.Stats.fromBuffer(new v(a.statsData))}function h(a){return{type:l.FILEFLAG,flagStr:a.getFlagString()}}function i(a){return q.FileFlag.getFileFlag(a.flagStr)}function j(a){return{type:l.BUFFER,data:a.toArrayBuffer()}}function k(a){return new v(a.data)}var l,m=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},n=a("../core/file_system"),o=a("../core/buffer"),p=a("../core/api_error"),q=a("../core/file_flag"),r=a("../core/file"),s=a("../core/node_fs_stats"),t=a("../generic/preload_file"),u=a("../core/browserfs"),v=o.Buffer;!function(a){a[a.CB=0]="CB",a[a.FD=1]="FD",a[a.ERROR=2]="ERROR",a[a.STATS=3]="STATS",a[a.PROBE=4]="PROBE",a[a.FILEFLAG=5]="FILEFLAG",a[a.BUFFER=6]="BUFFER"}(l||(l={}));var w=function(){function a(){this._callbacks={},this._nextId=0}return a.prototype.toRemoteArg=function(a){var b=this._nextId++;return this._callbacks[b]=a,{type:l.CB,id:b}},a.prototype.toLocalArg=function(a){var b=this._callbacks[a];return delete this._callbacks[a],b},a}(),x=function(){function a(){this._fileDescriptors={},this._nextId=0}return a.prototype.toRemoteArg=function(a,b,c,d){var e,f,g=this._nextId++;this._fileDescriptors[g]=a,a.stat(function(h,i){h?d(h):(f=i.toBuffer().toArrayBuffer(),c.isReadable()?a.read(new v(i.size),0,i.size,0,function(a,h,i){a?d(a):(e=i.toArrayBuffer(),d(null,{type:l.FD,id:g,data:e,stat:f,path:b,flag:c.getFlagString()}))}):d(null,{type:l.FD,id:g,data:new ArrayBuffer(0),stat:f,path:b,flag:c.getFlagString()}))})},a.prototype._applyFdChanges=function(a,b){var c=this._fileDescriptors[a.id],d=new v(a.data),e=s.Stats.fromBuffer(new v(a.stat)),f=q.FileFlag.getFileFlag(a.flag);f.isWriteable()?c.write(d,0,d.length,f.isAppendable()?c.getPos():0,function(a){function g(){c.stat(function(a,d){a?b(a):d.mode!==e.mode?c.chmod(e.mode,function(a){b(a,c)}):b(a,c)})}a?b(a):f.isAppendable()?g():c.truncate(d.length,function(){g()})}):b(null,c)},a.prototype.applyFdAPIRequest=function(a,b){var c=this,d=a.args[0];this._applyFdChanges(d,function(e,f){e?b(e):f[a.method](function(e){"close"===a.method&&delete c._fileDescriptors[d.id],b(e)})})},a}(),y=function(a){function b(b,c,d,e,f,g){a.call(this,b,c,d,e,g),this._remoteFdId=f}return m(b,a),b.prototype.getRemoteFdId=function(){return this._remoteFdId},b.prototype.toRemoteArg=function(){return{type:l.FD,id:this._remoteFdId,data:this.getBuffer().toArrayBuffer(),stat:this.getStats().toBuffer().toArrayBuffer(),path:this.getPath(),flag:this.getFlag().getFlagString()}},b.prototype._syncClose=function(a,b){var c=this;this.isDirty()?this._fs.syncClose(a,this,function(a){a||c.resetDirty(),b(a)}):b()},b.prototype.sync=function(a){this._syncClose("sync",a)},b.prototype.close=function(a){this._syncClose("close",a)},b}(t.PreloadFile),z=function(a){function b(b){var c=this;a.call(this),this._callbackConverter=new w,this._isInitialized=!1,this._isReadOnly=!1,this._supportLinks=!1,this._supportProps=!1,this._outstandingRequests={},this._worker=b,this._worker.addEventListener("message",function(a){if(null!=a.data&&"object"==typeof a.data&&a.data.hasOwnProperty("browserfsMessage")&&a.data.browserfsMessage){var b,d=a.data,e=d.args,f=new Array(e.length);for(b=0;b<f.length;b++)f[b]=c._argRemote2Local(e[b]);c._callbackConverter.toLocalArg(d.cbId).apply(null,f)}})}return m(b,a),b.isAvailable=function(){return"undefined"!=typeof Worker},b.prototype.getName=function(){return"WorkerFS"},b.prototype._argRemote2Local=function(a){if(null==a)return a;switch(typeof a){case"object":if(null==a.type||"number"!=typeof a.type)return a;var b=a;switch(b.type){case l.ERROR:return e(b);case l.FD:var c=b;return new y(this,c.path,q.FileFlag.getFileFlag(c.flag),s.Stats.fromBuffer(new v(c.stat)),c.id,new v(c.data));case l.STATS:return g(b);case l.FILEFLAG:return i(b);case l.BUFFER:return k(b);default:return a}default:return a}},b.prototype._argLocal2Remote=function(a){if(null==a)return a;switch(typeof a){case"object":return a instanceof s.Stats?f(a):a instanceof p.ApiError?d(a):a instanceof y?a.toRemoteArg():a instanceof q.FileFlag?h(a):a instanceof v?j(a):a;case"function":return this._callbackConverter.toRemoteArg(a);default:return a}},b.prototype.initialize=function(a){var b=this;if(this._isInitialized)a();else{var c={browserfsMessage:!0,method:"probe",args:[this._callbackConverter.toRemoteArg(function(c){b._isInitialized=!0,b._isReadOnly=c.isReadOnly,b._supportLinks=c.supportsLinks,b._supportProps=c.supportsProps,a()})]};this._worker.postMessage(c)}},b.prototype.isReadOnly=function(){return this._isReadOnly},b.prototype.supportsSynch=function(){return!1},b.prototype.supportsLinks=function(){return this._supportLinks},b.prototype.supportsProps=function(){return this._supportProps},b.prototype._rpc=function(a,b){var c,d={browserfsMessage:!0,method:a,args:null},e=new Array(b.length);for(c=0;c<b.length;c++)e[c]=this._argLocal2Remote(b[c]);d.args=e,this._worker.postMessage(d)},b.prototype.rename=function(a,b,c){this._rpc("rename",arguments)},b.prototype.stat=function(a,b,c){this._rpc("stat",arguments)},b.prototype.open=function(a,b,c,d){this._rpc("open",arguments)},b.prototype.unlink=function(a,b){this._rpc("unlink",arguments)},b.prototype.rmdir=function(a,b){this._rpc("rmdir",arguments)},b.prototype.mkdir=function(a,b,c){this._rpc("mkdir",arguments)},b.prototype.readdir=function(a,b){this._rpc("readdir",arguments)},b.prototype.exists=function(a,b){this._rpc("exists",arguments)},b.prototype.realpath=function(a,b,c){this._rpc("realpath",arguments)},b.prototype.truncate=function(a,b,c){this._rpc("truncate",arguments)},b.prototype.readFile=function(a,b,c,d){this._rpc("readFile",arguments)},b.prototype.writeFile=function(a,b,c,d,e,f){this._rpc("writeFile",arguments)},b.prototype.appendFile=function(a,b,c,d,e,f){this._rpc("appendFile",arguments)},b.prototype.chmod=function(a,b,c,d){this._rpc("chmod",arguments)},b.prototype.chown=function(a,b,c,d,e){this._rpc("chown",arguments)},b.prototype.utimes=function(a,b,c,d){this._rpc("utimes",arguments)},b.prototype.link=function(a,b,c){this._rpc("link",arguments)},b.prototype.symlink=function(a,b,c,d){this._rpc("symlink",arguments)},b.prototype.readlink=function(a,b){this._rpc("readlink",arguments)},b.prototype.syncClose=function(a,b,c){this._worker.postMessage({browserfsMessage:!0,method:a,args:[b.toRemoteArg(),this._callbackConverter.toRemoteArg(c)]})},b.attachRemoteListener=function(a){function b(a,b,c){switch(typeof a){case"object":a instanceof s.Stats?c(null,f(a)):a instanceof p.ApiError?c(null,d(a)):a instanceof r.BaseFile?c(null,m.toRemoteArg(a,b[0],b[1],c)):a instanceof q.FileFlag?c(null,h(a)):a instanceof v?c(null,j(a)):c(null,a);break;default:c(null,a)}}function c(c,f){if(null==c)return c;switch(typeof c){case"object":if("number"!=typeof c.type)return c;var h=c;switch(h.type){case l.CB:var j=c.id;return function(){function c(b){i>0&&(i=-1,g={browserfsMessage:!0,cbId:j,args:[d(b)]},a.postMessage(g))}var e,g,h=new Array(arguments.length),i=arguments.length;for(e=0;e<arguments.length;e++)!function(d,e){b(e,f,function(b,e){h[d]=e,b?c(b):0===--i&&(g={browserfsMessage:!0,cbId:j,args:h},a.postMessage(g))})}(e,arguments[e]);0===arguments.length&&(g={browserfsMessage:!0,cbId:j,args:h},a.postMessage(g))};case l.ERROR:return e(h);case l.STATS:return g(h);case l.FILEFLAG:return i(h);case l.BUFFER:return k(h);default:return c}default:return c}}var m=new x,n=u.BFSRequire("fs");a.addEventListener("message",function(b){if(null!=b.data&&"object"==typeof b.data&&b.data.hasOwnProperty("browserfsMessage")&&b.data.browserfsMessage){var e,f=b.data,g=f.args,h=new Array(g.length);switch(f.method){case"close":case"sync":!function(){var b=g[1];m.applyFdAPIRequest(f,function(c){var e={browserfsMessage:!0,cbId:b.id,args:c?[d(c)]:[]};a.postMessage(e)})}();break;case"probe":!function(){var b=n.getRootFS(),c=g[0],d={browserfsMessage:!0,cbId:c.id,args:[{type:l.PROBE,isReadOnly:b.isReadOnly(),supportsLinks:b.supportsLinks(),supportsProps:b.supportsProps()}]};a.postMessage(d)}();break;default:for(e=0;e<g.length;e++)h[e]=c(g[e],h);var i=n.getRootFS();i[f.method].apply(i,h)}}})},b}(n.BaseFileSystem);c.WorkerFS=z,u.registerFileSystem("WorkerFS",z)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/file":21,"../core/file_flag":22,"../core/file_system":23,"../core/node_fs_stats":27,"../generic/preload_file":36}],13:[function(a,b,c){function d(a,b){var c=31&b,d=(b>>5&15)-1,e=(b>>9)+1980,f=31&a,g=a>>5&63,h=a>>11;return new Date(e,d,c,h,g,f)}function e(a,b,c,d){return 0===d?"":a.toString(b?"utf8":"extended_ascii",c,c+d)}var f=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},g=a("../core/buffer"),h=a("../core/api_error"),i=a("../generic/file_index"),j=a("../core/browserfs"),k=a("../core/node_fs_stats"),l=a("../core/file_system"),m=a("../core/file_flag"),n=a("../core/buffer_core_arraybuffer"),o=a("../generic/preload_file"),p=a("zlib-inflate").inflateRaw,q=h.ApiError,r=h.ErrorCode,s=m.ActionType;!function(a){a[a.MSDOS=0]="MSDOS",a[a.AMIGA=1]="AMIGA",a[a.OPENVMS=2]="OPENVMS",a[a.UNIX=3]="UNIX",a[a.VM_CMS=4]="VM_CMS",a[a.ATARI_ST=5]="ATARI_ST",a[a.OS2_HPFS=6]="OS2_HPFS",a[a.MAC=7]="MAC",a[a.Z_SYSTEM=8]="Z_SYSTEM",a[a.CP_M=9]="CP_M",a[a.NTFS=10]="NTFS",a[a.MVS=11]="MVS",a[a.VSE=12]="VSE",a[a.ACORN_RISC=13]="ACORN_RISC",a[a.VFAT=14]="VFAT",a[a.ALT_MVS=15]="ALT_MVS",a[a.BEOS=16]="BEOS",a[a.TANDEM=17]="TANDEM",a[a.OS_400=18]="OS_400",a[a.OSX=19]="OSX"}(c.ExternalFileAttributeType||(c.ExternalFileAttributeType={}));c.ExternalFileAttributeType;!function(a){a[a.STORED=0]="STORED",a[a.SHRUNK=1]="SHRUNK",a[a.REDUCED_1=2]="REDUCED_1",a[a.REDUCED_2=3]="REDUCED_2",a[a.REDUCED_3=4]="REDUCED_3",a[a.REDUCED_4=5]="REDUCED_4",a[a.IMPLODE=6]="IMPLODE",a[a.DEFLATE=8]="DEFLATE",a[a.DEFLATE64=9]="DEFLATE64",a[a.TERSE_OLD=10]="TERSE_OLD",a[a.BZIP2=12]="BZIP2",a[a.LZMA=14]="LZMA",a[a.TERSE_NEW=18]="TERSE_NEW",a[a.LZ77=19]="LZ77",a[a.WAVPACK=97]="WAVPACK",a[a.PPMD=98]="PPMD"}(c.CompressionMethod||(c.CompressionMethod={}));var t=c.CompressionMethod,u=function(){function a(a){if(this.data=a,67324752!==a.readUInt32LE(0))throw new q(r.EINVAL,"Invalid Zip file: Local file header has invalid signature: "+this.data.readUInt32LE(0))}return a.prototype.versionNeeded=function(){return this.data.readUInt16LE(4)},a.prototype.flags=function(){return this.data.readUInt16LE(6)},a.prototype.compressionMethod=function(){return this.data.readUInt16LE(8)},a.prototype.lastModFileTime=function(){return d(this.data.readUInt16LE(10),this.data.readUInt16LE(12))},a.prototype.crc32=function(){return this.data.readUInt32LE(14)},a.prototype.fileNameLength=function(){return this.data.readUInt16LE(26)},a.prototype.extraFieldLength=function(){return this.data.readUInt16LE(28)},a.prototype.fileName=function(){return e(this.data,this.useUTF8(),30,this.fileNameLength())},a.prototype.extraField=function(){var a=30+this.fileNameLength();return this.data.slice(a,a+this.extraFieldLength())},a.prototype.totalSize=function(){return 30+this.fileNameLength()+this.extraFieldLength()},a.prototype.useUTF8=function(){return 2048===(2048&this.flags())},a}();c.FileHeader=u;var v=function(){function a(a,b,c){this.header=a,this.record=b,this.data=c}return a.prototype.decompress=function(){var a=this.data,b=this.header.compressionMethod();switch(b){case t.DEFLATE:if(a.getBufferCore()instanceof n.BufferCoreArrayBuffer){var c=a.getBufferCore(),d=c.getDataView(),e=d.byteOffset+a.getOffset(),f=new Uint8Array(d.buffer).subarray(e,e+this.record.compressedSize()),h=p(f,{chunkSize:this.record.uncompressedSize()});return new g.Buffer(new n.BufferCoreArrayBuffer(h.buffer),h.byteOffset,h.byteOffset+h.length)}var i=a.slice(0,this.record.compressedSize());return new g.Buffer(p(i.toJSON().data,{chunkSize:this.record.uncompressedSize()}));case t.STORED:return a.sliceCopy(0,this.record.uncompressedSize());default:var j=t[b];throw j=j?j:"Unknown: "+b,new q(r.EINVAL,"Invalid compression method on file '"+this.header.fileName()+"': "+j)}},a}();c.FileData=v;var w=function(){function a(a){this.data=a}return a.prototype.crc32=function(){return this.data.readUInt32LE(0)},a.prototype.compressedSize=function(){return this.data.readUInt32LE(4)},a.prototype.uncompressedSize=function(){return this.data.readUInt32LE(8)},a}();c.DataDescriptor=w;var x=function(){function a(a){if(this.data=a,134630224!==this.data.readUInt32LE(0))throw new q(r.EINVAL,"Invalid archive extra data record signature: "+this.data.readUInt32LE(0))}return a.prototype.length=function(){return this.data.readUInt32LE(4)},a.prototype.extraFieldData=function(){return this.data.slice(8,8+this.length())},a}();c.ArchiveExtraDataRecord=x;var y=function(){function a(a){if(this.data=a,84233040!==this.data.readUInt32LE(0))throw new q(r.EINVAL,"Invalid digital signature signature: "+this.data.readUInt32LE(0))}return a.prototype.size=function(){return this.data.readUInt16LE(4)},a.prototype.signatureData=function(){return this.data.slice(6,6+this.size())},a}();c.DigitalSignature=y;var z=function(){function a(a,b){if(this.zipData=a,this.data=b,33639248!==this.data.readUInt32LE(0))throw new q(r.EINVAL,"Invalid Zip file: Central directory record has invalid signature: "+this.data.readUInt32LE(0))}return a.prototype.versionMadeBy=function(){return this.data.readUInt16LE(4)},a.prototype.versionNeeded=function(){return this.data.readUInt16LE(6)},a.prototype.flag=function(){return this.data.readUInt16LE(8)},a.prototype.compressionMethod=function(){return this.data.readUInt16LE(10)},a.prototype.lastModFileTime=function(){return d(this.data.readUInt16LE(12),this.data.readUInt16LE(14))},a.prototype.crc32=function(){return this.data.readUInt32LE(16)},a.prototype.compressedSize=function(){return this.data.readUInt32LE(20)},a.prototype.uncompressedSize=function(){return this.data.readUInt32LE(24)},a.prototype.fileNameLength=function(){return this.data.readUInt16LE(28)},a.prototype.extraFieldLength=function(){return this.data.readUInt16LE(30)},a.prototype.fileCommentLength=function(){return this.data.readUInt16LE(32)},a.prototype.diskNumberStart=function(){return this.data.readUInt16LE(34)},a.prototype.internalAttributes=function(){return this.data.readUInt16LE(36)},a.prototype.externalAttributes=function(){return this.data.readUInt32LE(38)},a.prototype.headerRelativeOffset=function(){return this.data.readUInt32LE(42)},a.prototype.fileName=function(){var a=e(this.data,this.useUTF8(),46,this.fileNameLength());return a.replace(/\\/g,"/")},a.prototype.extraField=function(){var a=44+this.fileNameLength();return this.data.slice(a,a+this.extraFieldLength())},a.prototype.fileComment=function(){var a=46+this.fileNameLength()+this.extraFieldLength();return e(this.data,this.useUTF8(),a,this.fileCommentLength())},a.prototype.totalSize=function(){return 46+this.fileNameLength()+this.extraFieldLength()+this.fileCommentLength()},a.prototype.isDirectory=function(){var a=this.fileName();return(16&this.externalAttributes()?!0:!1)||"/"===a.charAt(a.length-1)},a.prototype.isFile=function(){return!this.isDirectory()},a.prototype.useUTF8=function(){return 2048===(2048&this.flag())},a.prototype.isEncrypted=function(){return 1===(1&this.flag())},a.prototype.getData=function(){var a=this.headerRelativeOffset(),b=new u(this.zipData.slice(a)),c=new v(b,this,this.zipData.slice(a+b.totalSize()));return c.decompress()},a.prototype.getStats=function(){return new k.Stats(k.FileType.FILE,this.uncompressedSize(),365,new Date,this.lastModFileTime())},a}();c.CentralDirectory=z;var A=function(){function a(a){if(this.data=a,101010256!==this.data.readUInt32LE(0))throw new q(r.EINVAL,"Invalid Zip file: End of central directory record has invalid signature: "+this.data.readUInt32LE(0))}return a.prototype.diskNumber=function(){return this.data.readUInt16LE(4)},a.prototype.cdDiskNumber=function(){return this.data.readUInt16LE(6)},a.prototype.cdDiskEntryCount=function(){return this.data.readUInt16LE(8)},a.prototype.cdTotalEntryCount=function(){return this.data.readUInt16LE(10)},a.prototype.cdSize=function(){return this.data.readUInt32LE(12)},a.prototype.cdOffset=function(){return this.data.readUInt32LE(16)},a.prototype.cdZipComment=function(){return e(this.data,!0,22,this.data.readUInt16LE(20))},a}();c.EndOfCentralDirectory=A;var B=function(a){function b(b,c){void 0===c&&(c=""),a.call(this),this.data=b,this.name=c,this._index=new i.FileIndex,this.populateIndex()}return f(b,a),b.prototype.getName=function(){return"ZipFS"+(""!==this.name?" "+this.name:"")},b.isAvailable=function(){return!0},b.prototype.diskSpace=function(a,b){b(this.data.length,0)},b.prototype.isReadOnly=function(){return!0},b.prototype.supportsLinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.statSync=function(a,b){var c=this._index.getInode(a);if(null===c)throw new q(r.ENOENT,""+a+" not found.");var d;return d=c.isFile()?c.getData().getStats():c.getStats()},b.prototype.openSync=function(a,b,c){if(b.isWriteable())throw new q(r.EPERM,a);var d=this._index.getInode(a);if(null===d)throw new q(r.ENOENT,""+a+" is not in the FileIndex.");if(d.isDir())throw new q(r.EISDIR,""+a+" is a directory.");var e=d.getData(),f=e.getStats();switch(b.pathExistsAction()){case s.THROW_EXCEPTION:case s.TRUNCATE_FILE:throw new q(r.EEXIST,""+a+" already exists.");case s.NOP:return new o.NoSyncFile(this,a,b,f,e.getData());default:throw new q(r.EINVAL,"Invalid FileMode object.")}return null},b.prototype.readdirSync=function(a){var b=this._index.getInode(a);if(null===b)throw new q(r.ENOENT,""+a+" not found.");if(b.isFile())throw new q(r.ENOTDIR,""+a+" is a file, not a directory.");return b.getListing()},b.prototype.readFileSync=function(a,b,c){var d=this.openSync(a,c,420);try{var e=d,f=e.getBuffer();return null===b?f.length>0?f.sliceCopy():new g.Buffer(0):f.toString(b)}finally{d.closeSync()}},b.prototype.getEOCD=function(){for(var a=22,b=Math.min(a+65535,this.data.length-1),c=a;b>c;c++)if(101010256===this.data.readUInt32LE(this.data.length-c))return new A(this.data.slice(this.data.length-c));throw new q(r.EINVAL,"Invalid ZIP file: Could not locate End of Central Directory signature.")},b.prototype.populateIndex=function(){var a=this.getEOCD();if(a.diskNumber()!==a.cdDiskNumber())throw new q(r.EINVAL,"ZipFS does not support spanned zip files.");var b=a.cdOffset();if(4294967295===b)throw new q(r.EINVAL,"ZipFS does not support Zip64.");for(var c=b+a.cdSize();c>b;){var d=new z(this.data,this.data.slice(b));b+=d.totalSize();var e=d.fileName();if("/"===e.charAt(0))throw new Error("WHY IS THIS ABSOLUTE");"/"===e.charAt(e.length-1)&&(e=e.substr(0,e.length-1)),d.isDirectory()?this._index.addPath("/"+e,new i.DirInode):this._index.addPath("/"+e,new i.FileInode(d))}},b}(l.SynchronousFileSystem);c.ZipFS=B,j.registerFileSystem("ZipFS",B)},{"../core/api_error":14,"../core/browserfs":15,"../core/buffer":16,"../core/buffer_core_arraybuffer":19,"../core/file_flag":22,"../core/file_system":23,"../core/node_fs_stats":27,"../generic/file_index":33,"../generic/preload_file":36,"zlib-inflate":2}],14:[function(a,b,c){var d=a("./buffer"),e=d.Buffer;!function(a){a[a.EPERM=0]="EPERM",a[a.ENOENT=1]="ENOENT",a[a.EIO=2]="EIO",a[a.EBADF=3]="EBADF",a[a.EACCES=4]="EACCES",a[a.EBUSY=5]="EBUSY",a[a.EEXIST=6]="EEXIST",a[a.ENOTDIR=7]="ENOTDIR",a[a.EISDIR=8]="EISDIR",a[a.EINVAL=9]="EINVAL",a[a.EFBIG=10]="EFBIG",a[a.ENOSPC=11]="ENOSPC",a[a.EROFS=12]="EROFS",a[a.ENOTEMPTY=13]="ENOTEMPTY",a[a.ENOTSUP=14]="ENOTSUP"}(c.ErrorCode||(c.ErrorCode={}));var f=c.ErrorCode,g={};g[f.EPERM]="Operation not permitted.",g[f.ENOENT]="No such file or directory.",g[f.EIO]="Input/output error.",g[f.EBADF]="Bad file descriptor.",g[f.EACCES]="Permission denied.",g[f.EBUSY]="Resource busy or locked.",g[f.EEXIST]="File exists.",g[f.ENOTDIR]="File is not a directory.",g[f.EISDIR]="File is a directory.",g[f.EINVAL]="Invalid argument.",g[f.EFBIG]="File is too big.",g[f.ENOSPC]="No space left on disk.",g[f.EROFS]="Cannot modify a read-only file system.",g[f.ENOTEMPTY]="Directory is not empty.",g[f.ENOTSUP]="Operation is not supported.";var h=function(){function a(a,b){this.type=a,this.code=f[a],null!=b?this.message=b:this.message=g[a]}return a.prototype.toString=function(){return this.code+": "+g[this.type]+" "+this.message},a.prototype.writeToBuffer=function(a,b){void 0===a&&(a=new e(this.bufferSize())),void 0===b&&(b=0),a.writeUInt8(this.type,b);var c=a.write(this.message,b+5);return a.writeUInt32LE(c,b+1),a},a.fromBuffer=function(b,c){return void 0===c&&(c=0),new a(b.readUInt8(c),b.toString("utf8",c+5,c+5+b.readUInt32LE(c+1)))},a.prototype.bufferSize=function(){return 5+e.byteLength(this.message)},a.FileError=function(b,c){return new a(b,c+": "+g[b])},a.ENOENT=function(a){return this.FileError(f.ENOENT,a)},a.EEXIST=function(a){return this.FileError(f.EEXIST,a)},a.EISDIR=function(a){return this.FileError(f.EISDIR,a)},a.ENOTDIR=function(a){return this.FileError(f.ENOTDIR,a)},a.EPERM=function(a){return this.FileError(f.EPERM,a)},a}();c.ApiError=h},{"./buffer":16}],15:[function(a,b,c){function d(a){a.Buffer=h.Buffer,a.process=k.process;var b=null!=a.require?a.require:null;a.require=function(a){var c=f(a);return null==c?b.apply(null,Array.prototype.slice.call(arguments,0)):c}}function e(a,b){c.FileSystem[a]=b}function f(a){switch(a){case"fs":return i;case"path":return j;case"buffer":return h;case"process":return k.process;default:return c.FileSystem[a]}}function g(a){return i._initialize(a)}var h=a("./buffer"),i=a("./node_fs"),j=a("./node_path"),k=a("./node_process");c.install=d,c.FileSystem={},c.registerFileSystem=e,c.BFSRequire=f,c.initialize=g},{"./buffer":16,"./node_fs":26,"./node_path":28,"./node_process":29}],16:[function(a,b,c){var d=a("./buffer_core"),e=a("./buffer_core_array"),f=a("./buffer_core_arraybuffer"),g=a("./buffer_core_imagedata"),h=a("./string_util"),i=[f.BufferCoreArrayBuffer,g.BufferCoreImageData,e.BufferCoreArray],j=function(){var a,b;for(a=0;a<i.length;a++)if(b=i[a],b.isAvailable())return b;throw new Error("This browser does not support any available BufferCore implementations.")}(),k=function(){function a(b,c,e){void 0===c&&(c="utf8"),this.offset=0;var g;if(!(this instanceof a))return new a(b,c);if(b instanceof d.BufferCoreCommon){this.data=b;var h="number"==typeof c?c:0,i="number"==typeof e?e:this.data.getLength();this.offset=h,this.length=i-h}else if("number"==typeof b){if(b!==b>>>0)throw new TypeError("Buffer size must be a uint32.");this.length=b,this.data=new j(b)}else if("undefined"!=typeof DataView&&b instanceof DataView)this.data=new f.BufferCoreArrayBuffer(b),this.length=b.byteLength;else if("undefined"!=typeof ArrayBuffer&&"number"==typeof b.byteLength)this.data=new f.BufferCoreArrayBuffer(b),this.length=b.byteLength;else if(b instanceof a){var k=b;this.data=new j(b.length),this.length=b.length,k.copy(this)}else if(Array.isArray(b)||null!=b&&"object"==typeof b&&"number"==typeof b[0]){for(this.data=new j(b.length),g=0;g<b.length;g++)this.data.writeUInt8(g,b[g]);this.length=b.length}else{if("string"!=typeof b)throw new Error("Invalid argument to Buffer constructor: "+b);this.length=a.byteLength(b,c),this.data=new j(this.length),this.write(b,0,this.length,c)}}return a.prototype.getBufferCore=function(){return this.data},a.prototype.getOffset=function(){return this.offset},a.prototype.set=function(a,b){return 0>b?this.writeInt8(b,a):this.writeUInt8(b,a)},a.prototype.get=function(a){return this.readUInt8(a)},a.prototype.write=function(b,c,d,e){if(void 0===c&&(c=0),void 0===d&&(d=this.length),void 0===e&&(e="utf8"),"string"==typeof c?(e=""+c,c=0,d=this.length):"string"==typeof d&&(e=""+d,d=this.length),c>=this.length)return 0;var f=h.FindUtil(e);return d=d+c>this.length?this.length-c:d,c+=this.offset,f.str2byte(b,0===c&&d===this.length?this:new a(this.data,c,d+c))},a.prototype.toString=function(b,c,d){if(void 0===b&&(b="utf8"),void 0===c&&(c=0),void 0===d&&(d=this.length),!(d>=c))throw new Error("Invalid start/end positions: "+c+" - "+d);if(c===d)return"";d>this.length&&(d=this.length);var e=h.FindUtil(b);return e.byte2str(0===c&&d===this.length?this:new a(this.data,c+this.offset,d+this.offset))},a.prototype.toJSON=function(){for(var a=this.length,b=new Array(a),c=0;a>c;c++)b[c]=this.readUInt8(c);return{type:"Buffer",data:b}},a.prototype.toArrayBuffer=function(){var b=this.getBufferCore();if(b instanceof f.BufferCoreArrayBuffer){var c=b.getDataView(),d=c.buffer;return 0===c.byteOffset&&c.byteLength===d.byteLength?d:d.slice(c.byteOffset,c.byteLength)}var d=new ArrayBuffer(this.length),e=new a(d);return this.copy(e,0,0,this.length),d},a.prototype.copy=function(a,b,c,d){if(void 0===b&&(b=0),void 0===c&&(c=0),void 0===d&&(d=this.length),b=0>b?0:b,c=0>c?0:c,c>d)throw new RangeError("sourceEnd < sourceStart");if(d===c)return 0;if(b>=a.length)throw new RangeError("targetStart out of bounds");if(c>=this.length)throw new RangeError("sourceStart out of bounds");if(d>this.length)throw new RangeError("sourceEnd out of bounds");var e,f=Math.min(d-c,a.length-b,this.length-c);for(e=0;f-3>e;e+=4)a.writeInt32LE(this.readInt32LE(c+e),b+e);for(e=4294967292&f;f>e;e++)a.writeUInt8(this.readUInt8(c+e),b+e);return f},a.prototype.slice=function(b,c){if(void 0===b&&(b=0),void 0===c&&(c=this.length),0>b&&(b+=this.length,0>b&&(b=0)),0>c&&(c+=this.length,0>c&&(c=0)),c>this.length&&(c=this.length),b>c&&(b=c),0>b||0>c||b>=this.length||c>this.length)throw new Error("Invalid slice indices.");return new a(this.data,b+this.offset,c+this.offset)},a.prototype.sliceCopy=function(b,c){if(void 0===b&&(b=0),void 0===c&&(c=this.length),0>b&&(b+=this.length,0>b&&(b=0)),0>c&&(c+=this.length,0>c&&(c=0)),c>this.length&&(c=this.length),b>c&&(b=c),0>b||0>c||b>=this.length||c>this.length)throw new Error("Invalid slice indices.");return new a(this.data.copy(b+this.offset,c+this.offset))},a.prototype.fill=function(a,b,c){void 0===b&&(b=0),void 0===c&&(c=this.length);var d=typeof a;switch(d){case"string":a=255&a.charCodeAt(0);break;case"number":break;default:throw new Error("Invalid argument to fill.")}b+=this.offset,c+=this.offset,this.data.fill(a,b,c)},a.prototype.readUInt8=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readUInt8(a)},a.prototype.readUInt16LE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readUInt16LE(a)},a.prototype.readUInt16BE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readUInt16BE(a)},a.prototype.readUInt32LE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readUInt32LE(a)},a.prototype.readUInt32BE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readUInt32BE(a)},a.prototype.readInt8=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readInt8(a)},a.prototype.readInt16LE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readInt16LE(a)},a.prototype.readInt16BE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readInt16BE(a)},a.prototype.readInt32LE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readInt32LE(a)},a.prototype.readInt32BE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readInt32BE(a)},a.prototype.readFloatLE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readFloatLE(a)},a.prototype.readFloatBE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,
this.data.readFloatBE(a)},a.prototype.readDoubleLE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readDoubleLE(a)},a.prototype.readDoubleBE=function(a,b){return void 0===b&&(b=!1),a+=this.offset,this.data.readDoubleBE(a)},a.prototype.writeUInt8=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeUInt8(b,a)},a.prototype.writeUInt16LE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeUInt16LE(b,a)},a.prototype.writeUInt16BE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeUInt16BE(b,a)},a.prototype.writeUInt32LE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeUInt32LE(b,a)},a.prototype.writeUInt32BE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeUInt32BE(b,a)},a.prototype.writeInt8=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeInt8(b,a)},a.prototype.writeInt16LE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeInt16LE(b,a)},a.prototype.writeInt16BE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeInt16BE(b,a)},a.prototype.writeInt32LE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeInt32LE(b,a)},a.prototype.writeInt32BE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeInt32BE(b,a)},a.prototype.writeFloatLE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeFloatLE(b,a)},a.prototype.writeFloatBE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeFloatBE(b,a)},a.prototype.writeDoubleLE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeDoubleLE(b,a)},a.prototype.writeDoubleBE=function(a,b,c){void 0===c&&(c=!1),b+=this.offset,this.data.writeDoubleBE(b,a)},a.isEncoding=function(a){try{h.FindUtil(a)}catch(b){return!1}return!0},a.isBuffer=function(b){return b instanceof a},a.byteLength=function(a,b){void 0===b&&(b="utf8");var c=h.FindUtil(b);return c.byteLength(a)},a.concat=function(b,c){var d;if(0===b.length||0===c)return new a(0);if(1===b.length)return b[0];if(null==c){c=0;for(var e=0;e<b.length;e++)d=b[e],c+=d.length}for(var f=new a(c),g=0,h=0;h<b.length;h++)d=b[h],g+=d.copy(f,g);return f},a}();c.Buffer=k},{"./buffer_core":17,"./buffer_core_array":18,"./buffer_core_arraybuffer":19,"./buffer_core_imagedata":20,"./string_util":30}],17:[function(a,b,c){var d=Math.pow(2,128),e=-1*d,f=2139095040,g=-8388608,h=2143289344,i=function(){function a(){}return a.prototype.getLength=function(){throw new Error("BufferCore implementations should implement getLength.")},a.prototype.writeInt8=function(a,b){this.writeUInt8(a,255&b|(2147483648&b)>>>24)},a.prototype.writeInt16LE=function(a,b){this.writeUInt8(a,255&b),this.writeUInt8(a+1,b>>>8&255|(2147483648&b)>>>24)},a.prototype.writeInt16BE=function(a,b){this.writeUInt8(a+1,255&b),this.writeUInt8(a,b>>>8&255|(2147483648&b)>>>24)},a.prototype.writeInt32LE=function(a,b){this.writeUInt8(a,255&b),this.writeUInt8(a+1,b>>>8&255),this.writeUInt8(a+2,b>>>16&255),this.writeUInt8(a+3,b>>>24&255)},a.prototype.writeInt32BE=function(a,b){this.writeUInt8(a+3,255&b),this.writeUInt8(a+2,b>>>8&255),this.writeUInt8(a+1,b>>>16&255),this.writeUInt8(a,b>>>24&255)},a.prototype.writeUInt8=function(a,b){throw new Error("BufferCore implementations should implement writeUInt8.")},a.prototype.writeUInt16LE=function(a,b){this.writeUInt8(a,255&b),this.writeUInt8(a+1,b>>8&255)},a.prototype.writeUInt16BE=function(a,b){this.writeUInt8(a+1,255&b),this.writeUInt8(a,b>>8&255)},a.prototype.writeUInt32LE=function(a,b){this.writeInt32LE(a,0|b)},a.prototype.writeUInt32BE=function(a,b){this.writeInt32BE(a,0|b)},a.prototype.writeFloatLE=function(a,b){this.writeInt32LE(a,this.float2intbits(b))},a.prototype.writeFloatBE=function(a,b){this.writeInt32BE(a,this.float2intbits(b))},a.prototype.writeDoubleLE=function(a,b){var c=this.double2longbits(b);this.writeInt32LE(a,c[0]),this.writeInt32LE(a+4,c[1])},a.prototype.writeDoubleBE=function(a,b){var c=this.double2longbits(b);this.writeInt32BE(a+4,c[0]),this.writeInt32BE(a,c[1])},a.prototype.readInt8=function(a){var b=this.readUInt8(a);return 128&b?4294967168|b:b},a.prototype.readInt16LE=function(a){var b=this.readUInt16LE(a);return 32768&b?4294934528|b:b},a.prototype.readInt16BE=function(a){var b=this.readUInt16BE(a);return 32768&b?4294934528|b:b},a.prototype.readInt32LE=function(a){return 0|this.readUInt32LE(a)},a.prototype.readInt32BE=function(a){return 0|this.readUInt32BE(a)},a.prototype.readUInt8=function(a){throw new Error("BufferCore implementations should implement readUInt8.")},a.prototype.readUInt16LE=function(a){return this.readUInt8(a+1)<<8|this.readUInt8(a)},a.prototype.readUInt16BE=function(a){return this.readUInt8(a)<<8|this.readUInt8(a+1)},a.prototype.readUInt32LE=function(a){return(this.readUInt8(a+3)<<24|this.readUInt8(a+2)<<16|this.readUInt8(a+1)<<8|this.readUInt8(a))>>>0},a.prototype.readUInt32BE=function(a){return(this.readUInt8(a)<<24|this.readUInt8(a+1)<<16|this.readUInt8(a+2)<<8|this.readUInt8(a+3))>>>0},a.prototype.readFloatLE=function(a){return this.intbits2float(this.readInt32LE(a))},a.prototype.readFloatBE=function(a){return this.intbits2float(this.readInt32BE(a))},a.prototype.readDoubleLE=function(a){return this.longbits2double(this.readInt32LE(a+4),this.readInt32LE(a))},a.prototype.readDoubleBE=function(a){return this.longbits2double(this.readInt32BE(a),this.readInt32BE(a+4))},a.prototype.copy=function(a,b){throw new Error("BufferCore implementations should implement copy.")},a.prototype.fill=function(a,b,c){for(var d=b;c>d;d++)this.writeUInt8(d,a)},a.prototype.float2intbits=function(a){var b,c,d;return 0===a?0:a===Number.POSITIVE_INFINITY?f:a===Number.NEGATIVE_INFINITY?g:isNaN(a)?h:(d=0>a?1:0,a=Math.abs(a),1.1754942106924411e-38>=a&&a>=1.401298464324817e-45?(b=0,c=Math.round(a/Math.pow(2,-126)*Math.pow(2,23)),d<<31|b<<23|c):(b=Math.floor(Math.log(a)/Math.LN2),c=Math.round((a/Math.pow(2,b)-1)*Math.pow(2,23)),d<<31|b+127<<23|c))},a.prototype.double2longbits=function(a){var b,c,d,e;return 0===a?[0,0]:a===Number.POSITIVE_INFINITY?[0,2146435072]:a===Number.NEGATIVE_INFINITY?[0,-1048576]:isNaN(a)?[0,2146959360]:(e=0>a?1<<31:0,a=Math.abs(a),2.225073858507201e-308>=a&&a>=5e-324?(b=0,d=a/Math.pow(2,-1022)*Math.pow(2,52)):(b=Math.floor(Math.log(a)/Math.LN2),a<Math.pow(2,b)&&(b-=1),d=(a/Math.pow(2,b)-1)*Math.pow(2,52),b=b+1023<<20),c=d*Math.pow(2,-32)|0|e|b,[65535&d,c])},a.prototype.intbits2float=function(a){if(a===f)return Number.POSITIVE_INFINITY;if(a===g)return Number.NEGATIVE_INFINITY;var b,c=(2147483648&a)>>>31,h=(2139095040&a)>>>23,i=8388607&a;return b=0===h?Math.pow(-1,c)*i*Math.pow(2,-149):Math.pow(-1,c)*(1+i*Math.pow(2,-23))*Math.pow(2,h-127),(e>b||b>d)&&(b=NaN),b},a.prototype.longbits2double=function(a,b){var c=(2147483648&a)>>>31,d=(2146435072&a)>>>20,e=(1048575&a)*Math.pow(2,32)+b;return 0===d&&0===e?0:2047===d?0===e?1===c?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY:NaN:0===d?Math.pow(-1,c)*e*Math.pow(2,-1074):Math.pow(-1,c)*(1+e*Math.pow(2,-52))*Math.pow(2,d-1023)},a}();c.BufferCoreCommon=i},{}],18:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./buffer_core"),f=[4294967040,4294902015,4278255615,16777215],g=function(a){function b(b){a.call(this),this.length=b,this.buff=new Array(Math.ceil(b/4));for(var c=this.buff.length,d=0;c>d;d++)this.buff[d]=0}return d(b,a),b.isAvailable=function(){return!0},b.prototype.getLength=function(){return this.length},b.prototype.writeUInt8=function(a,b){b&=255;var c=a>>2,d=3&a;this.buff[c]=this.buff[c]&f[d],this.buff[c]=this.buff[c]|b<<(d<<3)},b.prototype.readUInt8=function(a){var b=a>>2,c=3&a;return this.buff[b]>>(c<<3)&255},b.prototype.copy=function(a,c){for(var d=new b(c-a),e=a;c>e;e++)d.writeUInt8(e-a,this.readUInt8(e));return d},b}(e.BufferCoreCommon);c.BufferCoreArray=g},{"./buffer_core":17}],19:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./buffer_core"),f=function(a){function b(b){a.call(this),"number"==typeof b?this.buff=new DataView(new ArrayBuffer(b)):b instanceof DataView?this.buff=b:this.buff=new DataView(b),this.length=this.buff.byteLength}return d(b,a),b.isAvailable=function(){return"undefined"!=typeof DataView},b.prototype.getLength=function(){return this.length},b.prototype.writeInt8=function(a,b){this.buff.setInt8(a,b)},b.prototype.writeInt16LE=function(a,b){this.buff.setInt16(a,b,!0)},b.prototype.writeInt16BE=function(a,b){this.buff.setInt16(a,b,!1)},b.prototype.writeInt32LE=function(a,b){this.buff.setInt32(a,b,!0)},b.prototype.writeInt32BE=function(a,b){this.buff.setInt32(a,b,!1)},b.prototype.writeUInt8=function(a,b){this.buff.setUint8(a,b)},b.prototype.writeUInt16LE=function(a,b){this.buff.setUint16(a,b,!0)},b.prototype.writeUInt16BE=function(a,b){this.buff.setUint16(a,b,!1)},b.prototype.writeUInt32LE=function(a,b){this.buff.setUint32(a,b,!0)},b.prototype.writeUInt32BE=function(a,b){this.buff.setUint32(a,b,!1)},b.prototype.writeFloatLE=function(a,b){this.buff.setFloat32(a,b,!0)},b.prototype.writeFloatBE=function(a,b){this.buff.setFloat32(a,b,!1)},b.prototype.writeDoubleLE=function(a,b){this.buff.setFloat64(a,b,!0)},b.prototype.writeDoubleBE=function(a,b){this.buff.setFloat64(a,b,!1)},b.prototype.readInt8=function(a){return this.buff.getInt8(a)},b.prototype.readInt16LE=function(a){return this.buff.getInt16(a,!0)},b.prototype.readInt16BE=function(a){return this.buff.getInt16(a,!1)},b.prototype.readInt32LE=function(a){return this.buff.getInt32(a,!0)},b.prototype.readInt32BE=function(a){return this.buff.getInt32(a,!1)},b.prototype.readUInt8=function(a){return this.buff.getUint8(a)},b.prototype.readUInt16LE=function(a){return this.buff.getUint16(a,!0)},b.prototype.readUInt16BE=function(a){return this.buff.getUint16(a,!1)},b.prototype.readUInt32LE=function(a){return this.buff.getUint32(a,!0)},b.prototype.readUInt32BE=function(a){return this.buff.getUint32(a,!1)},b.prototype.readFloatLE=function(a){return this.buff.getFloat32(a,!0)},b.prototype.readFloatBE=function(a){return this.buff.getFloat32(a,!1)},b.prototype.readDoubleLE=function(a){return this.buff.getFloat64(a,!0)},b.prototype.readDoubleBE=function(a){return this.buff.getFloat64(a,!1)},b.prototype.copy=function(a,c){var d,e=this.buff.buffer;if(ArrayBuffer.prototype.slice)d=e.slice(a,c);else{var f=c-a;d=new ArrayBuffer(f);var g=new Uint8Array(d),h=new Uint8Array(e);g.set(h.subarray(a,c))}return new b(d)},b.prototype.fill=function(a,b,c){a=255&a;var d,e=c-b,f=4*(e/4|0),g=a<<24|a<<16|a<<8|a;for(d=0;f>d;d+=4)this.writeInt32LE(d+b,g);for(d=f;e>d;d++)this.writeUInt8(d+b,a)},b.prototype.getDataView=function(){return this.buff},b}(e.BufferCoreCommon);c.BufferCoreArrayBuffer=f},{"./buffer_core":17}],20:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./buffer_core"),f=function(a){function b(c){a.call(this),this.length=c,this.buff=b.getCanvasPixelArray(c)}return d(b,a),b.getCanvasPixelArray=function(a){var c=b.imageDataFactory;return void 0===c&&(b.imageDataFactory=c=document.createElement("canvas").getContext("2d")),0===a&&(a=1),c.createImageData(Math.ceil(a/4),1).data},b.isAvailable=function(){return"undefined"!=typeof CanvasPixelArray},b.prototype.getLength=function(){return this.length},b.prototype.writeUInt8=function(a,b){this.buff[a]=b},b.prototype.readUInt8=function(a){return this.buff[a]},b.prototype.copy=function(a,c){for(var d=new b(c-a),e=a;c>e;e++)d.writeUInt8(e-a,this.buff[e]);return d},b}(e.BufferCoreCommon);c.BufferCoreImageData=f},{"./buffer_core":17}],21:[function(a,b,c){var d=a("./api_error"),e=d.ApiError,f=d.ErrorCode,g=function(){function a(){}return a.prototype.sync=function(a){a(new e(f.ENOTSUP))},a.prototype.syncSync=function(){throw new e(f.ENOTSUP)},a.prototype.datasync=function(a){this.sync(a)},a.prototype.datasyncSync=function(){return this.syncSync()},a.prototype.chown=function(a,b,c){c(new e(f.ENOTSUP))},a.prototype.chownSync=function(a,b){throw new e(f.ENOTSUP)},a.prototype.chmod=function(a,b){b(new e(f.ENOTSUP))},a.prototype.chmodSync=function(a){throw new e(f.ENOTSUP)},a.prototype.utimes=function(a,b,c){c(new e(f.ENOTSUP))},a.prototype.utimesSync=function(a,b){throw new e(f.ENOTSUP)},a}();c.BaseFile=g},{"./api_error":14}],22:[function(a,b,c){var d=a("./api_error");!function(a){a[a.NOP=0]="NOP",a[a.THROW_EXCEPTION=1]="THROW_EXCEPTION",a[a.TRUNCATE_FILE=2]="TRUNCATE_FILE",a[a.CREATE_FILE=3]="CREATE_FILE"}(c.ActionType||(c.ActionType={}));var e=c.ActionType,f=function(){function a(b){if(this.flagStr=b,a.validFlagStrs.indexOf(b)<0)throw new d.ApiError(d.ErrorCode.EINVAL,"Invalid flag: "+b)}return a.getFileFlag=function(b){return a.flagCache.hasOwnProperty(b)?a.flagCache[b]:a.flagCache[b]=new a(b)},a.prototype.getFlagString=function(){return this.flagStr},a.prototype.isReadable=function(){return-1!==this.flagStr.indexOf("r")||-1!==this.flagStr.indexOf("+")},a.prototype.isWriteable=function(){return-1!==this.flagStr.indexOf("w")||-1!==this.flagStr.indexOf("a")||-1!==this.flagStr.indexOf("+")},a.prototype.isTruncating=function(){return-1!==this.flagStr.indexOf("w")},a.prototype.isAppendable=function(){return-1!==this.flagStr.indexOf("a")},a.prototype.isSynchronous=function(){return-1!==this.flagStr.indexOf("s")},a.prototype.isExclusive=function(){return-1!==this.flagStr.indexOf("x")},a.prototype.pathExistsAction=function(){return this.isExclusive()?e.THROW_EXCEPTION:this.isTruncating()?e.TRUNCATE_FILE:e.NOP},a.prototype.pathNotExistsAction=function(){return(this.isWriteable()||this.isAppendable())&&"r+"!==this.flagStr?e.CREATE_FILE:e.THROW_EXCEPTION},a.flagCache={},a.validFlagStrs=["r","r+","rs","rs+","w","wx","w+","wx+","a","ax","a+","ax+"],a}();c.FileFlag=f},{"./api_error":14}],23:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./api_error"),f=a("./file_flag"),g=a("./node_path"),h=a("./buffer"),i=e.ApiError,j=e.ErrorCode,k=h.Buffer,l=f.ActionType,m=function(){function a(){}return a.prototype.supportsLinks=function(){return!1},a.prototype.diskSpace=function(a,b){b(0,0)},a.prototype.openFile=function(a,b,c){throw new i(j.ENOTSUP)},a.prototype.createFile=function(a,b,c,d){throw new i(j.ENOTSUP)},a.prototype.open=function(a,b,c,d){var e=this,f=function(f,h){if(f)switch(b.pathNotExistsAction()){case l.CREATE_FILE:return e.stat(g.dirname(a),!1,function(f,h){f?d(f):h.isDirectory()?e.createFile(a,b,c,d):d(new i(j.ENOTDIR,g.dirname(a)+" is not a directory."))});case l.THROW_EXCEPTION:return d(new i(j.ENOENT,""+a+" doesn't exist."));default:return d(new i(j.EINVAL,"Invalid FileFlag object."))}else{if(h.isDirectory())return d(new i(j.EISDIR,a+" is a directory."));switch(b.pathExistsAction()){case l.THROW_EXCEPTION:return d(new i(j.EEXIST,a+" already exists."));case l.TRUNCATE_FILE:return e.openFile(a,b,function(a,b){a?d(a):b.truncate(0,function(){b.sync(function(){d(null,b)})})});case l.NOP:return e.openFile(a,b,d);default:return d(new i(j.EINVAL,"Invalid FileFlag object."))}}};this.stat(a,!1,f)},a.prototype.rename=function(a,b,c){c(new i(j.ENOTSUP))},a.prototype.renameSync=function(a,b){throw new i(j.ENOTSUP)},a.prototype.stat=function(a,b,c){c(new i(j.ENOTSUP))},a.prototype.statSync=function(a,b){throw new i(j.ENOTSUP)},a.prototype.openFileSync=function(a,b){throw new i(j.ENOTSUP)},a.prototype.createFileSync=function(a,b,c){throw new i(j.ENOTSUP)},a.prototype.openSync=function(a,b,c){var d;try{d=this.statSync(a,!1)}catch(e){switch(b.pathNotExistsAction()){case l.CREATE_FILE:var f=this.statSync(g.dirname(a),!1);if(!f.isDirectory())throw new i(j.ENOTDIR,g.dirname(a)+" is not a directory.");return this.createFileSync(a,b,c);case l.THROW_EXCEPTION:throw new i(j.ENOENT,""+a+" doesn't exist.");default:throw new i(j.EINVAL,"Invalid FileFlag object.")}}if(d.isDirectory())throw new i(j.EISDIR,a+" is a directory.");switch(b.pathExistsAction()){case l.THROW_EXCEPTION:throw new i(j.EEXIST,a+" already exists.");case l.TRUNCATE_FILE:return this.unlinkSync(a),this.createFileSync(a,b,d.mode);case l.NOP:return this.openFileSync(a,b);default:throw new i(j.EINVAL,"Invalid FileFlag object.")}},a.prototype.unlink=function(a,b){b(new i(j.ENOTSUP))},a.prototype.unlinkSync=function(a){throw new i(j.ENOTSUP)},a.prototype.rmdir=function(a,b){b(new i(j.ENOTSUP))},a.prototype.rmdirSync=function(a){throw new i(j.ENOTSUP)},a.prototype.mkdir=function(a,b,c){c(new i(j.ENOTSUP))},a.prototype.mkdirSync=function(a,b){throw new i(j.ENOTSUP)},a.prototype.readdir=function(a,b){b(new i(j.ENOTSUP))},a.prototype.readdirSync=function(a){throw new i(j.ENOTSUP)},a.prototype.exists=function(a,b){this.stat(a,null,function(a){b(null==a)})},a.prototype.existsSync=function(a){try{return this.statSync(a,!0),!0}catch(b){return!1}},a.prototype.realpath=function(a,b,c){if(this.supportsLinks())for(var d=a.split(g.sep),e=0;e<d.length;e++){var f=d.slice(0,e+1);d[e]=g.join.apply(null,f)}else this.exists(a,function(b){b?c(null,a):c(new i(j.ENOENT,"File "+a+" not found."))})},a.prototype.realpathSync=function(a,b){if(!this.supportsLinks()){if(this.existsSync(a))return a;throw new i(j.ENOENT,"File "+a+" not found.")}for(var c=a.split(g.sep),d=0;d<c.length;d++){var e=c.slice(0,d+1);c[d]=g.join.apply(null,e)}},a.prototype.truncate=function(a,b,c){this.open(a,f.FileFlag.getFileFlag("r+"),420,function(a,d){return a?c(a):void d.truncate(b,function(a){d.close(function(b){c(a||b)})})})},a.prototype.truncateSync=function(a,b){var c=this.openSync(a,f.FileFlag.getFileFlag("r+"),420);try{c.truncateSync(b)}catch(d){throw d}finally{c.closeSync()}},a.prototype.readFile=function(a,b,c,d){var e=d;this.open(a,c,420,function(a,c){return a?d(a):(d=function(a,b){c.close(function(c){return null==a&&(a=c),e(a,b)})},void c.stat(function(a,e){if(null!=a)return d(a);var f=new k(e.size);c.read(f,0,e.size,0,function(a){if(null!=a)return d(a);if(null===b)return d(a,f);try{d(null,f.toString(b))}catch(c){d(c)}})}))})},a.prototype.readFileSync=function(a,b,c){var d=this.openSync(a,c,420);try{var e=d.statSync(),f=new k(e.size);return d.readSync(f,0,e.size,0),d.closeSync(),null===b?f:f.toString(b)}finally{d.closeSync()}},a.prototype.writeFile=function(a,b,c,d,e,f){var g=f;this.open(a,d,420,function(a,d){if(null!=a)return f(a);f=function(a){d.close(function(b){g(null!=a?a:b)})};try{"string"==typeof b&&(b=new k(b,c))}catch(e){return f(e)}d.write(b,0,b.length,0,f)})},a.prototype.writeFileSync=function(a,b,c,d,e){var f=this.openSync(a,d,e);try{"string"==typeof b&&(b=new k(b,c)),f.writeSync(b,0,b.length,0)}finally{f.closeSync()}},a.prototype.appendFile=function(a,b,c,d,e,f){var g=f;this.open(a,d,e,function(a,d){return null!=a?f(a):(f=function(a){d.close(function(b){g(null!=a?a:b)})},"string"==typeof b&&(b=new k(b,c)),void d.write(b,0,b.length,null,f))})},a.prototype.appendFileSync=function(a,b,c,d,e){var f=this.openSync(a,d,e);try{"string"==typeof b&&(b=new k(b,c)),f.writeSync(b,0,b.length,null)}finally{f.closeSync()}},a.prototype.chmod=function(a,b,c,d){d(new i(j.ENOTSUP))},a.prototype.chmodSync=function(a,b,c){throw new i(j.ENOTSUP)},a.prototype.chown=function(a,b,c,d,e){e(new i(j.ENOTSUP))},a.prototype.chownSync=function(a,b,c,d){throw new i(j.ENOTSUP)},a.prototype.utimes=function(a,b,c,d){d(new i(j.ENOTSUP))},a.prototype.utimesSync=function(a,b,c){throw new i(j.ENOTSUP)},a.prototype.link=function(a,b,c){c(new i(j.ENOTSUP))},a.prototype.linkSync=function(a,b){throw new i(j.ENOTSUP)},a.prototype.symlink=function(a,b,c,d){d(new i(j.ENOTSUP))},a.prototype.symlinkSync=function(a,b,c){throw new i(j.ENOTSUP)},a.prototype.readlink=function(a,b){b(new i(j.ENOTSUP))},a.prototype.readlinkSync=function(a){throw new i(j.ENOTSUP)},a}();c.BaseFileSystem=m;var n=function(a){function b(){a.apply(this,arguments)}return d(b,a),b.prototype.supportsSynch=function(){return!0},b.prototype.rename=function(a,b,c){try{this.renameSync(a,b),c()}catch(d){c(d)}},b.prototype.stat=function(a,b,c){try{c(null,this.statSync(a,b))}catch(d){c(d)}},b.prototype.open=function(a,b,c,d){try{d(null,this.openSync(a,b,c))}catch(e){d(e)}},b.prototype.unlink=function(a,b){try{this.unlinkSync(a),b()}catch(c){b(c)}},b.prototype.rmdir=function(a,b){try{this.rmdirSync(a),b()}catch(c){b(c)}},b.prototype.mkdir=function(a,b,c){try{this.mkdirSync(a,b),c()}catch(d){c(d)}},b.prototype.readdir=function(a,b){try{b(null,this.readdirSync(a))}catch(c){b(c)}},b.prototype.chmod=function(a,b,c,d){try{this.chmodSync(a,b,c),d()}catch(e){d(e)}},b.prototype.chown=function(a,b,c,d,e){try{this.chownSync(a,b,c,d),e()}catch(f){e(f)}},b.prototype.utimes=function(a,b,c,d){try{this.utimesSync(a,b,c),d()}catch(e){d(e)}},b.prototype.link=function(a,b,c){try{this.linkSync(a,b),c()}catch(d){c(d)}},b.prototype.symlink=function(a,b,c,d){try{this.symlinkSync(a,b,c),d()}catch(e){d(e)}},b.prototype.readlink=function(a,b){try{b(null,this.readlinkSync(a))}catch(c){b(c)}},b}(m);c.SynchronousFileSystem=n},{"./api_error":14,"./buffer":16,"./file_flag":22,"./node_path":28}],24:[function(a,b,c){var d;d="undefined"!=typeof window?window:"undefined"!=typeof self?self:global,b.exports=d},{}],25:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./buffer"),f=a("./api_error"),g=e.Buffer,h=f.ApiError,i=f.ErrorCode,j=function(){function a(a,b,c){this.data=a,this.encoding=b,this.cb=c,this.size="string"!=typeof a?a.length:g.byteLength(a,null!=b?b:void 0),"string"!=typeof this.data&&(this.data=this.data.sliceCopy())}return a.prototype.getData=function(a){return null==a?"string"==typeof this.data?new g(this.data,null!=this.encoding?this.encoding:void 0):this.data:"string"==typeof this.data?a===this.encoding?this.data:new g(this.data,null!=this.encoding?this.encoding:void 0).toString(a):this.data.toString(a)},a}(),k=function(){function a(){this._listeners={},this.maxListeners=10}return a.prototype.addListener=function(a,b){return"undefined"==typeof this._listeners[a]&&(this._listeners[a]=[]),this._listeners[a].push(b)>this.maxListeners&&process.stdout.write("Warning: Event "+a+" has more than "+this.maxListeners+" listeners.\n"),this.emit("newListener",a,b),this},a.prototype.on=function(a,b){return this.addListener(a,b)},a.prototype.once=function(a,b){var c=!1,d=function(){this.removeListener(a,d),c||(c=!0,b.apply(this,arguments))};return this.addListener(a,d)},a.prototype._emitRemoveListener=function(a,b){var c;if(this._listeners.removeListener&&this._listeners.removeListener.length>0)for(c=0;c<b.length;c++)this.emit("removeListener",a,b[c])},a.prototype.removeListener=function(a,b){var c=this._listeners[a];if("undefined"!=typeof c){var d=c.indexOf(b);d>-1&&c.splice(d,1)}return this.emit("removeListener",a,b),this},a.prototype.removeAllListeners=function(a){var b,c,d;if("undefined"!=typeof a)b=this._listeners[a],this._listeners[a]=[],this._emitRemoveListener(a,b);else for(c=Object.keys(this._listeners),d=0;d<c.length;d++)this.removeAllListeners(c[d]);return this},a.prototype.setMaxListeners=function(a){this.maxListeners=a},a.prototype.listeners=function(a){return"undefined"==typeof this._listeners[a]&&(this._listeners[a]=[]),this._listeners[a].slice(0)},a.prototype.emit=function(a){for(var b=[],c=1;c<arguments.length;c++)b[c-1]=arguments[c];var d=this._listeners[a],e=!1;if("undefined"!=typeof d){var f;for(f=0;f<d.length;f++)e=!0,d[f].apply(this,b)}return e},a}();c.AbstractEventEmitter=k;var l=function(a){function b(b,c){a.call(this),this.writable=b,this.readable=c,this.encoding=null,this.flowing=!1,this.buffer=[],this.endEvent=null,this.ended=!1,this.drained=!0}return d(b,a),b.prototype.addListener=function(b,c){var d=a.prototype.addListener.call(this,b,c),e=this;return"data"!==b||this.flowing?"readable"===b&&this.buffer.length>0&&setTimeout(function(){e.emit("readable")},0):this.resume(),d},b.prototype._processArgs=function(a,b,c){return"string"==typeof b?new j(a,b,c):new j(a,null,b)},b.prototype._processEvents=function(){var a=0===this.buffer.length;this.drained!==a&&this.drained&&this.emit("readable"),this.flowing&&0!==this.buffer.length&&this.emit("data",this.read()),this.drained=0===this.buffer.length},b.prototype.emitEvent=function(a,b){this.emit(a,b.getData(this.encoding)),b.cb&&b.cb()},b.prototype.write=function(a,b,c){if(this.ended)throw new h(i.EPERM,"Cannot write to an ended stream.");var d=this._processArgs(a,b,c);return this._push(d),this.flowing},b.prototype.end=function(a,b,c){if(this.ended)throw new h(i.EPERM,"Stream is already closed.");var d=this._processArgs(a,b,c);this.ended=!0,this.endEvent=d,this._processEvents()},b.prototype.read=function(a){var b,c,d,e,f=[],h=[],i=0,k=0,l="number"!=typeof a;for(l&&(a=4294967295),k=0;k<this.buffer.length&&a>i;k++)c=this.buffer[k],f.push(c.getData()),c.cb&&h.push(c.cb),i+=c.size,b=c.cb;if(!l&&a>i)return null;if(this.buffer=this.buffer.slice(f.length),e=i>a?a:i,d=g.concat(f),i>a&&(b&&h.pop(),this._push(new j(d.slice(a),null,b))),h.length>0&&setTimeout(function(){var a;for(a=0;a<h.length;a++)h[a]()},0),this.ended&&0===this.buffer.length&&null!==this.endEvent){var m=this.endEvent,n=this;this.endEvent=null,setTimeout(function(){n.emitEvent("end",m)},0)}return 0===f.length?(this.emit("_read"),null):null===this.encoding?d.slice(0,e):d.toString(this.encoding,0,e)},b.prototype.setEncoding=function(a){this.encoding=a},b.prototype.pause=function(){this.flowing=!1},b.prototype.resume=function(){this.flowing=!0,this._processEvents()},b.prototype.pipe=function(a,b){throw new h(i.EPERM,"Unimplemented.")},b.prototype.unpipe=function(a){},b.prototype.unshift=function(a){if(this.ended)throw new h(i.EPERM,"Stream has ended.");this.buffer.unshift(new j(a,this.encoding)),this._processEvents()},b.prototype._push=function(a){this.buffer.push(a),this._processEvents()},b.prototype.wrap=function(a){throw new h(i.EPERM,"Unimplemented.")},b}(k);c.AbstractDuplexStream=l},{"./api_error":14,"./buffer":16}],26:[function(a,b,c){function d(a,b){if("function"!=typeof a)throw new n(o.EINVAL,"Callback must be a function.");switch("undefined"==typeof __numWaiting&&(__numWaiting=0),__numWaiting++,b){case 1:return function(b){setImmediate(function(){return __numWaiting--,a(b)})};case 2:return function(b,c){setImmediate(function(){return __numWaiting--,a(b,c)})};case 3:return function(b,c,d){setImmediate(function(){return __numWaiting--,a(b,c,d)})};default:throw new Error("Invalid invocation of wrapCb.")}}function e(a){if("function"!=typeof a.write)throw new n(o.EBADF,"Invalid file descriptor.")}function f(a,b){switch(typeof a){case"number":return a;case"string":var c=parseInt(a,8);if(NaN!==c)return c;default:return b}}function g(a){if(a.indexOf("\x00")>=0)throw new n(o.EINVAL,"Path must be a string without null bytes.");if(""===a)throw new n(o.EINVAL,"Path must not be empty.");return m.resolve(a)}function h(a,b,c,d){switch(typeof a){case"object":return{encoding:"undefined"!=typeof a.encoding?a.encoding:b,flag:"undefined"!=typeof a.flag?a.flag:c,mode:f(a.mode,d)};case"string":return{encoding:a,flag:c,mode:d};default:return{encoding:b,flag:c,mode:d}}}function i(){}var j=a("./api_error"),k=a("./file_flag"),l=a("./buffer"),m=a("./node_path"),n=j.ApiError,o=j.ErrorCode,p=k.FileFlag,q=l.Buffer,r=function(){function a(){}return a._initialize=function(b){if(!b.constructor.isAvailable())throw new n(o.EINVAL,"Tried to instantiate BrowserFS with an unavailable file system.");return a.root=b},a._toUnixTimestamp=function(a){if("number"==typeof a)return a;if(a instanceof Date)return a.getTime()/1e3;throw new Error("Cannot parse time: "+a)},a.getRootFS=function(){return a.root?a.root:null},a.rename=function(b,c,e){void 0===e&&(e=i);var f=d(e,1);try{a.root.rename(g(b),g(c),f)}catch(h){f(h)}},a.renameSync=function(b,c){a.root.renameSync(g(b),g(c))},a.exists=function(b,c){void 0===c&&(c=i);var e=d(c,1);try{return a.root.exists(g(b),e)}catch(f){return e(!1)}},a.existsSync=function(b){try{return a.root.existsSync(g(b))}catch(c){return!1}},a.stat=function(b,c){void 0===c&&(c=i);var e=d(c,2);try{return a.root.stat(g(b),!1,e)}catch(f){return e(f,null)}},a.statSync=function(b){return a.root.statSync(g(b),!1)},a.lstat=function(b,c){void 0===c&&(c=i);var e=d(c,2);try{return a.root.stat(g(b),!0,e)}catch(f){return e(f,null)}},a.lstatSync=function(b){return a.root.statSync(g(b),!0)},a.truncate=function(b,c,e){void 0===c&&(c=0),void 0===e&&(e=i);var f=0;"function"==typeof c?e=c:"number"==typeof c&&(f=c);var h=d(e,1);try{if(0>f)throw new n(o.EINVAL);return a.root.truncate(g(b),f,h)}catch(j){return h(j)}},a.truncateSync=function(b,c){if(void 0===c&&(c=0),0>c)throw new n(o.EINVAL);return a.root.truncateSync(g(b),c)},a.unlink=function(b,c){void 0===c&&(c=i);var e=d(c,1);try{return a.root.unlink(g(b),e)}catch(f){return e(f)}},a.unlinkSync=function(b){return a.root.unlinkSync(g(b))},a.open=function(b,c,e,h){void 0===h&&(h=i);var j=f(e,420);h="function"==typeof e?e:h;var k=d(h,2);try{return a.root.open(g(b),p.getFileFlag(c),j,k)}catch(l){return k(l,null)}},a.openSync=function(b,c,d){return void 0===d&&(d=420),a.root.openSync(g(b),p.getFileFlag(c),d)},a.readFile=function(b,c,e){void 0===c&&(c={}),void 0===e&&(e=i);var f=h(c,null,"r",null);e="function"==typeof c?c:e;var j=d(e,2);try{var k=p.getFileFlag(f.flag);return k.isReadable()?a.root.readFile(g(b),f.encoding,k,j):j(new n(o.EINVAL,"Flag passed to readFile must allow for reading."))}catch(l){return j(l,null)}},a.readFileSync=function(b,c){void 0===c&&(c={});var d=h(c,null,"r",null),e=p.getFileFlag(d.flag);if(!e.isReadable())throw new n(o.EINVAL,"Flag passed to readFile must allow for reading.");return a.root.readFileSync(g(b),d.encoding,e)},a.writeFile=function(b,c,e,f){void 0===e&&(e={}),void 0===f&&(f=i);var j=h(e,"utf8","w",420);f="function"==typeof e?e:f;var k=d(f,1);try{var l=p.getFileFlag(j.flag);return l.isWriteable()?a.root.writeFile(g(b),c,j.encoding,l,j.mode,k):k(new n(o.EINVAL,"Flag passed to writeFile must allow for writing."))}catch(m){return k(m)}},a.writeFileSync=function(b,c,d){var e=h(d,"utf8","w",420),f=p.getFileFlag(e.flag);if(!f.isWriteable())throw new n(o.EINVAL,"Flag passed to writeFile must allow for writing.");return a.root.writeFileSync(g(b),c,e.encoding,f,e.mode)},a.appendFile=function(b,c,e,f){void 0===f&&(f=i);var j=h(e,"utf8","a",420);f="function"==typeof e?e:f;var k=d(f,1);try{var l=p.getFileFlag(j.flag);if(!l.isAppendable())return k(new n(o.EINVAL,"Flag passed to appendFile must allow for appending."));a.root.appendFile(g(b),c,j.encoding,l,j.mode,k)}catch(m){k(m)}},a.appendFileSync=function(b,c,d){var e=h(d,"utf8","a",420),f=p.getFileFlag(e.flag);if(!f.isAppendable())throw new n(o.EINVAL,"Flag passed to appendFile must allow for appending.");return a.root.appendFileSync(g(b),c,e.encoding,f,e.mode)},a.fstat=function(a,b){void 0===b&&(b=i);var c=d(b,2);try{e(a),a.stat(c)}catch(f){c(f)}},a.fstatSync=function(a){return e(a),a.statSync()},a.close=function(a,b){void 0===b&&(b=i);var c=d(b,1);try{e(a),a.close(c)}catch(f){c(f)}},a.closeSync=function(a){return e(a),a.closeSync()},a.ftruncate=function(a,b,c){void 0===c&&(c=i);var f="number"==typeof b?b:0;c="function"==typeof b?b:c;var g=d(c,1);try{if(e(a),0>f)throw new n(o.EINVAL);a.truncate(f,g)}catch(h){g(h)}},a.ftruncateSync=function(a,b){return void 0===b&&(b=0),e(a),a.truncateSync(b)},a.fsync=function(a,b){void 0===b&&(b=i);var c=d(b,1);try{e(a),a.sync(c)}catch(f){c(f)}},a.fsyncSync=function(a){return e(a),a.syncSync()},a.fdatasync=function(a,b){void 0===b&&(b=i);var c=d(b,1);try{e(a),a.datasync(c)}catch(f){c(f)}},a.fdatasyncSync=function(a){e(a),a.datasyncSync()},a.write=function(a,b,c,f,g,h){void 0===h&&(h=i);var j,k,l,m=null;if("string"==typeof b){var p="utf8";switch(typeof c){case"function":h=c;break;case"number":m=c,
p="string"==typeof f?f:"utf8",h="function"==typeof g?g:h;break;default:return(h="function"==typeof f?f:"function"==typeof g?g:h)(new n(o.EINVAL,"Invalid arguments."))}j=new q(b,p),k=0,l=j.length}else j=b,k=c,l=f,m="number"==typeof g?g:null,h="function"==typeof g?g:h;var r=d(h,3);try{e(a),null==m&&(m=a.getPos()),a.write(j,k,l,m,r)}catch(s){r(s)}},a.writeSync=function(a,b,c,d,f){var g,h,i,j=0;if("string"==typeof b){i="number"==typeof c?c:null;var k="string"==typeof d?d:"utf8";j=0,g=new q(b,k),h=g.length}else g=b,j=c,h=d,i="number"==typeof f?f:null;return e(a),null==i&&(i=a.getPos()),a.writeSync(g,j,h,i)},a.read=function(a,b,c,f,g,h){void 0===h&&(h=i);var j,k,l,m,n;if("number"==typeof b){l=b,j=c;var o=f;h="function"==typeof g?g:h,k=0,m=new q(l),n=d(function(a,b,c){return a?h(a):void h(a,c.toString(o),b)},3)}else m=b,k=c,l=f,j=g,n=d(h,3);try{e(a),null==j&&(j=a.getPos()),a.read(m,k,l,j,n)}catch(p){n(p)}},a.readSync=function(a,b,c,d,f){var g,h,i,j,k=!1;if("number"==typeof b){i=b,j=c;var l=d;h=0,g=new q(i),k=!0}else g=b,h=c,i=d,j=f;e(a),null==j&&(j=a.getPos());var m=a.readSync(g,h,i,j);return k?[g.toString(l),m]:m},a.fchown=function(a,b,c,f){void 0===f&&(f=i);var g=d(f,1);try{e(a),a.chown(b,c,g)}catch(h){g(h)}},a.fchownSync=function(a,b,c){return e(a),a.chownSync(b,c)},a.fchmod=function(a,b,c){void 0===c&&(c=i);var f=d(c,1);try{b="string"==typeof b?parseInt(b,8):b,e(a),a.chmod(b,f)}catch(g){f(g)}},a.fchmodSync=function(a,b){return b="string"==typeof b?parseInt(b,8):b,e(a),a.chmodSync(b)},a.futimes=function(a,b,c,f){void 0===f&&(f=i);var g=d(f,1);try{e(a),"number"==typeof b&&(b=new Date(1e3*b)),"number"==typeof c&&(c=new Date(1e3*c)),a.utimes(b,c,g)}catch(h){g(h)}},a.futimesSync=function(a,b,c){return e(a),"number"==typeof b&&(b=new Date(1e3*b)),"number"==typeof c&&(c=new Date(1e3*c)),a.utimesSync(b,c)},a.rmdir=function(b,c){void 0===c&&(c=i);var e=d(c,1);try{b=g(b),a.root.rmdir(b,e)}catch(f){e(f)}},a.rmdirSync=function(b){return b=g(b),a.root.rmdirSync(b)},a.mkdir=function(b,c,e){void 0===e&&(e=i),"function"==typeof c&&(e=c,c=511);var f=d(e,1);try{b=g(b),a.root.mkdir(b,c,f)}catch(h){f(h)}},a.mkdirSync=function(b,c){return void 0===c&&(c=511),c="string"==typeof c?parseInt(c,8):c,b=g(b),a.root.mkdirSync(b,c)},a.readdir=function(b,c){void 0===c&&(c=i);var e=d(c,2);try{b=g(b),a.root.readdir(b,e)}catch(f){e(f)}},a.readdirSync=function(b){return b=g(b),a.root.readdirSync(b)},a.link=function(b,c,e){void 0===e&&(e=i);var f=d(e,1);try{b=g(b),c=g(c),a.root.link(b,c,f)}catch(h){f(h)}},a.linkSync=function(b,c){return b=g(b),c=g(c),a.root.linkSync(b,c)},a.symlink=function(b,c,e,f){void 0===f&&(f=i);var h="string"==typeof e?e:"file";f="function"==typeof e?e:f;var j=d(f,1);try{if("file"!==h&&"dir"!==h)return j(new n(o.EINVAL,"Invalid type: "+h));b=g(b),c=g(c),a.root.symlink(b,c,h,j)}catch(k){j(k)}},a.symlinkSync=function(b,c,d){if(null==d)d="file";else if("file"!==d&&"dir"!==d)throw new n(o.EINVAL,"Invalid type: "+d);return b=g(b),c=g(c),a.root.symlinkSync(b,c,d)},a.readlink=function(b,c){void 0===c&&(c=i);var e=d(c,2);try{b=g(b),a.root.readlink(b,e)}catch(f){e(f)}},a.readlinkSync=function(b){return b=g(b),a.root.readlinkSync(b)},a.chown=function(b,c,e,f){void 0===f&&(f=i);var h=d(f,1);try{b=g(b),a.root.chown(b,!1,c,e,h)}catch(j){h(j)}},a.chownSync=function(b,c,d){b=g(b),a.root.chownSync(b,!1,c,d)},a.lchown=function(b,c,e,f){void 0===f&&(f=i);var h=d(f,1);try{b=g(b),a.root.chown(b,!0,c,e,h)}catch(j){h(j)}},a.lchownSync=function(b,c,d){return b=g(b),a.root.chownSync(b,!0,c,d)},a.chmod=function(b,c,e){void 0===e&&(e=i);var f=d(e,1);try{c="string"==typeof c?parseInt(c,8):c,b=g(b),a.root.chmod(b,!1,c,f)}catch(h){f(h)}},a.chmodSync=function(b,c){return c="string"==typeof c?parseInt(c,8):c,b=g(b),a.root.chmodSync(b,!1,c)},a.lchmod=function(b,c,e){void 0===e&&(e=i);var f=d(e,1);try{c="string"==typeof c?parseInt(c,8):c,b=g(b),a.root.chmod(b,!0,c,f)}catch(h){f(h)}},a.lchmodSync=function(b,c){return b=g(b),c="string"==typeof c?parseInt(c,8):c,a.root.chmodSync(b,!0,c)},a.utimes=function(b,c,e,f){void 0===f&&(f=i);var h=d(f,1);try{b=g(b),"number"==typeof c&&(c=new Date(1e3*c)),"number"==typeof e&&(e=new Date(1e3*e)),a.root.utimes(b,c,e,h)}catch(j){h(j)}},a.utimesSync=function(b,c,d){return b=g(b),"number"==typeof c&&(c=new Date(1e3*c)),"number"==typeof d&&(d=new Date(1e3*d)),a.root.utimesSync(b,c,d)},a.realpath=function(b,c,e){void 0===e&&(e=i);var f="object"==typeof c?c:{};e="function"==typeof c?c:i;var h=d(e,2);try{b=g(b),a.root.realpath(b,f,h)}catch(j){h(j)}},a.realpathSync=function(b,c){return void 0===c&&(c={}),b=g(b),a.root.realpathSync(b,c)},a.root=null,a}();b.exports=r},{"./api_error":14,"./buffer":16,"./file_flag":22,"./node_path":28}],27:[function(a,b,c){var d=a("./buffer"),e=d.Buffer;!function(a){a[a.FILE=32768]="FILE",a[a.DIRECTORY=16384]="DIRECTORY",a[a.SYMLINK=40960]="SYMLINK"}(c.FileType||(c.FileType={}));var f=c.FileType,g=function(){function a(a,b,c,d,e,g){if(void 0===d&&(d=new Date),void 0===e&&(e=new Date),void 0===g&&(g=new Date),this.size=b,this.mode=c,this.atime=d,this.mtime=e,this.ctime=g,this.dev=0,this.ino=0,this.rdev=0,this.nlink=1,this.blksize=4096,this.uid=0,this.gid=0,null==this.mode)switch(a){case f.FILE:this.mode=420;break;case f.DIRECTORY:default:this.mode=511}this.blocks=Math.ceil(b/512),this.mode<4096&&(this.mode|=a)}return a.prototype.toBuffer=function(){var a=new e(32);return a.writeUInt32LE(this.size,0),a.writeUInt32LE(this.mode,4),a.writeDoubleLE(this.atime.getTime(),8),a.writeDoubleLE(this.mtime.getTime(),16),a.writeDoubleLE(this.ctime.getTime(),24),a},a.fromBuffer=function(b){var c=b.readUInt32LE(0),d=b.readUInt32LE(4),e=b.readDoubleLE(8),f=b.readDoubleLE(16),g=b.readDoubleLE(24);return new a(61440&d,c,4095&d,new Date(e),new Date(f),new Date(g))},a.prototype.clone=function(){return new a(61440&this.mode,this.size,4095&this.mode,this.atime,this.mtime,this.ctime)},a.prototype.isFile=function(){return(61440&this.mode)===f.FILE},a.prototype.isDirectory=function(){return(61440&this.mode)===f.DIRECTORY},a.prototype.isSymbolicLink=function(){return(61440&this.mode)===f.SYMLINK},a.prototype.chmod=function(a){this.mode=61440&this.mode|a},a.prototype.isSocket=function(){return!1},a.prototype.isBlockDevice=function(){return!1},a.prototype.isCharacterDevice=function(){return!1},a.prototype.isFIFO=function(){return!1},a}();c.Stats=g},{"./buffer":16}],28:[function(a,b,c){var d=a("./node_process"),e=d.process,f=function(){function a(){}return a.normalize=function(b){""===b&&(b=".");var c=b.charAt(0)===a.sep;b=a._removeDuplicateSeps(b);for(var d=b.split(a.sep),e=[],f=0;f<d.length;f++){var g=d[f];"."!==g&&(".."===g&&(c||!c&&e.length>0&&".."!==e[0])?e.pop():e.push(g))}if(!c&&e.length<2)switch(e.length){case 1:""===e[0]&&e.unshift(".");break;default:e.push(".")}return b=e.join(a.sep),c&&b.charAt(0)!==a.sep&&(b=a.sep+b),b},a.join=function(){for(var b=[],c=0;c<arguments.length;c++)b[c-0]=arguments[c];for(var d=[],e=0;e<b.length;e++){var f=b[e];if("string"!=typeof f)throw new TypeError("Invalid argument type to path.join: "+typeof f);""!==f&&d.push(f)}return a.normalize(d.join(a.sep))},a.resolve=function(){for(var b=[],c=0;c<arguments.length;c++)b[c-0]=arguments[c];for(var d=[],f=0;f<b.length;f++){var g=b[f];if("string"!=typeof g)throw new TypeError("Invalid argument type to path.join: "+typeof g);""!==g&&(g.charAt(0)===a.sep&&(d=[]),d.push(g))}var h=a.normalize(d.join(a.sep));if(h.length>1&&h.charAt(h.length-1)===a.sep)return h.substr(0,h.length-1);if(h.charAt(0)!==a.sep){"."!==h.charAt(0)||1!==h.length&&h.charAt(1)!==a.sep||(h=1===h.length?"":h.substr(2));var i=e.cwd();h=""!==h?this.normalize(i+("/"!==i?a.sep:"")+h):i}return h},a.relative=function(b,c){var d;b=a.resolve(b),c=a.resolve(c);var e=b.split(a.sep),f=c.split(a.sep);f.shift(),e.shift();var g=0,h=[];for(d=0;d<e.length;d++){var i=e[d];if(i!==f[d]){g=e.length-d;break}}h=f.slice(d),1===e.length&&""===e[0]&&(g=0),g>e.length&&(g=e.length);var j="";for(d=0;g>d;d++)j+="../";return j+=h.join(a.sep),j.length>1&&j.charAt(j.length-1)===a.sep&&(j=j.substr(0,j.length-1)),j},a.dirname=function(b){b=a._removeDuplicateSeps(b);var c=b.charAt(0)===a.sep,d=b.split(a.sep);return""===d.pop()&&d.length>0&&d.pop(),d.length>1||1===d.length&&!c?d.join(a.sep):c?a.sep:"."},a.basename=function(b,c){if(void 0===c&&(c=""),""===b)return b;b=a.normalize(b);var d=b.split(a.sep),e=d[d.length-1];if(""===e&&d.length>1)return d[d.length-2];if(c.length>0){var f=e.substr(e.length-c.length);if(f===c)return e.substr(0,e.length-c.length)}return e},a.extname=function(b){b=a.normalize(b);var c=b.split(a.sep);if(b=c.pop(),""===b&&c.length>0&&(b=c.pop()),".."===b)return"";var d=b.lastIndexOf(".");return-1===d||0===d?"":b.substr(d)},a.isAbsolute=function(b){return b.length>0&&b.charAt(0)===a.sep},a._makeLong=function(a){return a},a._removeDuplicateSeps=function(a){return a=a.replace(this._replaceRegex,this.sep)},a.sep="/",a._replaceRegex=new RegExp("//+","g"),a.delimiter=":",a}();b.exports=f},{"./node_process":29}],29:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("./node_eventemitter"),f=null,g=function(a){function b(){a.call(this,!0,!0),this.isRaw=!1,this.columns=80,this.rows=120,this.isTTY=!0}return d(b,a),b.prototype.setReadMode=function(a){this.isRaw!==a&&(this.isRaw=a,this.emit("modeChange"))},b.prototype.changeColumns=function(a){a!==this.columns&&(this.columns=a,this.emit("resize"))},b.prototype.changeRows=function(a){a!==this.rows&&(this.rows=a,this.emit("resize"))},b.isatty=function(a){return a instanceof b},b}(e.AbstractDuplexStream);c.TTY=g;var h=function(){function b(){this.startTime=Date.now(),this._cwd="/",this.platform="browser",this.argv=[],this.stdout=new g,this.stderr=new g,this.stdin=new g}return b.prototype.chdir=function(b){null===f&&(f=a("./node_path")),this._cwd=f.resolve(b)},b.prototype.cwd=function(){return this._cwd},b.prototype.uptime=function(){return(Date.now()-this.startTime)/1e3|0},b}();c.Process=h,c.process=new h},{"./node_eventemitter":25,"./node_path":28}],30:[function(a,b,c){function d(a){switch(a=function(){switch(typeof a){case"object":return""+a;case"string":return a;default:throw new Error("Invalid encoding argument specified")}}(),a=a.toLowerCase()){case"utf8":case"utf-8":return e;case"ascii":return f;case"binary":return h;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return j;case"hex":return k;case"base64":return i;case"binary_string":return l;case"binary_string_ie":return m;case"extended_ascii":return g;default:throw new Error("Unknown encoding: "+a)}}c.FindUtil=d;var e=function(){function a(){}return a.str2byte=function(a,b){for(var c=b.length,d=0,e=0,f=c,g=0;d<a.length&&f>e;){var h=a.charCodeAt(d++),i=a.charCodeAt(d);if(h>=55296&&56319>=h&&i>=56320&&57343>=i){if(e+3>=f)break;g++;var j=(1023&h|1024)<<10|1023&i;b.writeUInt8(j>>18|240,e++),b.writeUInt8(j>>12&63|128,e++),b.writeUInt8(j>>6&63|128,e++),b.writeUInt8(63&j|128,e++),d++}else if(128>h)b.writeUInt8(h,e++),g++;else if(2048>h){if(e+1>=f)break;g++,b.writeUInt8(h>>6|192,e++),b.writeUInt8(63&h|128,e++)}else if(65536>h){if(e+2>=f)break;g++,b.writeUInt8(h>>12|224,e++),b.writeUInt8(h>>6&63|128,e++),b.writeUInt8(63&h|128,e++)}}return e},a.byte2str=function(a){for(var b=[],c=0;c<a.length;){var d=a.readUInt8(c++);if(128>d)b.push(String.fromCharCode(d));else{if(192>d)throw new Error("Found incomplete part of character in string.");if(224>d)b.push(String.fromCharCode((31&d)<<6|63&a.readUInt8(c++)));else if(240>d)b.push(String.fromCharCode((15&d)<<12|(63&a.readUInt8(c++))<<6|63&a.readUInt8(c++)));else{if(!(248>d))throw new Error("Unable to represent UTF-8 string as UTF-16 JavaScript string.");var e=a.readUInt8(c+2);b.push(String.fromCharCode(1023&((7&d)<<8|(63&a.readUInt8(c++))<<2|(63&a.readUInt8(c++))>>4)|55296)),b.push(String.fromCharCode((15&e)<<6|63&a.readUInt8(c++)|56320))}}}return b.join("")},a.byteLength=function(a){var b=encodeURIComponent(a).match(/%[89ABab]/g);return a.length+(b?b.length:0)},a}();c.UTF8=e;var f=function(){function a(){}return a.str2byte=function(a,b){for(var c=a.length>b.length?b.length:a.length,d=0;c>d;d++)b.writeUInt8(a.charCodeAt(d)%256,d);return c},a.byte2str=function(a){for(var b=new Array(a.length),c=0;c<a.length;c++)b[c]=String.fromCharCode(127&a.readUInt8(c));return b.join("")},a.byteLength=function(a){return a.length},a}();c.ASCII=f;var g=function(){function a(){}return a.str2byte=function(b,c){for(var d=b.length>c.length?c.length:b.length,e=0;d>e;e++){var f=b.charCodeAt(e);if(f>127){var g=a.extendedChars.indexOf(b.charAt(e));g>-1&&(f=g+128)}c.writeUInt8(f,e)}return d},a.byte2str=function(b){for(var c=new Array(b.length),d=0;d<b.length;d++){var e=b.readUInt8(d);e>127?c[d]=a.extendedChars[e-128]:c[d]=String.fromCharCode(e)}return c.join("")},a.byteLength=function(a){return a.length},a.extendedChars=["Ç","ü","é","â","ä","à","å","ç","ê","ë","è","ï","î","ì","Ä","Å","É","æ","Æ","ô","ö","ò","û","ù","ÿ","Ö","Ü","ø","£","Ø","×","ƒ","á","í","ó","ú","ñ","Ñ","ª","º","¿","®","¬","½","¼","¡","«","»","_","_","_","¦","¦","Á","Â","À","©","¦","¦","+","+","¢","¥","+","+","-","-","+","-","+","ã","Ã","+","+","-","-","¦","-","+","¤","ð","Ð","Ê","Ë","È","i","Í","Î","Ï","+","+","_","_","¦","Ì","_","Ó","ß","Ô","Ò","õ","Õ","µ","þ","Þ","Ú","Û","Ù","ý","Ý","¯","´","­","±","_","¾","¶","§","÷","¸","°","¨","·","¹","³","²","_"," "],a}();c.ExtendedASCII=g;var h=function(){function a(){}return a.str2byte=function(a,b){for(var c=a.length>b.length?b.length:a.length,d=0;c>d;d++)b.writeUInt8(255&a.charCodeAt(d),d);return c},a.byte2str=function(a){for(var b=new Array(a.length),c=0;c<a.length;c++)b[c]=String.fromCharCode(255&a.readUInt8(c));return b.join("")},a.byteLength=function(a){return a.length},a}();c.BINARY=h;var i=function(){function a(){}return a.byte2str=function(b){for(var c="",d=0;d<b.length;){var e=b.readUInt8(d++),f=d<b.length?b.readUInt8(d++):NaN,g=d<b.length?b.readUInt8(d++):NaN,h=e>>2,i=(3&e)<<4|f>>4,j=(15&f)<<2|g>>6,k=63&g;isNaN(f)?j=k=64:isNaN(g)&&(k=64),c=c+a.num2b64[h]+a.num2b64[i]+a.num2b64[j]+a.num2b64[k]}return c},a.str2byte=function(b,c){var d=c.length,e="",f=0;b=b.replace(/[^A-Za-z0-9\+\/\=\-\_]/g,"");for(var g=0;f<b.length;){var h=a.b642num[b.charAt(f++)],i=a.b642num[b.charAt(f++)],j=a.b642num[b.charAt(f++)],k=a.b642num[b.charAt(f++)],l=h<<2|i>>4,m=(15&i)<<4|j>>2,n=(3&j)<<6|k;if(c.writeUInt8(l,g++),g===d)break;if(64!==j&&(e+=c.writeUInt8(m,g++)),g===d)break;if(64!==k&&(e+=c.writeUInt8(n,g++)),g===d)break}return g},a.byteLength=function(a){return Math.floor(6*a.replace(/[^A-Za-z0-9\+\/\-\_]/g,"").length/8)},a.b64chars=["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/","="],a.num2b64=function(){for(var b=new Array(a.b64chars.length),c=0;c<a.b64chars.length;c++){var d=a.b64chars[c];b[c]=d}return b}(),a.b642num=function(){for(var b={},c=0;c<a.b64chars.length;c++){var d=a.b64chars[c];b[d]=c}return b["-"]=62,b._=63,b}(),a}();c.BASE64=i;var j=function(){function a(){}return a.str2byte=function(a,b){var c=a.length;2*c>b.length&&(c=b.length%2===1?(b.length-1)/2:b.length/2);for(var d=0;c>d;d++)b.writeUInt16LE(a.charCodeAt(d),2*d);return 2*c},a.byte2str=function(a){if(a.length%2!==0)throw new Error("Invalid UCS2 byte array.");for(var b=new Array(a.length/2),c=0;c<a.length;c+=2)b[c/2]=String.fromCharCode(a.readUInt8(c)|a.readUInt8(c+1)<<8);return b.join("")},a.byteLength=function(a){return 2*a.length},a}();c.UCS2=j;var k=function(){function a(){}return a.str2byte=function(a,b){if(a.length%2===1)throw new Error("Invalid hex string");var c=a.length>>1;c>b.length&&(c=b.length);for(var d=0;c>d;d++){var e=this.hex2num[a.charAt(d<<1)],f=this.hex2num[a.charAt((d<<1)+1)];b.writeUInt8(e<<4|f,d)}return c},a.byte2str=function(a){for(var b=a.length,c=new Array(b<<1),d=0,e=0;b>e;e++){var f=15&a.readUInt8(e),g=a.readUInt8(e)>>4;c[d++]=this.num2hex[g],c[d++]=this.num2hex[f]}return c.join("")},a.byteLength=function(a){return a.length>>1},a.HEXCHARS="0123456789abcdef",a.num2hex=function(){for(var b=new Array(a.HEXCHARS.length),c=0;c<a.HEXCHARS.length;c++){var d=a.HEXCHARS[c];b[c]=d}return b}(),a.hex2num=function(){var b,c,d={};for(b=0;b<a.HEXCHARS.length;b++)c=a.HEXCHARS[b],d[c]=b;var e="ABCDEF";for(b=0;b<e.length;b++)c=e[b],d[c]=b+10;return d}(),a}();c.HEX=k;var l=function(){function a(){}return a.str2byte=function(b,c){if(0===b.length)return 0;var d=a.byteLength(b);d>c.length&&(d=c.length);var e=0,f=0,g=f+d,h=b.charCodeAt(e++);0!==h&&(c.writeUInt8(255&h,0),f=1);for(var i=f;g>i;i+=2){var j=b.charCodeAt(e++);g-i===1&&c.writeUInt8(j>>8,i),g-i>=2&&c.writeUInt16BE(j,i)}return d},a.byte2str=function(a){var b=a.length;if(0===b)return"";for(var c=new Array((b>>1)+1),d=0,e=0;e<c.length;e++)0===e?b%2===1?c[e]=String.fromCharCode(256|a.readUInt8(d++)):c[e]=String.fromCharCode(0):c[e]=String.fromCharCode(a.readUInt8(d++)<<8|a.readUInt8(d++));return c.join("")},a.byteLength=function(a){if(0===a.length)return 0;var b=a.charCodeAt(0),c=a.length-1<<1;return 0!==b&&c++,c},a}();c.BINSTR=l;var m=function(){function a(){}return a.str2byte=function(a,b){for(var c=a.length>b.length?b.length:a.length,d=0;c>d;d++)b.writeUInt8(a.charCodeAt(d)-32,d);return c},a.byte2str=function(a){for(var b=new Array(a.length),c=0;c<a.length;c++)b[c]=String.fromCharCode(a.readUInt8(c)+32);return b.join("")},a.byteLength=function(a){return a.length},a}();c.BINSTRIE=m},{}],31:[function(a,b,c){c.isIE="undefined"!=typeof navigator&&(null!=/(msie) ([\w.]+)/.exec(navigator.userAgent.toLowerCase())||-1!==navigator.userAgent.indexOf("Trident")),c.isWebWorker="undefined"==typeof window},{}],32:[function(a,b,c){var d=a("../core/browserfs"),e=a("../core/node_fs"),f=a("../core/buffer"),g=a("../core/buffer_core_arraybuffer"),h=f.Buffer,i=g.BufferCoreArrayBuffer,j=function(){function a(a){this.fs=a,this.FS=a.getFS(),this.PATH=a.getPATH(),this.ERRNO_CODES=a.getERRNO_CODES()}return a.prototype.open=function(a){var b=this.fs.realPath(a.node),c=this.FS;try{c.isFile(a.node.mode)&&(a.nfd=e.openSync(b,this.fs.flagsToPermissionString(a.flags)))}catch(d){if(!d.code)throw d;throw new c.ErrnoError(this.ERRNO_CODES[d.code])}},a.prototype.close=function(a){var b=this.FS;try{b.isFile(a.node.mode)&&a.nfd&&e.closeSync(a.nfd)}catch(c){if(!c.code)throw c;throw new b.ErrnoError(this.ERRNO_CODES[c.code])}},a.prototype.read=function(a,b,c,d,f){var g,j=new i(b.buffer),k=new h(j,b.byteOffset+c,b.byteOffset+c+d);try{g=e.readSync(a.nfd,k,0,d,f)}catch(l){throw new this.FS.ErrnoError(this.ERRNO_CODES[l.code])}return g},a.prototype.write=function(a,b,c,d,f){var g,j=new i(b.buffer),k=new h(j,b.byteOffset+c,b.byteOffset+c+d);try{g=e.writeSync(a.nfd,k,0,d,f)}catch(l){throw new this.FS.ErrnoError(this.ERRNO_CODES[l.code])}return g},a.prototype.llseek=function(a,b,c){var d=b;if(1===c)d+=a.position;else if(2===c&&this.FS.isFile(a.node.mode))try{var f=e.fstatSync(a.nfd);d+=f.size}catch(g){throw new this.FS.ErrnoError(this.ERRNO_CODES[g.code])}if(0>d)throw new this.FS.ErrnoError(this.ERRNO_CODES.EINVAL);return a.position=d,d},a}(),k=function(){function a(a){this.fs=a,this.FS=a.getFS(),this.PATH=a.getPATH(),this.ERRNO_CODES=a.getERRNO_CODES()}return a.prototype.getattr=function(a){var b,c=this.fs.realPath(a);try{b=e.lstatSync(c)}catch(d){if(!d.code)throw d;throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code])}return{dev:b.dev,ino:b.ino,mode:b.mode,nlink:b.nlink,uid:b.uid,gid:b.gid,rdev:b.rdev,size:b.size,atime:b.atime,mtime:b.mtime,ctime:b.ctime,blksize:b.blksize,blocks:b.blocks}},a.prototype.setattr=function(a,b){var c=this.fs.realPath(a);try{if(void 0!==b.mode&&(e.chmodSync(c,b.mode),a.mode=b.mode),void 0!==b.timestamp){var d=new Date(b.timestamp);e.utimesSync(c,d,d)}}catch(f){if(!f.code)throw f;if("ENOTSUP"!==f.code)throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code])}if(void 0!==b.size)try{e.truncateSync(c,b.size)}catch(f){if(!f.code)throw f;throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code])}},a.prototype.lookup=function(a,b){var c=this.PATH.join2(this.fs.realPath(a),b),d=this.fs.getMode(c);return this.fs.createNode(a,b,d)},a.prototype.mknod=function(a,b,c,d){var f=this.fs.createNode(a,b,c,d),g=this.fs.realPath(f);try{this.FS.isDir(f.mode)?e.mkdirSync(g,f.mode):e.writeFileSync(g,"",{mode:f.mode})}catch(h){if(!h.code)throw h;throw new this.FS.ErrnoError(this.ERRNO_CODES[h.code])}return f},a.prototype.rename=function(a,b,c){var d=this.fs.realPath(a),f=this.PATH.join2(this.fs.realPath(b),c);try{e.renameSync(d,f)}catch(g){if(!g.code)throw g;throw new this.FS.ErrnoError(this.ERRNO_CODES[g.code])}},a.prototype.unlink=function(a,b){var c=this.PATH.join2(this.fs.realPath(a),b);try{e.unlinkSync(c)}catch(d){if(!d.code)throw d;throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code])}},a.prototype.rmdir=function(a,b){var c=this.PATH.join2(this.fs.realPath(a),b);try{e.rmdirSync(c)}catch(d){if(!d.code)throw d;throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code])}},a.prototype.readdir=function(a){var b=this.fs.realPath(a);try{return e.readdirSync(b)}catch(c){if(!c.code)throw c;throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code])}},a.prototype.symlink=function(a,b,c){var d=this.PATH.join2(this.fs.realPath(a),b);try{e.symlinkSync(c,d)}catch(f){if(!f.code)throw f;throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code])}},a.prototype.readlink=function(a){var b=this.fs.realPath(a);try{return e.readlinkSync(b)}catch(c){if(!c.code)throw c;throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code])}},a}(),l=function(){function a(a,b,c){if(void 0===a&&(a=self.FS),void 0===b&&(b=self.PATH),void 0===c&&(c=self.ERRNO_CODES),this.flagsToPermissionStringMap={0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},"undefined"==typeof d)throw new Error("BrowserFS is not loaded. Please load it before this library.");this.FS=a,this.PATH=b,this.ERRNO_CODES=c,this.node_ops=new k(this),this.stream_ops=new j(this)}return a.prototype.mount=function(a){return this.createNode(null,"/",this.getMode(a.opts.root),0)},a.prototype.createNode=function(a,b,c,d){var e=this.FS;if(!e.isDir(c)&&!e.isFile(c)&&!e.isLink(c))throw new e.ErrnoError(this.ERRNO_CODES.EINVAL);var f=e.createNode(a,b,c);return f.node_ops=this.node_ops,f.stream_ops=this.stream_ops,f},a.prototype.getMode=function(a){var b;try{b=e.lstatSync(a)}catch(c){if(!c.code)throw c;throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code])}return b.mode},a.prototype.realPath=function(a){for(var b=[];a.parent!==a;)b.push(a.name),a=a.parent;return b.push(a.mount.opts.root),b.reverse(),this.PATH.join.apply(null,b)},a.prototype.flagsToPermissionString=function(a){return a in this.flagsToPermissionStringMap?this.flagsToPermissionStringMap[a]:a},a.prototype.getFS=function(){return this.FS},a.prototype.getPATH=function(){return this.PATH},a.prototype.getERRNO_CODES=function(){return this.ERRNO_CODES},a}();c.BFSEmscriptenFS=l,d.EmscriptenFS=l},{"../core/browserfs":15,"../core/buffer":16,"../core/buffer_core_arraybuffer":19,"../core/node_fs":26}],33:[function(a,b,c){var d=a("../core/node_fs_stats"),e=a("../core/node_path"),f=d.Stats,g=function(){function a(){this._index={},this.addPath("/",new i)}return a.prototype._split_path=function(a){var b=e.dirname(a),c=a.substr(b.length+("/"===b?0:1));return[b,c]},a.prototype.fileIterator=function(a){for(var b in this._index)for(var c=this._index[b],d=c.getListing(),e=0;e<d.length;e++){var f=c.getItem(d[e]);f.isFile()&&a(f.getData())}},a.prototype.addPath=function(a,b){if(null==b)throw new Error("Inode must be specified");if("/"!==a[0])throw new Error("Path must be absolute, got: "+a);if(this._index.hasOwnProperty(a))return this._index[a]===b;var c=this._split_path(a),d=c[0],e=c[1],f=this._index[d];return(void 0!==f||"/"===a||(f=new i,this.addPath(d,f)))&&("/"===a||f.addItem(e,b))?(b.isFile()||(this._index[a]=b),!0):!1},a.prototype.removePath=function(a){var b=this._split_path(a),c=b[0],d=b[1],e=this._index[c];if(void 0===e)return null;var f=e.remItem(d);if(null===f)return null;if(!f.isFile()){for(var g=f,h=g.getListing(),i=0;i<h.length;i++)this.removePath(a+"/"+h[i]);"/"!==a&&delete this._index[a]}return f},a.prototype.ls=function(a){var b=this._index[a];return void 0===b?null:b.getListing()},a.prototype.getInode=function(a){var b=this._split_path(a),c=b[0],d=b[1],e=this._index[c];return void 0===e?null:c===a?e:e.getItem(d)},a.from_listing=function(b){var c=new a,e=new i;c._index["/"]=e;for(var g=[["",b,e]];g.length>0;){var j,k=g.pop(),l=k[0],m=k[1],n=k[2];for(var o in m){var p=m[o],q=""+l+"/"+o;null!=p?(c._index[q]=j=new i,g.push([q,p,j])):j=new h(new f(d.FileType.FILE,-1,365)),null!=n&&(n._ls[o]=j)}}return c},a}();c.FileIndex=g;var h=function(){function a(a){this.data=a}return a.prototype.isFile=function(){return!0},a.prototype.isDir=function(){return!1},a.prototype.getData=function(){return this.data},a.prototype.setData=function(a){this.data=a},a}();c.FileInode=h;var i=function(){function a(){this._ls={}}return a.prototype.isFile=function(){return!1},a.prototype.isDir=function(){return!0},a.prototype.getStats=function(){return new f(d.FileType.DIRECTORY,4096,365)},a.prototype.getListing=function(){return Object.keys(this._ls)},a.prototype.getItem=function(a){var b;return null!=(b=this._ls[a])?b:null},a.prototype.addItem=function(a,b){return a in this._ls?!1:(this._ls[a]=b,!0)},a.prototype.remItem=function(a){var b=this._ls[a];return void 0===b?null:(delete this._ls[a],b)},a}();c.DirInode=i},{"../core/node_fs_stats":27,"../core/node_path":28}],34:[function(a,b,c){var d=a("../core/node_fs_stats"),e=a("../core/buffer"),f=function(){function a(a,b,c,d,e,f){this.id=a,this.size=b,this.mode=c,this.atime=d,this.mtime=e,this.ctime=f}return a.prototype.toStats=function(){return new d.Stats((61440&this.mode)===d.FileType.DIRECTORY?d.FileType.DIRECTORY:d.FileType.FILE,this.size,this.mode,new Date(this.atime),new Date(this.mtime),new Date(this.ctime))},a.prototype.getSize=function(){return 30+this.id.length},a.prototype.toBuffer=function(a){return void 0===a&&(a=new e.Buffer(this.getSize())),a.writeUInt32LE(this.size,0),a.writeUInt16LE(this.mode,4),a.writeDoubleLE(this.atime,6),a.writeDoubleLE(this.mtime,14),a.writeDoubleLE(this.ctime,22),a.write(this.id,30,this.id.length,"ascii"),a},a.prototype.update=function(a){var b=!1;this.size!==a.size&&(this.size=a.size,b=!0),this.mode!==a.mode&&(this.mode=a.mode,b=!0);var c=a.atime.getTime();this.atime!==c&&(this.atime=c,b=!0);var d=a.mtime.getTime();this.mtime!==d&&(this.mtime=d,b=!0);var e=a.ctime.getTime();return this.ctime!==e&&(this.ctime=e,b=!0),b},a.fromBuffer=function(b){if(void 0===b)throw new Error("NO");return new a(b.toString("ascii",30),b.readUInt32LE(0),b.readUInt16LE(4),b.readDoubleLE(6),b.readDoubleLE(14),b.readDoubleLE(22))},a.prototype.isFile=function(){return(61440&this.mode)===d.FileType.FILE},a.prototype.isDirectory=function(){return(61440&this.mode)===d.FileType.DIRECTORY},a}();b.exports=f},{"../core/buffer":16,"../core/node_fs_stats":27}],35:[function(a,b,c){function d(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=16*Math.random()|0,c="x"==a?b:3&b|8;return c.toString(16)})}function e(a,b){return a?(b(a),!1):!0}function f(a,b,c){return a?(b.abort(function(){c(a)}),!1):!0}var g=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},h=a("../core/file_system"),i=a("../core/api_error"),j=a("../core/node_fs_stats"),k=a("../core/node_path"),l=a("../generic/inode"),m=a("../core/buffer"),n=a("../generic/preload_file"),o="/",p=i.ApiError,q=m.Buffer,r=function(){function a(a){this.store=a,this.originalData={},this.modifiedKeys=[]}return a.prototype.stashOldValue=function(a,b){this.originalData.hasOwnProperty(a)||(this.originalData[a]=b)},a.prototype.markModified=function(a){-1===this.modifiedKeys.indexOf(a)&&(this.modifiedKeys.push(a),this.originalData.hasOwnProperty(a)||(this.originalData[a]=this.store.get(a)))},a.prototype.get=function(a){var b=this.store.get(a);return this.stashOldValue(a,b),b},a.prototype.put=function(a,b,c){return this.markModified(a),this.store.put(a,b,c)},a.prototype["delete"]=function(a){this.markModified(a),this.store["delete"](a)},a.prototype.commit=function(){},a.prototype.abort=function(){var a,b,c;for(a=0;a<this.modifiedKeys.length;a++)b=this.modifiedKeys[a],c=this.originalData[b],null===c?this.store["delete"](b):this.store.put(b,c,!0)},a}();c.SimpleSyncRWTransaction=r;var s=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return g(b,a),b.prototype.syncSync=function(){this.isDirty()&&(this._fs._syncSync(this.getPath(),this.getBuffer(),this.getStats()),this.resetDirty())},b.prototype.closeSync=function(){this.syncSync()},b}(n.PreloadFile);c.SyncKeyValueFile=s;var t=function(a){function b(b){a.call(this),this.store=b.store,this.makeRootDirectory()}return g(b,a),b.isAvailable=function(){return!0},b.prototype.getName=function(){return this.store.name()},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSymlinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!0},b.prototype.makeRootDirectory=function(){var a=this.store.beginTransaction("readwrite");if(void 0===a.get(o)){var b=(new Date).getTime(),c=new l(d(),4096,511|j.FileType.DIRECTORY,b,b,b);a.put(c.id,new q("{}"),!1),a.put(o,c.toBuffer(),!1),a.commit()}},b.prototype._findINode=function(a,b,c){var d=this,e=function(e){var f=d.getDirListing(a,b,e);if(f[c])return f[c];throw p.ENOENT(k.resolve(b,c))};return"/"===b?""===c?o:e(this.getINode(a,b,o)):e(this.getINode(a,b+k.sep+c,this._findINode(a,k.dirname(b),k.basename(b))))},b.prototype.findINode=function(a,b){return this.getINode(a,b,this._findINode(a,k.dirname(b),k.basename(b)))},b.prototype.getINode=function(a,b,c){var d=a.get(c);if(void 0===d)throw p.ENOENT(b);return l.fromBuffer(d)},b.prototype.getDirListing=function(a,b,c){if(!c.isDirectory())throw p.ENOTDIR(b);var d=a.get(c.id);if(void 0===d)throw p.ENOENT(b);return JSON.parse(d.toString())},b.prototype.addNewNode=function(a,b){for(var c,e=0;5>e;)try{return c=d(),a.put(c,b,!1),c}catch(f){}throw new p(i.ErrorCode.EIO,"Unable to commit data to key-value store.")},b.prototype.commitNewFile=function(a,b,c,d,e){var f=k.dirname(b),g=k.basename(b),h=this.findINode(a,f),i=this.getDirListing(a,f,h),j=(new Date).getTime();if("/"===b)throw p.EEXIST(b);if(i[g])throw p.EEXIST(b);try{var m=this.addNewNode(a,e),n=new l(m,e.length,d|c,j,j,j),o=this.addNewNode(a,n.toBuffer());i[g]=o,a.put(h.id,new q(JSON.stringify(i)),!0)}catch(r){throw a.abort(),r}return a.commit(),n},b.prototype.empty=function(){this.store.clear(),this.makeRootDirectory()},b.prototype.renameSync=function(a,b){var c=this.store.beginTransaction("readwrite"),d=k.dirname(a),e=k.basename(a),f=k.dirname(b),g=k.basename(b),h=this.findINode(c,d),j=this.getDirListing(c,d,h);if(!j[e])throw p.ENOENT(a);var l=j[e];if(delete j[e],0===(f+"/").indexOf(a+"/"))throw new p(i.ErrorCode.EBUSY,d);var m,n;if(f===d?(m=h,n=j):(m=this.findINode(c,f),n=this.getDirListing(c,f,m)),n[g]){var o=this.getINode(c,b,n[g]);if(!o.isFile())throw p.EPERM(b);try{c["delete"](o.id),c["delete"](n[g])}catch(r){throw c.abort(),r}}n[g]=l;try{c.put(h.id,new q(JSON.stringify(j)),!0),c.put(m.id,new q(JSON.stringify(n)),!0)}catch(r){throw c.abort(),r}c.commit()},b.prototype.statSync=function(a,b){return this.findINode(this.store.beginTransaction("readonly"),a).toStats()},b.prototype.createFileSync=function(a,b,c){var d=this.store.beginTransaction("readwrite"),e=new q(0),f=this.commitNewFile(d,a,j.FileType.FILE,c,e);return new s(this,a,b,f.toStats(),e)},b.prototype.openFileSync=function(a,b){var c=this.store.beginTransaction("readonly"),d=this.findINode(c,a),e=c.get(d.id);
if(void 0===e)throw p.ENOENT(a);return new s(this,a,b,d.toStats(),e)},b.prototype.removeEntry=function(a,b){var c=this.store.beginTransaction("readwrite"),d=k.dirname(a),e=this.findINode(c,d),f=this.getDirListing(c,d,e),g=k.basename(a);if(!f[g])throw p.ENOENT(a);var h=f[g];delete f[g];var i=this.getINode(c,a,h);if(!b&&i.isDirectory())throw p.EISDIR(a);if(b&&!i.isDirectory())throw p.ENOTDIR(a);try{c["delete"](i.id),c["delete"](h),c.put(e.id,new q(JSON.stringify(f)),!0)}catch(j){throw c.abort(),j}c.commit()},b.prototype.unlinkSync=function(a){this.removeEntry(a,!1)},b.prototype.rmdirSync=function(a){this.removeEntry(a,!0)},b.prototype.mkdirSync=function(a,b){var c=this.store.beginTransaction("readwrite"),d=new q("{}");this.commitNewFile(c,a,j.FileType.DIRECTORY,b,d)},b.prototype.readdirSync=function(a){var b=this.store.beginTransaction("readonly");return Object.keys(this.getDirListing(b,a,this.findINode(b,a)))},b.prototype._syncSync=function(a,b,c){var d=this.store.beginTransaction("readwrite"),e=this._findINode(d,k.dirname(a),k.basename(a)),f=this.getINode(d,a,e),g=f.update(c);try{d.put(f.id,b,!0),g&&d.put(e,f.toBuffer(),!0)}catch(h){throw d.abort(),h}d.commit()},b}(h.SynchronousFileSystem);c.SyncKeyValueFileSystem=t;var u=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return g(b,a),b.prototype.sync=function(a){var b=this;this.isDirty()?this._fs._sync(this.getPath(),this.getBuffer(),this.getStats(),function(c){c||b.resetDirty(),a(c)}):a()},b.prototype.close=function(a){this.sync(a)},b}(n.PreloadFile);c.AsyncKeyValueFile=u;var v=function(a){function b(){a.apply(this,arguments)}return g(b,a),b.prototype.init=function(a,b){this.store=a,this.makeRootDirectory(b)},b.isAvailable=function(){return!0},b.prototype.getName=function(){return this.store.name()},b.prototype.isReadOnly=function(){return!1},b.prototype.supportsSymlinks=function(){return!1},b.prototype.supportsProps=function(){return!1},b.prototype.supportsSynch=function(){return!1},b.prototype.makeRootDirectory=function(a){var b=this.store.beginTransaction("readwrite");b.get(o,function(c,e){if(c||void 0===e){var g=(new Date).getTime(),h=new l(d(),4096,511|j.FileType.DIRECTORY,g,g,g);b.put(h.id,new q("{}"),!1,function(c){f(c,b,a)&&b.put(o,h.toBuffer(),!1,function(c){c?b.abort(function(){a(c)}):b.commit(a)})})}else b.commit(a)})},b.prototype._findINode=function(a,b,c,d){var f=this,g=function(a,e,f){a?d(a):f[c]?d(null,f[c]):d(p.ENOENT(k.resolve(b,c)))};"/"===b?""===c?d(null,o):this.getINode(a,b,o,function(c,h){e(c,d)&&f.getDirListing(a,b,h,function(a,b){g(a,h,b)})}):this.findINodeAndDirListing(a,b,g)},b.prototype.findINode=function(a,b,c){var d=this;this._findINode(a,k.dirname(b),k.basename(b),function(f,g){e(f,c)&&d.getINode(a,b,g,c)})},b.prototype.getINode=function(a,b,c,d){a.get(c,function(a,c){e(a,d)&&(void 0===c?d(p.ENOENT(b)):d(null,l.fromBuffer(c)))})},b.prototype.getDirListing=function(a,b,c,d){c.isDirectory()?a.get(c.id,function(a,c){if(e(a,d))try{d(null,JSON.parse(c.toString()))}catch(a){d(p.ENOENT(b))}}):d(p.ENOTDIR(b))},b.prototype.findINodeAndDirListing=function(a,b,c){var d=this;this.findINode(a,b,function(f,g){e(f,c)&&d.getDirListing(a,b,g,function(a,b){e(a,c)&&c(null,g,b)})})},b.prototype.addNewNode=function(a,b,c){var e,f=0,g=function(){5===++f?c(new p(i.ErrorCode.EIO,"Unable to commit data to key-value store.")):(e=d(),a.put(e,b,!1,function(a,b){a||!b?g():c(null,e)}))};g()},b.prototype.commitNewFile=function(a,b,c,d,e,g){var h=this,i=k.dirname(b),j=k.basename(b),m=(new Date).getTime();return"/"===b?g(p.EEXIST(b)):void this.findINodeAndDirListing(a,i,function(i,k,n){f(i,a,g)&&(n[j]?a.abort(function(){g(p.EEXIST(b))}):h.addNewNode(a,e,function(b,i){if(f(b,a,g)){var o=new l(i,e.length,d|c,m,m,m);h.addNewNode(a,o.toBuffer(),function(b,c){f(b,a,g)&&(n[j]=c,a.put(k.id,new q(JSON.stringify(n)),!0,function(b){f(b,a,g)&&a.commit(function(b){f(b,a,g)&&g(null,o)})}))})}}))})},b.prototype.empty=function(a){var b=this;this.store.clear(function(c){e(c,a)&&b.makeRootDirectory(a)})},b.prototype.rename=function(a,b,c){var d=this,e=this.store.beginTransaction("readwrite"),g=k.dirname(a),h=k.basename(a),j=k.dirname(b),l=k.basename(b),m={},n={},o=!1;if(0===(j+"/").indexOf(a+"/"))return c(new p(i.ErrorCode.EBUSY,g));var r=function(){if(!o&&n.hasOwnProperty(g)&&n.hasOwnProperty(j)){var i=n[g],k=m[g],r=n[j],s=m[j];if(i[h]){var t=i[h];delete i[h];var u=function(){r[l]=t,e.put(k.id,new q(JSON.stringify(i)),!0,function(a){f(a,e,c)&&(g===j?e.commit(c):e.put(s.id,new q(JSON.stringify(r)),!0,function(a){f(a,e,c)&&e.commit(c)}))})};r[l]?d.getINode(e,b,r[l],function(a,d){f(a,e,c)&&(d.isFile()?e["delete"](d.id,function(a){f(a,e,c)&&e["delete"](r[l],function(a){f(a,e,c)&&u()})}):e.abort(function(a){c(p.EPERM(b))}))}):u()}else c(p.ENOENT(a))}},s=function(a){d.findINodeAndDirListing(e,a,function(b,d,f){b?o||(o=!0,e.abort(function(){c(b)})):(m[a]=d,n[a]=f,r())})};s(g),g!==j&&s(j)},b.prototype.stat=function(a,b,c){var d=this.store.beginTransaction("readonly");this.findINode(d,a,function(a,b){e(a,c)&&c(null,b.toStats())})},b.prototype.createFile=function(a,b,c,d){var f=this,g=this.store.beginTransaction("readwrite"),h=new q(0);this.commitNewFile(g,a,j.FileType.FILE,c,h,function(c,g){e(c,d)&&d(null,new u(f,a,b,g.toStats(),h))})},b.prototype.openFile=function(a,b,c){var d=this,f=this.store.beginTransaction("readonly");this.findINode(f,a,function(g,h){e(g,c)&&f.get(h.id,function(f,g){e(f,c)&&(void 0===g?c(p.ENOENT(a)):c(null,new u(d,a,b,h.toStats(),g)))})})},b.prototype.removeEntry=function(a,b,c){var d=this,e=this.store.beginTransaction("readwrite"),g=k.dirname(a),h=k.basename(a);this.findINodeAndDirListing(e,g,function(g,i,j){if(f(g,e,c))if(j[h]){var k=j[h];delete j[h],d.getINode(e,a,k,function(d,g){f(d,e,c)&&(!b&&g.isDirectory()?e.abort(function(){c(p.EISDIR(a))}):b&&!g.isDirectory()?e.abort(function(){c(p.ENOTDIR(a))}):e["delete"](g.id,function(a){f(a,e,c)&&e["delete"](k,function(a){f(a,e,c)&&e.put(i.id,new q(JSON.stringify(j)),!0,function(a){f(a,e,c)&&e.commit(c)})})}))})}else e.abort(function(){c(p.ENOENT(a))})})},b.prototype.unlink=function(a,b){this.removeEntry(a,!1,b)},b.prototype.rmdir=function(a,b){this.removeEntry(a,!0,b)},b.prototype.mkdir=function(a,b,c){var d=this.store.beginTransaction("readwrite"),e=new q("{}");this.commitNewFile(d,a,j.FileType.DIRECTORY,b,e,c)},b.prototype.readdir=function(a,b){var c=this,d=this.store.beginTransaction("readonly");this.findINode(d,a,function(f,g){e(f,b)&&c.getDirListing(d,a,g,function(a,c){e(a,b)&&b(null,Object.keys(c))})})},b.prototype._sync=function(a,b,c,d){var e=this,g=this.store.beginTransaction("readwrite");this._findINode(g,k.dirname(a),k.basename(a),function(h,i){f(h,g,d)&&e.getINode(g,a,i,function(a,e){if(f(a,g,d)){var h=e.update(c);g.put(e.id,b,!0,function(a){f(a,g,d)&&(h?g.put(i,e.toBuffer(),!0,function(a){f(a,g,d)&&g.commit(d)}):g.commit(d))})}})})},b}(h.BaseFileSystem);c.AsyncKeyValueFileSystem=v},{"../core/api_error":14,"../core/buffer":16,"../core/file_system":23,"../core/node_fs_stats":27,"../core/node_path":28,"../generic/inode":34,"../generic/preload_file":36}],36:[function(a,b,c){var d=this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);c.prototype=b.prototype,a.prototype=new c},e=a("../core/file"),f=a("../core/buffer"),g=a("../core/api_error"),h=a("../core/node_fs"),i=g.ApiError,j=g.ErrorCode,k=f.Buffer,l=function(a){function b(b,c,d,e,f){if(a.call(this),this._pos=0,this._dirty=!1,this._fs=b,this._path=c,this._flag=d,this._stat=e,null!=f?this._buffer=f:this._buffer=new k(0),this._stat.size!==this._buffer.length&&this._flag.isReadable())throw new Error("Invalid buffer: Buffer is "+this._buffer.length+" long, yet Stats object specifies that file is "+this._stat.size+" long.")}return d(b,a),b.prototype.isDirty=function(){return this._dirty},b.prototype.resetDirty=function(){this._dirty=!1},b.prototype.getBuffer=function(){return this._buffer},b.prototype.getStats=function(){return this._stat},b.prototype.getFlag=function(){return this._flag},b.prototype.getPath=function(){return this._path},b.prototype.getPos=function(){return this._flag.isAppendable()?this._stat.size:this._pos},b.prototype.advancePos=function(a){return this._pos+=a},b.prototype.setPos=function(a){return this._pos=a},b.prototype.sync=function(a){try{this.syncSync(),a()}catch(b){a(b)}},b.prototype.syncSync=function(){throw new i(j.ENOTSUP)},b.prototype.close=function(a){try{this.closeSync(),a()}catch(b){a(b)}},b.prototype.closeSync=function(){throw new i(j.ENOTSUP)},b.prototype.stat=function(a){try{a(null,this._stat.clone())}catch(b){a(b)}},b.prototype.statSync=function(){return this._stat.clone()},b.prototype.truncate=function(a,b){try{this.truncateSync(a),this._flag.isSynchronous()&&!h.getRootFS().supportsSynch()&&this.sync(b),b()}catch(c){return b(c)}},b.prototype.truncateSync=function(a){if(this._dirty=!0,!this._flag.isWriteable())throw new i(j.EPERM,"File not opened with a writeable mode.");if(this._stat.mtime=new Date,a>this._buffer.length){var b=new k(a-this._buffer.length);return b.fill(0),this.writeSync(b,0,b.length,this._buffer.length),void(this._flag.isSynchronous()&&h.getRootFS().supportsSynch()&&this.syncSync())}this._stat.size=a;var c=new k(a);this._buffer.copy(c,0,0,a),this._buffer=c,this._flag.isSynchronous()&&h.getRootFS().supportsSynch()&&this.syncSync()},b.prototype.write=function(a,b,c,d,e){try{e(null,this.writeSync(a,b,c,d),a)}catch(f){e(f)}},b.prototype.writeSync=function(a,b,c,d){if(this._dirty=!0,null==d&&(d=this.getPos()),!this._flag.isWriteable())throw new i(j.EPERM,"File not opened with a writeable mode.");var e=d+c;if(e>this._stat.size&&(this._stat.size=e,e>this._buffer.length)){var f=new k(e);this._buffer.copy(f),this._buffer=f}var g=a.copy(this._buffer,d,b,b+c);return this._stat.mtime=new Date,this._flag.isSynchronous()?(this.syncSync(),g):(this.setPos(d+g),g)},b.prototype.read=function(a,b,c,d,e){try{e(null,this.readSync(a,b,c,d),a)}catch(f){e(f)}},b.prototype.readSync=function(a,b,c,d){if(!this._flag.isReadable())throw new i(j.EPERM,"File not opened with a readable mode.");null==d&&(d=this.getPos());var e=d+c;e>this._stat.size&&(c=this._stat.size-d);var f=this._buffer.copy(a,b,d,d+c);return this._stat.atime=new Date,this._pos=d+c,f},b.prototype.chmod=function(a,b){try{this.chmodSync(a),b()}catch(c){b(c)}},b.prototype.chmodSync=function(a){if(!this._fs.supportsProps())throw new i(j.ENOTSUP);this._dirty=!0,this._stat.chmod(a),this.syncSync()},b}(e.BaseFile);c.PreloadFile=l;var m=function(a){function b(b,c,d,e,f){a.call(this,b,c,d,e,f)}return d(b,a),b.prototype.sync=function(a){a()},b.prototype.syncSync=function(){},b.prototype.close=function(a){a()},b.prototype.closeSync=function(){},b}(l);c.NoSyncFile=m},{"../core/api_error":14,"../core/buffer":16,"../core/file":21,"../core/node_fs":26}],37:[function(a,b,c){function d(a){for(var b=IEBinaryToArray_ByteStr(a),c=IEBinaryToArray_ByteStr_Last(a),d=b.replace(/[\s\S]/g,function(a){var b=a.charCodeAt(0);return String.fromCharCode(255&b,b>>8)})+c,e=new Array(d.length),f=0;f<d.length;f++)e[f]=d.charCodeAt(f);return e}function e(a,b,c,e){switch(c){case"buffer":case"json":break;default:return e(new q(r.EINVAL,"Invalid download type: "+c))}var f=new XMLHttpRequest;f.open("GET",b,a),f.setRequestHeader("Accept-Charset","x-user-defined"),f.onreadystatechange=function(a){var b;if(4===f.readyState){if(200!==f.status)return e(new q(f.status,"XHR error."));switch(c){case"buffer":return b=d(f.responseBody),e(null,new s(b));case"json":return e(null,JSON.parse(f.responseText))}}},f.send()}function f(a,b,c){e(!0,a,b,c)}function g(a,b){var c;return e(!1,a,b,function(a,b){if(a)throw a;c=b}),c}function h(a,b,c){var d=new XMLHttpRequest;d.open("GET",a,!0);var e=!0;switch(b){case"buffer":d.responseType="arraybuffer";break;case"json":try{d.responseType="json",e="json"===d.responseType}catch(f){e=!1}break;default:return c(new q(r.EINVAL,"Invalid download type: "+b))}d.onreadystatechange=function(a){if(4===d.readyState){if(200!==d.status)return c(new q(d.status,"XHR error."));switch(b){case"buffer":return c(null,new s(d.response?d.response:0));case"json":return e?c(null,d.response):c(null,JSON.parse(d.responseText))}}},d.send()}function i(a,b){var c=new XMLHttpRequest;c.open("GET",a,!1);var d=null,e=null;if(c.overrideMimeType("text/plain; charset=x-user-defined"),c.onreadystatechange=function(a){if(4===c.readyState){if(200!==c.status)return void(e=new q(c.status,"XHR error."));switch(b){case"buffer":var f=c.responseText;d=new s(f.length);for(var g=0;g<f.length;g++)d.writeUInt8(f.charCodeAt(g),g);return;case"json":return void(d=JSON.parse(c.responseText))}}},c.send(),e)throw e;return d}function j(a,b){var c=new XMLHttpRequest;switch(c.open("GET",a,!1),b){case"buffer":c.responseType="arraybuffer";break;case"json":break;default:throw new q(r.EINVAL,"Invalid download type: "+b)}var d,e;if(c.onreadystatechange=function(a){if(4===c.readyState)if(200===c.status)switch(b){case"buffer":d=new s(c.response);break;case"json":d=JSON.parse(c.response)}else e=new q(c.status,"XHR error.")},c.send(),e)throw e;return d}function k(a,b,c){var d=new XMLHttpRequest;d.open("HEAD",b,a),d.onreadystatechange=function(a){if(4===d.readyState){if(200!=d.status)return c(new q(d.status,"XHR HEAD error."));try{return c(null,parseInt(d.getResponseHeader("Content-Length"),10))}catch(a){return c(new q(r.EIO,"XHR HEAD error: Could not read content-length."))}}},d.send()}function l(a){var b;return k(!1,a,function(a,c){if(a)throw a;b=c}),b}function m(a,b){k(!0,a,b)}var n=a("../core/util"),o=a("../core/buffer"),p=a("../core/api_error"),q=p.ApiError,r=p.ErrorCode,s=o.Buffer;c.asyncDownloadFile=n.isIE&&"undefined"==typeof Blob?f:h,c.syncDownloadFile=n.isIE&&"undefined"==typeof Blob?g:n.isIE&&"undefined"!=typeof Blob?j:i,c.getFileSizeSync=l,c.getFileSizeAsync=m},{"../core/api_error":14,"../core/buffer":16,"../core/util":31}],38:[function(a,b,c){var d=a("./core/global");if(Date.now||(Date.now=function(){return(new Date).getTime()}),Array.isArray||(Array.isArray=function(a){return"[object Array]"===Object.prototype.toString.call(a)}),Object.keys||(Object.keys=function(){"use strict";var a=Object.prototype.hasOwnProperty,b=!{toString:null}.propertyIsEnumerable("toString"),c=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],d=c.length;return function(e){if("object"!=typeof e&&("function"!=typeof e||null===e))throw new TypeError("Object.keys called on non-object");var f,g,h=[];for(f in e)a.call(e,f)&&h.push(f);if(b)for(g=0;d>g;g++)a.call(e,c[g])&&h.push(c[g]);return h}}()),"b"!=="ab".substr(-1)&&(String.prototype.substr=function(a){return function(b,c){return 0>b&&(b=this.length+b),a.call(this,b,c)}}(String.prototype.substr)),Array.prototype.forEach||(Array.prototype.forEach=function(a,b){for(var c=0;c<this.length;++c)c in this&&a.call(b,this[c],c,this)}),"undefined"==typeof setImmediate){var e=d,f=[],g="zero-timeout-message",h=function(){if("undefined"!=typeof e.importScripts||!e.postMessage)return!1;var a=!0,b=e.onmessage;return e.onmessage=function(){a=!1},e.postMessage("","*"),e.onmessage=b,a};if(h()){e.setImmediate=function(a){f.push(a),e.postMessage(g,"*")};var i=function(a){if(a.source===self&&a.data===g&&(a.stopPropagation?a.stopPropagation():a.cancelBubble=!0,f.length>0)){var b=f.shift();return b()}};e.addEventListener?e.addEventListener("message",i,!0):e.attachEvent("onmessage",i)}else if(e.MessageChannel){var j=new e.MessageChannel;j.port1.onmessage=function(a){return f.length>0?f.shift()():void 0},e.setImmediate=function(a){f.push(a),j.port2.postMessage("")}}else e.setImmediate=function(a){return setTimeout(a,0)}}Array.prototype.indexOf||(Array.prototype.indexOf=function(a,b){if(void 0===b&&(b=0),!this)throw new TypeError;var c=this.length;if(0===c||d>=c)return-1;var d=b;0>d&&(d=c+d);for(var e=d;c>e;e++)if(this[e]===a)return e;return-1}),Array.prototype.forEach||(Array.prototype.forEach=function(a,b){var c,d;for(c=0,d=this.length;d>c;++c)c in this&&a.call(b,this[c],c,this)}),Array.prototype.map||(Array.prototype.map=function(a,b){var c,d,e;if(null==this)throw new TypeError(" this is null or not defined");var f=Object(this),g=f.length>>>0;if("function"!=typeof a)throw new TypeError(a+" is not a function");for(b&&(c=b),d=new Array(g),e=0;g>e;){var h,i;e in f&&(h=f[e],i=a.call(c,h,e,f),d[e]=i),e++}return d}),"undefined"!=typeof document&&void 0===window.chrome&&document.write("<!-- IEBinaryToArray_ByteStr -->\r\n<script type='text/vbscript'>\r\nFunction IEBinaryToArray_ByteStr(Binary)\r\n IEBinaryToArray_ByteStr = CStr(Binary)\r\nEnd Function\r\nFunction IEBinaryToArray_ByteStr_Last(Binary)\r\n Dim lastIndex\r\n lastIndex = LenB(Binary)\r\n if lastIndex mod 2 Then\r\n IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n Else\r\n IEBinaryToArray_ByteStr_Last = \"\"\r\n End If\r\nEnd Function\r\n</script>\r\n"),a("./generic/emscripten_fs"),a("./backend/IndexedDB"),a("./backend/XmlHttpRequest"),a("./backend/async_mirror"),a("./backend/dropbox"),a("./backend/html5fs"),a("./backend/in_memory"),a("./backend/localStorage"),a("./backend/mountable_file_system"),a("./backend/overlay"),a("./backend/workerfs"),a("./backend/zipfs"),b.exports=a("./core/browserfs")},{"./backend/IndexedDB":3,"./backend/XmlHttpRequest":4,"./backend/async_mirror":5,"./backend/dropbox":6,"./backend/html5fs":7,"./backend/in_memory":8,"./backend/localStorage":9,"./backend/mountable_file_system":10,"./backend/overlay":11,"./backend/workerfs":12,"./backend/zipfs":13,"./core/browserfs":15,"./core/global":24,"./generic/emscripten_fs":32}]},{},[38])(38)});
//# sourceMappingURL=browserfs.min.js.map
var cesCollections = (function(config, _Compression, _Sync, _Tooltips, _PlayGameHandler, $wrapper, $title, _initialSyncPackage, _OnRemoveHandler) {
		
    //private members
    var _self = this;
    var _collections = [];
    var _active = {};
    var _BOXSIZE = 120;
    var _currentLoadingGame = null;

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date5
        _grid.isotope('updateSortData').isotope();

        _grid.isotope({
            sortBy: property,
            sortAscending: sortAscending,
        });
    };

    this.SetCurrentGameLoading = function(gameKey) {
        _currentLoadingGame = gameKey;
    };

    this.RemoveCurrentGameLoading = function() {
        _currentLoadingGame = null;
    };

    var OnImagesLoaded = function() {

        _grid.find('img').imagesLoaded().progress(function(imgLoad, image) {
            
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
            _Tooltips.AnyContent(true);
        });
    };

	/**
     * Assign actions to a gamelink and then append it to the grid but does NOT perform grid layout
     * @param {[type]}   key      [description]
     * @param {[type]}   system   [description]
     * @param {[type]}   title    [description]
     * @param {[type]}   file     [description]
     * @param {[type]}   played   [description]
     * @param {[type]}   slots    [description]
     * @param {Function} callback [description]
     */
	var AddToGrid = function(game, index) {

        var gameKey = _Compression.Decompress.gamekey(game.gk);

        //create the grid item
        var $griditem = $('<div class="grid-item" />');

        //if the box image fails to load, resync this grid to make room for the error images
        var onBoxImageLoadError = function(el) {
            _grid.isotope('layout');
        };

		var gamelink = new cesGameLink(config, gameKey, _BOXSIZE, true, _PlayGameHandler, onBoxImageLoadError);

        //create tooltip content
        var $tooltipContent = Tooltip(game, index);
        gamelink.UpdateToolTipContent($tooltipContent);

        //set the on remove function
        gamelink.OnRemoveClick(function() {
            //Remove(game.gk, gamelink, $griditem);
        });

        //place sorting data on grid item
        $griditem.attr('data-gk', game.gk);
        $griditem.attr('data-lastPlayed', new Date(game.lastPlayed).getTime()); //store as epoch time for sorting

        $griditem.append(gamelink.GetDOM()); //add gamelink
        
        _grid.isotope('insert', $griditem[0]);

        game.gameLink = gamelink;
        game.griditem = $griditem;
    };
    
    var Tooltip = function(game, index) {

        var gameKey = _Compression.Decompress.gamekey(game.gk);

        //create the tooltip content
        var $tooltipContent = $('<div class="collection-tooltip" id="collection' + index + '"></div>');
        $tooltipContent.append('<div>' + gameKey.title + '</div>');
        $tooltipContent.append('<div>Last Played: ' + $.format.date(game.lastPlayed, 'MMM D h:mm:ss a') + '</div>'); //using the jquery dateFormat plugin
        $tooltipContent.append('<div>Play Count: ' + game.playCount + '</div>');

        return $tooltipContent;
    };

    
    /**
     * @param  {String} gameKey
     * @param  {Object} gamelink
     * @param  {Object} griditem
     */
    var Remove = function(gk, gamelink, griditem) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (_currentLoadingGame && _currentLoadingGame.hasOwnProperty('gk') && gk == _currentLoadingGame.gk) {
            return;
        }

        //maybe set a loading spinner on image here?
        gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', griditem).isotope('layout');

        var url = '/collections/game?gk=' + encodeURIComponent(gk);

        _Sync.Delete(url, function(data) {
            //sync will take care of updating the collection
        });
    };

    //populate clears the grid from scratch
    this.Populate = function() {

        _grid.isotope('remove', _grid.children()); //clear grid

        for (var i = 0, len = _active.titles.length; i < len; ++i) {
            var game = _active.titles[i];
            
            //add to grid returns handle to griditem and gamelink
            AddToGrid(game, i);
        }

        _self.SortBy('lastPlayed', false);

        OnImagesLoaded();
    };

    //updates the grid with new titles (or deleted ones)
    this.Refresh = function() {

        var items = _grid.isotope('getItemElements');

        //step through all updated active titles
        for (var i = 0, len = _active.titles.length; i < len; ++i) {
            var game = _active.titles[i];

            var found = false;
            for (var j = 0, jlen = items.length; j < jlen; ++j) {

                var $griditem = $(items[j]);
                var gk = $griditem.data('gk');

                if (gk === game.gk) {
                    found = true;
                    
                    //update details
                    $griditem.attr('data-lastPlayed', new Date(game.lastPlayed).getTime()); //store date in epoch time for sorting

                    if (game.gameLink) {
                        var $tooltipContent = Tooltip(game, index);
                        game.gamelink.UpdateToolTipContent($tooltipContent);   
                    }
                    
                    break;
                }
            }
            if (!found) {
                AddToGrid(game, i);
            }
        }

        _self.SortBy('lastPlayed', false);
        
        OnImagesLoaded();
    };

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        var package = (function(active, collections) {
            this.active = active;
            this.collections = collections;
        });

        this.Incoming = function(package) {

            var isNewCollection = true; 
            if (_active.data) {
                isNewCollection = (_active.data.name != package.active.data.name);
            }

            _active = package.active;
            _collections = package.collections;

            if (isNewCollection) {
                _self.Populate();
            }
            else {
                _self.Refresh();
            }

            //title
            // if (_active.titles.length > 0) {
            //     $title.text(_active.data.name);
            // }
            // else {
            //     $title.empty();
            // }
        };

        //not used (yet). delete forces update on server
        this.Outgoing = function() {
            __self.reday = false;
            return new package(_active, _collections);
        };

        return this;
    })();

    /**
     * Constructors live at the bottom so that all private functions are available
     * @param  {} function(
     */
    var Constructor = (function() {
        
        _grid = $wrapper.isotope({
            layoutMode: 'masonry',
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).attr('data-lastPlayed');
                    return parseInt(played, 10);
                }
            }
        });

        _self.Sync.Incoming(_initialSyncPackage);

    })();

	return this;

});
var cesCompression = (function() {
	
	var _self = this;

	var GameKey = (function(system, title, file, gk) {
		this.system = system;
		this.title = title;
		this.file = file;
		this.gk = gk;			//the original compressed json of this key should it be needed again
	});

	//public methods

	this.Compress = {
	    /**
	     * compress and base64 encode a uint8array
	     * @param  {UInt8Array} uint8array
	     * @return {string}
	     */
	    bytearray: function(uint8array) {
	        var deflated = pako.deflate(uint8array, {to: 'string'});
	        return btoa(deflated);
	    },
	    /**
	     * comrpess and base64 encode a json object
	     * @param  {Object} json
	     * @return {string}
	     */
	    json: function(json) {
	        var string = JSON.stringify(json);
	        var deflate = pako.deflate(string, {to: 'string'});
	        var base64 = btoa(deflate);
	        return base64;
	    },
	    /**
	     * compress and base64 encode a string
	     * @param  {string} string
	     * @return {string}
	     */
	    string: function(string) {
	        var deflate = pako.deflate(string, {to: 'string'});
	        var base64 = btoa(deflate);
	        return base64;
	    },
	    /**
	     * a "gamekey" is an identifer on the server-end for system, title, file. we use it for a bunch of stuff from loading/saving states to loading games
	     */
	    gamekey: function(gameKey) {
	        //just a reminder not to call this. gameKey.gk is the answer
	    }
	};

	this.Decompress = {
	    /**
	     * decompress and base64 decode a string to uint8array
	     * @param  {string} item
	     * @return {UInt8Array}
	     */
	    bytearray: function(item) {
	        var decoded = new Uint8Array(atob(item).split('').map(function(c) {return c.charCodeAt(0);}));
	        return pako.inflate(decoded);
	    },
	    /**
	     * decompress and base64 decode a string to json
	     * @param  {string} item
	     * @return {Object}
	     */
	    json: function(item) {
	        var base64 = atob(item);
	        var inflate = pako.inflate(base64, {to: 'string'});
	        var json = JSON.parse(inflate);
	        return json;
	    },
	    /**
	     * decompress a string
	     * @param  {string} item
	     * @return {string}
	     */
	    string: function(item) {
	        var base64 = atob(item);
	        var inflate = pako.inflate(base64, {to: 'string'});
	        return inflate;
		},
		gamekey: function(gk) {
			var gameKey;
			try {
				gameKey = this.json(gk);
			} catch (e) {
				return;
			}
			//must be an array of length 3 [system, title, file]
			if (gameKey.length && gameKey.length === 3) {
				return new GameKey(gameKey[0], gameKey[1], gameKey[2], gk);
			}
			return;
		}
	};

	// public aliases

	this.Zip = this.Compress;
	this.Unzip = this.Decompress;

	this.In = this.Compress;
	this.Out = this.Decompress;

	return this;

});
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesDialogs = (function(wrapper, ui) {

    //private members
    var self = this;
    var dialogOperational = false;
    var currentOpenDialog = null;
    var maxHeight = 600;
    var defaultHeightChangeDuration = 600;
    var defaultHeightChangeEasing = 'easeInOutSine'; // see more http://easings.net/#
    var cssTransition = 200; //see css file for .dialog transition:

    var Constructor = function() {

        //to all the dialog, add close (for animating in and out)
        for (var dialog in ui) {
            $(ui[dialog]).addClass('dialog hide close').append();
        }
    }();

    //public members

    //public methods
    
    this.AddDialog = function(name, element) {
        $(element).addClass('close');
        ui[name] = element;
    };

    this.ShowDialog = function(name, height, callback) {

        height = parseInt(height || maxHeight, 10);

        if (dialogOperational) {
            if (callback) {
                callback();
            }
            return;
        }

        dialogOperational = true;

        //if currently open dialog
        this.CloseDialog(false, function() {

            currentOpenDialog = name;

            self.SetHeight(height, function() {

                $(ui[name]).removeClass('hide');
                setTimeout(function() {

                    $(ui[name]).removeClass('close');

                    dialogOperational = false;

                    if (callback) {
                        callback();
                    }

                }, cssTransition);
            });
        });
    };

    this.CloseDialog = function(alsoCloseWrapper, callback) {

        alsoCloseWrapper = alsoCloseWrapper || false;

        if (currentOpenDialog) {

            $(ui[currentOpenDialog]).addClass('close');

            setTimeout(function() {

                $(ui[currentOpenDialog]).addClass('hide');

                //if we also collapse the wrapper, do so
                if (alsoCloseWrapper) {
                    self.SetHeight(0, callback);
                } else {
                    
                    if (callback) {
                        callback();
                    }
                }

            }, cssTransition);
        } else {
            if (callback) {
                callback();
            }
        }
    };

    this.SetHeight = function(height, callback, duration, easing) {

        height = parseInt(height || maxHeight, 10);
        duration = duration || defaultHeightChangeDuration;

        //if the height is already in the set position, no need to animate, callback
        if ($(wrapper).height() == height) {
            if (callback) {
                callback();
            }
            return;
        }

        $(wrapper).animate({
            'height': height + 'px'
        }, duration, defaultHeightChangeEasing, callback);
    };

    return this;

});
/**
 * Emulator class. Holds all properties and functions for managing the instance of a loaded emaultor and game
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {GameKey} _gameKey    see ces.compression for class definitions. members: system, title, file, gk
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulatorBase = (function(_Compression, _PubSub, _config, _Sync, _gameKey, _ui, _ClientCache) {

    // private members
    var self = this;
    var _isLoading = false;
    var _isPaused = false; //flag for the screen overlay pause
    var _isEmulatorPaused = false; //flag for emulator pause (with user input)
    var _isMuted = false;
    var _isSavingState = false;
    var _isLoadingState = false;
    var _hasStateToLoad = false; //flag for whether it is possible to load state
    var _gameBeganPlaying = false;
    var _cacheEmulatorScripts = true; //do we want to use _ClientCache to store emulator script responses (in raw form before globalEval)
    var _cacheName = _gameKey.system + '.script';

    var _displayDurationShow = 1000;
    var _displayDurationHide = 500;
    var _timeToWaitForScreenshot = 2000; //hopefully never take more than 2 sec
    var _timeToWaitForSaveState = 30000; //hopefully never more than 30 sec

    //instances
    var _EmulatorInstance = null;
    var _Module = null;
    var _SavesManager = null;
    
    //protected instance
    this._InputHelper = null;

    //protected
    //this.loadedSaveData = null; //this is a space I use for indictaing a state file was written during load

    //wait for document as this is an external script
    $(document).ready(function() {

        self._InputHelper = new cesInputHelper(self, _ui);

    });

    // public methods
    
    /**
     * Calls the start function of the emulator script
     * @param {Function} callback the function to handle exceptions thrown by the emulator script
     */
    this.BeginGame = function(callback) {

        try {
            _Module.callMain(_Module.arguments);
        
        } catch (e) {
            if (callback) {
                return callback(e);
            }
        }

        //pub subs
        _PubSub.Subscribe('saveready', self, OnNewSaveSubscription);
    };

    /**
     * Load all components necssary for game to run
     * @param {Object} module   from the emulator extention, this custom made module is extended to the emulators "module"
     * @param {string} shader   a shader selection or pre-defined
     * @param {Object} deffered when complete
     */
    this.Load = function(module, _ProgressBar, filesize, shader, shaderFileSize, supportFileSize, deffered) {

        var emulatorLoadComplete = $.Deferred();
        var supportLoadComplete = $.Deferred();
        var gameLoadComplete = $.Deferred();
        var shaderLoadComplete = $.Deferred();

        _isLoading = true;

        //setup progress bar
        var emulatorFileSize = _config.systemdetails[_gameKey.system].emusize;
        _ProgressBar.AddBucket('game', filesize);
        _ProgressBar.AddBucket('shader', shaderFileSize); //will be 0 if no shader to load, not effecting the progress bar
        _ProgressBar.AddBucket('support', supportFileSize); //will be 0 if no support
        //only create the bucket for the emaultor script if not in cache
        if (!_cacheEmulatorScripts || !_ClientCache.hasOwnProperty(_cacheName)) {
            _ProgressBar.AddBucket('emulator', emulatorFileSize);
        }

        LoadEmulatorScript(_ProgressBar, _gameKey.system, module, emulatorFileSize, emulatorLoadComplete);
        
        $.when(emulatorLoadComplete).done(function(emulator) {

            LoadSupportFiles(_ProgressBar, _gameKey.system, supportFileSize, supportLoadComplete);
            LoadGame(_ProgressBar, filesize, gameLoadComplete);
            LoadShader(_ProgressBar, shader, shaderFileSize, shaderLoadComplete);

            $.when(supportLoadComplete, gameLoadComplete, shaderLoadComplete).done(function(support, game, shader) {

                _isLoading = false;

                OnAllLoadsComplete(emulator, support, game, shader);

                deffered.resolve(true);
            });
        });
    };

    this.WriteSaveData = function(timeStamp, callback) {

        //if null, we want to inform the loading process can continue with a load
        if (timeStamp) {

            _SavesManager.GetState(timeStamp, function(err, stateData) {
                if (err) {
                    callback(false);
                    return;
                }

                //determine state name
                var filenoextension = _gameKey.file.replace(new RegExp('\.[a-z0-9]{1,3}$', 'gi'), '');
                var statefilename = '/' + filenoextension + '.state';

                _Module.cesWriteFile('/states', statefilename, stateData, function() {

                    _hasStateToLoad = true;
                    callback(true); //true indicating there is a state to load now
                });
            });
        }
        else {
            callback(false); //false indicating there is not a save to load
            return;
        }
    };

    this.PauseGame = function() {
        if (_Module && !_isPaused) {
            
            self.GiveEmulatorControlOfInput(false);
            
            //if making a save during pause
            if (_isSavingState) {
                
                //mute these subscriptions
                _PubSub.Mute('screenshotWritten');
                _PubSub.Mute('stateWritten');
                
                //notification of save pause
                _PubSub.Publish('notification', ['Saving Paused', 1, true, false]);
            }

            //finally mute any notes
             _PubSub.Mute('notification');

            _Module.pauseMainLoop();
            _isPaused = true;
        }
    };

    this.ResumeGame = function() {
        if (_Module && _isPaused) {

            self.GiveEmulatorControlOfInput(true);
            _Module.resumeMainLoop();
            _isPaused = false;

            _PubSub.Unmute('notification');

            //if saving was in progress, unmute
            if (_isSavingState) {
                
                _PubSub.Unmute('screenshotWritten');
                _PubSub.Unmute('stateWritten');

                //again show saving note, 1 priority replaces "paused" doesnt matter if auto or not really
                _PubSub.Publish('notification', ['Saving Game Progress...', 1, true, true]); //1 priority intentional
            }
        }
    };

    this.Show = function (duration, callback) {

        duration = duration || _displayDurationShow;

        $(_ui.wrapper).fadeIn(_displayDurationShow, function() {

            self.GiveEmulatorControlOfInput(true);

            //attach operation handlers
            AttachOperationHandlers();

            _gameBeganPlaying = Date.now();

            if (callback) {
                callback();
            }
        });
    };

    this.Hide = function (duration, callback) {

        duration = duration || _displayDurationHide;

        self.GiveEmulatorControlOfInput(false);
        $(_ui.wrapper).fadeOut(_displayDurationHide, function() {
            
            if (callback) {
                callback();
            }
        });
    };

    this.CleanUp = function(callback) {

        //since each Module attached an event to the parent document, we need to clean those up too:
        $(document).unbind('fullscreenchange');
        $(document).unbind('mozfullscreenchange');
        $(document).unbind('webkitfullscreenchange');
        $(document).unbind('MSFullscreenChange');

        $(document).unbind('pointerlockchange');
        $(document).unbind('mozpointerlockchange');
        $(document).unbind('webkitpointerlockchange');
        $(document).unbind('mspointerlockchange');

        //important! tear down all topics subscribed in this class otherwise the handlers will remain and fire on the next instance of emulator
        _PubSub.Unsubscribe('saveready');
        _PubSub.Unsubscribe('screenshotWritten');
        _PubSub.Unsubscribe('stateWritten');

        if (_Module) {

            //also unbinds events from document and window
            self.GiveEmulatorControlOfInput(false);

            try {

                //calls exit on emulator ending loop (just to be safe)
                _Module.cesExit(); //see module class for implementation

            } catch (e) {

            }

            //we need to manually clear up the audio context
            if (_Module.RA && _Module.RA.context && _Module.RA.context.close) {
                 _Module.RA.context.close().then(function() {
                    //no need
                });
            }

            _Module = null;

            if (_EmulatorInstance) {
                _EmulatorInstance = null;
            }

            if (self._InputHelper) {
                self._InputHelper = null;
            }
            
            $(_ui.canvas).remove(); //kill all events attached (keyboard, focus, etc)
        }

        callback();
    };

    this.GiveEmulatorControlOfInput = function(giveEmulatorInput) {

        self._InputHelper.GiveEmulatorControlOfInput(giveEmulatorInput);

        //also set emulator-specific event handlers on and off (see custom module def)
        if (_Module) {
            _Module.GiveEmulatorControlOfInput(giveEmulatorInput);
        }
    };

    /**
     * this function is registered with the emulator when a file is written.
     * @param  {string} filename the file name being saved by the emulator
     * @param  {UInt8Array} contents the contents of the file saved by the emulator
     * @return {undef}
     */
    this.OnEmulatorFileWrite = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)
        var screenshotmatch = filename.match(/\.bmp$|\.png$/);

        // match will return an array when match was successful, our capture group with the slot value, its 1 index
        if (statematch) {

            _PubSub.Publish('stateWritten', [filename, contents]);
            return;
        }

        if (screenshotmatch) {

            //construct image into blob for use
            var screenDataUnzipped = new Uint8Array(contents);

            _PubSub.Publish('screenshotWritten', [filename, contents, screenDataUnzipped, _gameKey.system, _gameKey.title]);
            return;
        }

        if (filename === 'retroarch.cfg') {
            _PubSub.Publish('retroArchConfigWritten', [contents]);
            return;
        }
    };

    this.OnEmulatorFileRead = function(filename, contents) {

        var statematch = filename.match(/\.state(\d*)$/); //match .state or .statex where x is a digit (although hoping they dont use slots :P)

        if (statematch) {

            _PubSub.Publish('stateRead', [filename, contents]);
            OnStateLoaded();
            return;
        }
    };

    this.OnInputIdle = function() {

        //the keys are idle while the game runs! let's auto save
        MakeAutoSave();
    };

    /* exposed saves manager functionality */

    this.InitializeSavesManager = function(saveData, gameKey, callback) {

        _SavesManager = new cesSavesManager(_config, _Compression, _Sync, gameKey, saveData);
    };


    this.GetMostRecentSaves = function(count) { 

        return _SavesManager.GetMostRecentSaves(count);
    };

    this.MaximumSavesCheck = function() {

        return _SavesManager.MaximumSavesCheck();
    };

    //private methods

    var AttachOperationHandlers = function() {

        //save 

        self._InputHelper.RegisterKeydownOperationHandler('statesave', function(event, proceed, args) {

            if (_isSavingState || _isLoadingState) {
                proceed(false);
                return;
            }

            saveType = 'user';

            //the savetype can come in on args (auto)
            if (args && args.length && args[0]) {
                saveType = args[0];
            }

            CreateNewSave(saveType, proceed);
        });

        //screen

        self._InputHelper.RegisterKeydownOperationHandler('screenshot', function(event, proceed, args) {
            
            //dont show the screenshot note when making a save state=
            if (!_isSavingState) {
                _PubSub.Publish('notification', ['Saving Game Screenshot', 3, true, true, 'screenshotWritten']);
            }
            proceed(true);
        });

        //load

        self._InputHelper.RegisterKeydownOperationHandler('loadstate', function(event, proceed, args) {
            
            if (_isLoadingState || _isSavingState) {
                proceed(false);
                return;
            }

            //check if we've written a state file to load
            if (_hasStateToLoad) {
                _isLoadingState = true;
                _PubSub.Publish('notification', ['Loading Previous Saved Game Progress...', 3, true, true]);
                proceed(true);
            }
            else {
                _PubSub.Publish('notification', ['No Saved Game Progress to Load', 3, false, false]);
                proceed(false);
            }
        });

        //mute

        self._InputHelper.RegisterKeydownOperationHandler('mute', function(event, proceed, args) {
            _isMuted = !_isMuted;
            _PubSub.Publish('notification', [(_isMuted ? 'Game Audio Muted' : 'Game Audio Unmuted')]);
            proceed(true);
        });

        //pause

        self._InputHelper.RegisterKeydownOperationHandler('pause', function(event, proceed, args) {
            _isEmulatorPaused = !_isEmulatorPaused;
            if (_isEmulatorPaused) {
                self._InputHelper.CancelIdleTimeout();
                _PubSub.Publish('notification', ['Game Paused', 3, true, false, 'emulatorunpause']);
            }
            else {
                _PubSub.Publish('emulatorunpause');
            }
            proceed(true);
        });

        //reset

        self._InputHelper.RegisterKeydownOperationHandler('reset', function(event, proceed, args) {
            _PubSub.Publish('notification', ['Game Reset', 3, false, false]);
            proceed(true);
        });

        //condensing the simple keydown and keyup operations
        var DownUpHandlers = function(operation, message, topic) {

            self._InputHelper.RegisterKeydownOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Publish('notification', [message, 3, true, true, topic]);
                _PubSub.Mute('notification'); //since the user is holding a key, prevent this note from showing again while down
                proceed(true);
            });

            self._InputHelper.RegisterKeyupOperationHandler(operation, function(event, proceed, args) {
                _PubSub.Unmute('notification');
                _PubSub.Publish(topic);
                proceed(true);
            });
        };

        //reverse
        DownUpHandlers('reverse', 'Rewinding', 'emulatorreverse');

        //slow motion
        DownUpHandlers('slowmotion', 'Slow Motion Active', 'emulatorslowmotion');

        //fast forward
        DownUpHandlers('fastforward', 'Fast Forwarding', 'emulatorfastforward');
    };

    var OnStateLoaded = function() {
        
        //sanity check
        if (_isLoadingState) {
        
            _PubSub.Publish('notification', ['Load Complete', 1, false, false]);
        
            _isLoadingState = false;
        }
    };

    var MakeAutoSave = function() {

        if (self._InputHelper) {
            self._InputHelper.Keypress('statesave', null, ['auto']);
        }
    };

    var CreateNewSave = function(saveType, proceedCallback) {

        //bail if already working
        if (_isSavingState) {
            proceedCallback(false);
            return;
        }

        _isSavingState = true;

        //show the notification
        if (saveType === 'user') {
            _PubSub.Publish('notification', ['Saving Game Progress...', 3, true, true]);
        }
        else if (saveType === 'auto') {
            _PubSub.Publish('notification', ['Auto Saving Game Progress...', 3, true, true]);
        }

        //before state save, perform a screen capture
        var removeScreenshotSubscription = _PubSub.SubscribeOnce('screenshotWritten', self, function(filename, contents, screenDataUnzipped, system, title) {

            clearTimeout(screenshotTimeout);

            if (screenDataUnzipped) {

                //it can take a while too, sucks
                var removeStateSubscription = _PubSub.SubscribeOnce('stateWritten', self, function(filename, stateDataUnzipped) {

                    clearTimeout(saveStateTimeout);

                    //ok, to publish a new save is ready, we require screen and state data
                    if (stateDataUnzipped && screenDataUnzipped) {

                        //will also close the notification
                        _PubSub.Publish('saveready', [saveType, screenDataUnzipped, stateDataUnzipped]);
                    }

                    _isSavingState = false;
                    _hasStateToLoad = true;

                }, true); //SubscribeOnce exclusive flag

                //just like with screenshots, create a timer to remove the subscription in case we never hear back
                var saveStateTimeout = setTimeout(function() {

                    removeStateSubscription();
                    _isSavingState = false;

                }, _timeToWaitForSaveState);

                
                proceedCallback(true); //allow original function to exe now that we have prepared our filesystem

            } else {

                proceedCallback(false);
            }
        }, true); //sub once, exclusive flag

        //if I never hear back about a new screenshot, then remove this sub
        var screenshotTimeout = setTimeout(function() {
            
            removeScreenshotSubscription();
            _isSavingState = false;

        }, _timeToWaitForScreenshot);

        //press key to begin screenshot capture
        self._InputHelper.Keypress('screenshot');

    };

    var OnNewSaveSubscription = function(saveType, screenDataUnzipped, stateDataUnzipped) {

        _SavesManager.AddSave(saveType, screenDataUnzipped, stateDataUnzipped, function() {

            _PubSub.Publish('notification', ['Save Complete', 1, false, false]);
        });
    };

    /**
     * A helper function to separate the post-response functionality from the LoadEmulator function
     * @param {Array} emulator
     * @param {Array} support
     * @param {Array} game
     * @param {Array} shader
     */
    var OnAllLoadsComplete = function(emulator, support, game, shader) {

        //LoadEmulator result
        if (emulator[0]) {
            console.error(emulator[0]);
            return;
        }
        _Module = emulator[1];
        _EmulatorInstance = emulator[2];

        //LoadSupportFiles result
        var compressedSupprtData = (support && support[1]) ? support[1] : null; //if not defined, no emulator support

        //LoadGame result
        var gameLoadError = game[0];
        var compressedGameData = game[1]; //compressed game data

        //Load Shader result
        //shader data is compressed from server, unpack later
        var compressedShaderData = (shader && shader[1]) ? shader[1] : null; //if not defined, not shader used

        _Module.BuildLocalFileSystem(compressedGameData, compressedSupprtData, compressedShaderData);
    };

    /**
     * ajax call to load layout and script of emulator and load it within frame, resolves deffered when loaded
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadEmulatorScript = function(_ProgressBar, system, module, filesize, deffered) {

        //the path is made of three sections, 1) cdn or local 2) the extention name is the folder where they are stored 3) the file itself
        var scriptPath = _config.emupath + '/' + _config.systemdetails[system].emuextention + '/' + _config.systemdetails[system].emuscript;

        var returnHelper = function(script) {

            //evaluate the response text and place it in the global scope
            $.globalEval(script); 
            var emulatorScriptInstance = new cesRetroArchEmulator(module);
            
            console.log('emulator done');

            //this timeout is mega important, it gives the previous steps (globalEval, instantiation) enough time
            //to sort themselves out. without this timeout, I get errors 
            setTimeout(function() {
                deffered.resolve([null, module, emulatorScriptInstance]);
            }, 2000);
        };

        //first check local cache
        if (_cacheEmulatorScripts && _ClientCache.hasOwnProperty(_cacheName)) {
            returnHelper(_ClientCache[_cacheName]);
            return;
        }

        LoadResource(scriptPath,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('emulator', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                
                _ProgressBar.Update('emulator', filesize);
                
                if (_cacheEmulatorScripts) {
                    _ClientCache[_cacheName] = response;
                }

                returnHelper(response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Emulator Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * Emulator support is any additional resources required by the emulator needed for play
     * This isnt included in the LoadEmulator call because sometimes support files are needed for an emulator
     * which can play 1several systems (Sega CD, support needed, Genesis, no support)
     * @param  {string} system
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadSupportFiles = function(_ProgressBar, system, supportFileSize, deffered) {

        //rely entirely on the filesize from the config to inform us if we are to seek support files
        if (supportFileSize === 0) {
            //system not handled, bail
            deffered.resolve();
            return;
        }

        //support location also includes a folder which must match the emulator version
        var location = _config.emusupportfilespath + '/' + _config.systemdetails[system].emuextention + '/' + system;

        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('support', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Support Files Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Support Files Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load rom file from whatever is defined in the config "rompath" (CDN/crossdomain or local). will come in as compressed string. after unpacked will resolve deffered. loads concurrently with emulator
     * @param  {string} system
     * @param  {string} _gameKey.title
     * @param  {string} file
     * @param  {Object} deffered
     * @return {undef}
     */
    var LoadGame = function(_ProgressBar, filesize, deffered) {
        
        var filename = _Compression.Zip.string(_gameKey.title + _gameKey.file);
        var location = _config.rompath + '/' + _gameKey.system + '/' + _config.systemdetails[_gameKey.system].romcdnversion + '/';

        //encode twice: once for the trip, the second because the files are saved that way on the CDN
        location += encodeURIComponent(encodeURIComponent(filename));

        //converted from jsonp to straight up json. Seems to work. Going this route allows me to add
        //an event listener to progress for a download progress bar
        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('game', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                _ProgressBar.Update('game', filesize);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Game Parse Error:', e]);
                    return;
                }

                console.log('game done');
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Game Retrieval Error:', jqXHR.status]);
            }
        );
    };

    /**
     * load a shader from whatever the assetpath is
     * @param  {string} name
     * @param  {Object} deffered
     * @return {undefined}
     */
    var LoadShader = function(_ProgressBar, name, shaderFileSize, deffered) {

        //if no shader selected or unknown filesize (shouls always be in the config), bail
        if (name === "" || shaderFileSize === 0) {
            deffered.resolve();
            return;
        }

        var location = _config.shaderpath + '/' + name;

        LoadResource(location,
            //onProgress Update
            function(loaded) {
                _ProgressBar.Update('shader', loaded);
            },
            //onSuccess
            function(response, status, jqXHR) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    _PubSub.Publish('error', ['Shader Parse Error:', e]);
                    return;
                }
                deffered.resolve(null, response);
            },
            //onFailure
            function(jqXHR, status, error) {
                _PubSub.Publish('error', ['Shader Retrieval Error:', jqXHR.status]);
            }
        );
    };
    
    //a common function for retirving anything dynamically
    var LoadResource = function(location, onProgressUpdate, onSuccess, onFailure) {

        $.ajax({
            url: location,
            type: 'GET',
            crossDomain: true,
            dataType: 'text',
            cache: false,
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded);
                    }
                }, false);

                xhr.addEventListener('progress', function(event) {
                    if (event.loaded) {
                        onProgressUpdate(event.loaded);
                    }
                }, false);

                return xhr;
            },
            success: onSuccess,
            error: onFailure
        });
    };

    return this;
});

/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesEmulatorMessages = (function() {

    //private members
    var self = this;



    return this;

});
var cesGameLink = (function(config, gameKey, size, includeRemove, opt_PlayGame, opt_onImageLoadError) {

    //private members
    var self = this;
    var _gamelink;
    var _imagewrapper;
    var _image;
    var _remove;
    var _onRemove = null;

    //public members

    this.GetDOM = function() {
        return _gamelink;
    };

    this.OnRemoveClick = function(operation) {
        _onRemove = operation;
    };
    
    this.DisableAllEvents = function() {

        $(_gamelink).find('*').off();
    };

    this.UpdateToolTipContent = function($tooltipContent) {
        
        //remove items which set this up as a standard tooltip
        $(_imagewrapper).removeAttr('title');
        $(_imagewrapper).removeClass('tooltip');
        $(_imagewrapper).removeClass('tooltipstered');
        $(_imagewrapper).addClass('tooltip-content');

        //remove existing
        $(_gamelink).find('.tooltip-content-wrapper').remove();

        //write new id to content
        $(_imagewrapper).attr('data-tooltip-content', '#' + $tooltipContent.attr('id'));
        
        //create wrapper and fill with content
        $tooltipContentWrapper = $('<div class="tooltip-content-wrapper"></div>');
        $tooltipContentWrapper.append($tooltipContent);
        $(_gamelink).append($tooltipContentWrapper);

        //cannot apply tooltips here because in loop
    };

    var Constructor = (function() {

        includeRemove = includeRemove || false;

        var $div = $('<div class="gamelink"></div>');
        var $box = cesGetBoxFront(config, gameKey.system, gameKey.title, size, opt_onImageLoadError);

        //show box art when finished loading
        $box.load(function() {
            $(this)
            .removeClass('close')
            .on('mousedown', function() {
                preventGamePause = true; //prevent current game from pausng before fadeout
            })
            .on('mouseup', function() {

                if (opt_PlayGame) {
                    opt_PlayGame(gameKey);
                }
            });
        });

        var $imagewrapper = $('<div class="box zoom close"></div>');
        
        $imagewrapper.addClass('tooltip close');
        $imagewrapper.attr('title', gameKey.title);

        $imagewrapper.append($box);

        //also when box load fails, in addition to showing the blank cartridge, let's create a fake label for it
        $box.error(function(e) {
            $(this).parent().append('<div class="boxlabel boxlabel-' + gameKey.system + '"><p>' + gameKey.title + '</p></div>');
        });

        $div.append($imagewrapper);

        var $remove = null;

        //if including a remove button
        // if (includeRemove) {
        //     $remove = $('<div class="remove tooltip" title="Remove this game and all saved progress"></div>');
            
        //     //attach event 
        //     $remove.on('click', function() {
        //         if (_onRemove) {
        //             _onRemove();
        //         }
        //     });

        //     $imagewrapper.append($remove)
            
        //     //show remove on mouse over
        //     $imagewrapper
        //         .on('mouseover', function() {
        //             $remove.show();
        //         })
        //         .on('mouseout', function() {
        //             $remove.hide();
        //         });
        // }

        _gamelink = $div;
        _imagewrapper = $imagewrapper;
        _image = $box;
        _remove = $remove;
    })();

    return this;

});


var cesInputHelper = (function(_Emulator, _ui) {

    //private members
    var self = this;
    var _keypresslocked = false; //if we are simulating a keypress (down and up) this boolean prevents another keypress until the current one is complete
    
    var _originalEmulatorKeydownHandlerFunctions = {}; //the separated original work functions attached to the keydown handlers
    var _modifiedEmulatorKeydownHandlers = {};
    
    var _originalEmulatorKeyupHandlerFunctions = {}; //the separated original work functions attached to the keyup handlers
    var _modifiedEmulatorKeyupHandlers = {};

    var _keydownOperationHandlers = {}; // { keycode: function}
    var _keyupOperationHandlers = {};

    //auto save
    var _idleKeyTimeout = null;
    var _idleKeyDuration = 10000; //the amount of time to required to be idle to fire the OnIdleKeys functionality when checked
    var _lastInputKeyCode = null;
    var _disableAutoSave = false;

    var _operationMap = {
        'statesave': 49,        //1
        'loadstate': 52,        //4
        'mute': 77,             //m
        'screenshot': 84,       //t
        'pause': 80,            //p
        'reverse': 82,          //r
        'slowmotion': 69,       //e
        'fastforward': 32,      //space
        'reset': 72             //h
    };

    var _keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent = {
        9: "tab",
        13: "enter",
        16: "shift",
        18: "alt",
        27: "esc",
        33: "rePag",
        34: "avPag",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12"
    };

    /*
    from retroarchfig:
    #   left, right, up, down, enter, kp_enter, tab, insert, del, end, home,
    #   rshift, shift, ctrl, alt, space, escape, add, subtract, kp_plus, kp_minus,
    #   f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12,
    #   num0, num1, num2, num3, num4, num5, num6, num7, num8, num9, pageup, pagedown,
    #   keypad0, keypad1, keypad2, keypad3, keypad4, keypad5, keypad6, keypad7, keypad8, keypad9,
    #   period, capslock, numlock, backspace, multiply, divide, print_screen, scroll_lock,
    #   tilde, backquote, pause, quote, comma, minus, slash, semicolon, equals, leftbracket,
    #   backslash, rightbracket, kp_period, kp_equals, rctrl, ralt
     */

    this.OverrideEmulatorKeydownHandler = function(eventHandler) {
        
        if (!eventHandler.hasOwnProperty('target')) {
            return eventHandler;
        }

        var target = eventHandler.target;

        //if already intercepted, return modified handler
        if (target in _modifiedEmulatorKeydownHandlers) {
            return _modifiedEmulatorKeydownHandlers[target];
        }

        _originalEmulatorKeydownHandlerFunctions[target] = eventHandler.handlerFunc;
                    
        eventHandler.handlerFunc = function(event, args) {

            //sometimes I want to influence behaviors of keystokes before the emulator
            OnBeforeEmulatorKeydown(event, function(proceed) {

                //perform original handler function
                if (proceed) {
                    _originalEmulatorKeydownHandlerFunctions[target](event);
                }
            }, args);
        };

        _modifiedEmulatorKeydownHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.DisableAutoSave = function(disable) {

        self.CancelIdleTimeout();
        _disableAutoSave = disable;
    };

    this.SetIdleTimeoutDuration = function(duration) {
        _idleKeyDuration = duration;
    };

    this.CancelIdleTimeout = function() {

        if (_idleKeyTimeout) {
            clearTimeout(_idleKeyTimeout);
        }
    };

    this.OverrideEmulatorKeyupHandler = function(eventHandler) {

        if (!eventHandler.hasOwnProperty('target')) {
            return eventHandler;
        }

        var target = eventHandler.target;

        //if already intercepted, return handler
        if (target in _modifiedEmulatorKeyupHandlers) {
            return _modifiedEmulatorKeyupHandlers[target];
        }

        _originalEmulatorKeyupHandlerFunctions[target] = eventHandler.handlerFunc;

        eventHandler.handlerFunc = function(event, args) {

            //sometimes I want to influence behaviors of keyups before the emulator
            OnBeforeEmulatorKeyup(event, function(proceed) {

                //perform original handler function
                if (proceed) {
                    _originalEmulatorKeyupHandlerFunctions[target](event);
                }
            }, args);
        };

        //although no modifications to the handler were performed
        _modifiedEmulatorKeyupHandlers[target] = eventHandler;

        return eventHandler;
    };

    this.RegisterKeydownOperationHandler = function(operation, handler) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var keycode = _operationMap[operation];
        _keydownOperationHandlers[keycode] = handler;
    };

    this.RegisterKeyupOperationHandler = function(operation, handler) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }

        var keycode = _operationMap[operation];
        _keyupOperationHandlers[keycode] = handler;
    };

    this.UnregisterKeydownHandler = function(operation) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }
        var keycode = _operationMap[operation];
        delete _keydownOperationHandlers[keycode];
    };

    this.UnregisterKeyupHandler = function(operation) {

        if (!_operationMap.hasOwnProperty(operation)) {
            return;
        }
        var keycode = _operationMap[operation];
        delete _keyupOperationHandlers[keycode];
    };

    this.Keypress = function(operation, callback, args) {

        if (!_operationMap.hasOwnProperty(operation) || _keypresslocked || $.isEmptyObject(_originalEmulatorKeydownHandlerFunctions)) {
            return;
        }
        var keycode = _operationMap[operation];
        SimulateEmulatorKeypress(keycode, callback, args);
    };

    this.GiveEmulatorControlOfInput = function(giveInput) {

        if (giveInput) {

            //common listener definition
            var keyboardListener = function (e) {
                if (_keysWhichHaveFunctionalityInTheBrowserWeWantToPrevent[e.which]) {
                    e.preventDefault();
                }
            }
            $(window).on('keydown', keyboardListener); //using jQuerys on and off here worked :P

        } else {
            
            self.CancelIdleTimeout(); //in case its running
            $(window).off('keydown');
        }
    }

    /**
     * This is the function we override the emulator handler with. Its resulting callback will pass a boolean to indictae if the original functionality should proceed
     * to the emulator.
     * @param {Object} event                        Event object
     * @param {Function} proceedToEmulatorCallback  The callback function which with the boolean passed with it, determines if the emulator should handle the input
     * @param {Array} args                          This parameter is sourced from the Keypress function. If we simulate a keypress, we can pass args here that will show up in the handler for this operation.
     */
    var OnBeforeEmulatorKeydown = function(event, proceedToEmulatorCallback, args) {

        var keycode = event.keyCode;

        if (keycode in _keydownOperationHandlers) {
            _keydownOperationHandlers[keycode](event, function(result) {
                
                //a true result will allow the input to each the emulator, false stops it here
                proceedToEmulatorCallback(result);

                //if true, we want to record the input as happened
                if (result) {
                    _lastInputKeyCode = keycode;
                    ResetIdleTimeout();
                }

            }, args);
        }
        //no operation handlers, normal keydown
        else {

            proceedToEmulatorCallback(true);

            _lastInputKeyCode = keycode;
            ResetIdleTimeout();
        }
    }

    var ResetIdleTimeout = function() {

        //bail early is disabled
        if (_disableAutoSave) {
            return;
        }

        self.CancelIdleTimeout(); //clear the current

        _idleKeyTimeout = setTimeout(function() {

            //catch if an operational input was last used
            var operationalKeyUsed = false;
            for (operation in _operationMap) {
                if (_lastInputKeyCode == _operationMap[operation]) {
                    operationalKeyUsed = true;
                    break;
                }
            }

            if (!operationalKeyUsed) {
                _Emulator.OnInputIdle();
            }

        }, _idleKeyDuration);
    };

    var OnBeforeEmulatorKeyup = function(event, proceedToEmulatorCallback, args) {

        var keycode = event.keyCode;

        if (keycode in _keyupOperationHandlers) {
            _keyupOperationHandlers[keycode](event, function(result) {
                
                //a true result will allow the input to each the emulator, false stops it here
                proceedToEmulatorCallback(result);
            }, args);
        }
        //no operation handlers, normal keyup
        else {
            proceedToEmulatorCallback(true);
        }
    };

    /**
     * Given a keycode, simulate a keypress by generating a keydown and keyup event and pass them through the handlers destined for the emulator (but first pass through here ;)
     * @param {int}   keycode
     * @param {Function} callback   After keyup fires
     * @param {int}   keyUpDelay    Define this for long holds, otherwise leave it and allow the default of 10
     */
    var SimulateEmulatorKeypress = function(keycode, callback, args, keyUpDelay) {

        //we need to have keydown and up handlers cached to simulate keypresses
        if ($.isEmptyObject(_modifiedEmulatorKeydownHandlers) || $.isEmptyObject(_modifiedEmulatorKeyupHandlers)) {
            callback();
            return;
        }

        var keyUpDelay = keyUpDelay || 10;

        
        var keydownHandler = _modifiedEmulatorKeydownHandlers[Object.keys(_modifiedEmulatorKeydownHandlers)[0]].handlerFunc; //take first handler, doesn't matter which really, its likely attached to window
        var keyupHandler = _modifiedEmulatorKeyupHandlers[Object.keys(_modifiedEmulatorKeyupHandlers)[0]].handlerFunc; //take first handler, doesn't matter which really
        
        var keydown = GenerateEvent(keycode, 'keydown');
        var keyup = GenerateEvent(keycode, 'keyup');

        setTimeout(function() {
            keyupHandler(keyup, args); //send the keyup event
            
            if (callback) {
                callback();
            }
        }, keyUpDelay);
        keydownHandler(keydown, args); //send the keydown event
    };

    var GenerateEvent = function(keyCode, eventType) {

        var oEvent = document.createEvent('KeyboardEvent');

        // Chromium Hack
        Object.defineProperty(oEvent, 'keyCode', {
            get : function() {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get : function() {
                return this.keyCodeVal;
            }
        });

        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, keyCode);
        } else {
            oEvent.initKeyEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, 0);
        }

        oEvent.keyCodeVal = keyCode;

        if (oEvent.keyCode !== keyCode) {
            //alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
        }

        return oEvent;
    }

    //public members
    return this;
});
var cesMain = (function() {

    // private members
    var self = this;
    var _config = {}; //the necessary server configuration data provided to the client
    var _tips = [
        'Back out of that mistake you made by holding the R key to rewind the game',
        'Press the Space key to fast forward through those story scenes',
        'If your browser supports it, you can go fullscreen by pressing the F key',
        //'You can save your progress (or state) by pressing the 1 key, return to it anytime with the 4 key',
        'We\'ll store all of your saves as long as you return within two weeks',
        'Pause your game with the P key',
        'Select a system from the dropdown to generate a new list of suggested games',
        'To search for more obsurace or forgeign titles, select a system from the dropdown first',
        'Take a screenshot with the T key. Missed that moment? Rewind with R and capture again!',
        'Screenshots are deleted when you leave or refresh the page. Download your favorites to keep them'
    ];
    var _bar = null;
    var _tipsCycleRate = 3000;
    var _preventLoadingGame = false;
    var _preventGamePause = false; //condition for blur event of emulator, sometimes we don't want it to pause when we're giving it back focus
    var _minimumGameLoadingTime = 6000; //have to consider tips (make longer) and transition times
    var _minimumSaveLoadingTime = 3000; //have to consider tips (make longer) and transition times
    var _defaultSuggestions = 60;
    var _suggestionsLoading = false;

    // instances/libraries
    var _Sync = null;
    var _Compression = null;
    var _PubSub = null;
    var _Preferences = null;
    var _Sliders = null;
    var _SavesManager = null;
    var _Emulator = null;
    var _Dialogs = null;
    var _Collections = null;
    var _Suggestions = null;
    var _SaveSelection = null;
    var _ProgressBar = null;
    var _Notifications = null;
    var _Tooltips= null;
    var _ClientCache = {}; //a consistant location to store items in client memory during a non-refresh session

    // public members
    
    this._macroToShaderMenu = [[112, 100], 40, 40, 40, 88, 88, 40, 40, 40, 37, 37, 37, 38, 88, 88, 90, 90, 38, 38, 38, 112]; //macro opens shader menu and clears all passes
    
    $(document).ready(function() {

        //load libraries
        
        _Compression = new cesCompression();

        _PubSub = new cesPubSub();
        
        //ui handles for the dialog class (add as needed, we want to only referece jquery in main if possible)
        _Dialogs = new cesDialogs($('#dialogs'), {
            'welcomefirst': $('#welcomemessage'),
            'welcomeback': $('#welcomeback'),
            'shaderselector': $('#systemshaderseletor'),
            'savedgameselector': $('#savedgameselector'),
            'gameloading': $('#gameloading'),
            'emulatorexception': $('#emulatorexception'),
            'saveloading': $('#saveloading'),
            'emulatorcleanup': $('#emulatorcleanup')
        });

        _Tooltips = new cesTooltips(_config, '.tooltip', '.tooltip-content');

        _ProgressBar = new cesProgressBar(loadingprogressbar);

        _Notifications = new cesNotifications(_config, _Compression, _PubSub, $('#notificationwrapper'));

        //unpack client data
        var clientdata = _Compression.Out.json(c20); //this name is only used for obfiscation

        _config = clientdata.config;

        _Sync = new cesSync(_config, _Compression);

        //auto capture trigger. comment out to avoid build
        //self._autoCaptureHarness('n64', _config.autocapture['n64'].shaders, 7000, 1, 10000);

        _Preferences = new cesPreferences(_Compression, clientdata.components.p);
        _Sync.RegisterComponent('p', _Preferences.Sync);

        _Collections = new cesCollections(_config, _Compression, _Sync, _Tooltips, PlayGame, $('#openCollectionGrid'), $('#collectionTitle'), clientdata.components.c, null);
        _Sync.RegisterComponent('c', _Collections.Sync);

        //show welcome dialog
        if ($.isEmptyObject(_Preferences.playHistory)) { //TODO fix this
            _Dialogs.ShowDialog('welcomefirst', 200);
        } else {
            _Dialogs.ShowDialog('welcomeback', 200);
        }

        //build console select for search (had to create a structure to sort by the short name :P)
        var shortnames = [];
        for (var system in _config.systemdetails) {
            _config.systemdetails[system].id = system;
            shortnames.push(_config.systemdetails[system]);
        }
        shortnames.sort(function(a, b) {
            if (a.shortname > b.shortname) {
                return 1;
            }
            if (a.shortname < b.shortname) {
                return -1;
            }
            return 0;
        });
        var shortnamesl = shortnames.length;
        for (var i = 0; i < shortnamesl; i++) {
            $('#search select').append('<option value="' + shortnames[i].id + '">' + shortnames[i].shortname + '</option>');
        }

        //loading dial
        $('.dial').knob();

        //console select
        $('#search select').selectOrDie({
            customID: 'selectordie',
            customClass: 'tooltip',
            /**
             * when system filter is changed
             * @return {undef}
             */
            onChange: function() {
                var system = $(this).val();

                if (system === 'all' || _config.systemdetails[system].cannedSuggestion) {
                    _Suggestions.Load(system, true, function() {
                        _Tooltips.Any();
                    }, true); //<-- load canned results
                }
                //default suggestions receipe for systems
                else {

                    var recipe = {
                        systems: {},
                        count: 100
                    };
                    recipe.systems[system] = {
                        proportion: 100,
                        set: (system === 'all') ? 0 : 1
                    };

                    _Suggestions.Load(recipe, true, function() {
                        _Tooltips.Any();
                    });
                }

                 //show or hide the alpha bar in the suggestions panel
                if (system === 'all') {
                    $('#alphabar').hide();
                } else {
                    $('#alphabar').show();
                }
            }
        });

        //search field
        $('#search input').autoComplete({
            minChars: 3,
            cache: false,
            delay: 300,
            /**
             * trigger the run to the server with search term
             * @param  {string} term
             * @param  {Object} response
             * @return {undef}
             */
            source: function(term, response) {
                var system = $('#search select').val();
                $.getJSON('/search/' + system + '/' + term, function(data) {
                    response(_Compression.Out.json(data));
                });
            },
            /**
             * for each auto compelete suggestion, render output here
             * @param  {Array} item
             * @param  {string} search
             * @return {string}        html output
             */
            renderItem: function(item, search) {

                var gameKey = _Compression.Decompress.gamekey(item[0]);
                var $suggestion = $('<div class="autocomplete-suggestion" data-gk="' + gameKey.gk + '" data-searchscore="' + item[1] + '"></div>');
                $suggestion.append(cesGetBoxFront(_config, gameKey.system, gameKey.title, 50));
                $suggestion.append('<div>' + gameKey.title + '</div>');
                return $('<div/>').append($suggestion).html(); //because .html only returns inner content
            },
            /**
             * on autocomplete select
             * @param  {Object} e    event
             * @param  {string} term search term used
             * @param  {Object} item dom element, with data
             * @return {undef}
             */
            onSelect: function(e, term, item) {
                var gameKey = _Compression.Decompress.gamekey(item.data('gk'));
                PlayGame(gameKey);
            }
        });

        //clicking on paused game overlay
        $('#emulatorwrapperoverlay')
            .on('click', function() {
                $('#emulator').focus();
            })
            .hover(
                function(event) {
                    event.stopPropagation();
                },
                function(event) {
                    event.stopPropagation();
                });

        //when user has scrolled to bottom of page, load more suggestions
        $(window).scroll(function() {
            if ($(window).scrollTop) {
                
                var x = $(window).scrollTop() + $(window).height();
                var y = $(document).height(); //- 100; //if you want "near bottom", sub from this amount

                if (x == y) {
                    if (_suggestionsLoading) {
                        return;
                    }
                    _suggestionsLoading = true;

                    _Suggestions.LoadMore(function() {
                        _suggestionsLoading = false;
                        _Tooltips.Any();
                    });
                }
            }
        });

        //for browsing with alpha characters
        $('#suggestionswrapper a').each(function(index, item) {
            $(item).on('click', function(e) {
                var system = $('#search select').val();
                var term = $(item).text();
                _Suggestions.Load('/suggest/browse/' + system + '?term=' + term, false, function() {
                    _Tooltips.Any();
                });
            });
        });

        //stuff to do when at work mode is enabled
        //$('#titlebanner').hide();

        _Sliders = new cesSliders();

        _Suggestions = new cesSuggestions(_config, _Compression, PlayGame, $('#suggestionsgrid'));

        //begin by showing all console suggestions
        _Suggestions.Load('all', true, function() {
            _Tooltips.Any();
        }, true); //<-- canned

        //pubsub for any error
        _PubSub.Subscribe('error', self, function(message, error) {
            ShowErrorDialog(message, error);
        });

        //pubsub for notifications
        _PubSub.Subscribe('notification', self, function(message, priority, hold, icon, topic) {
            _Notifications.Enqueue(message, priority, hold, icon, topic);
        });

        //incoming params to open game now?
        // var openonload = _Preferences.Get('openonload') || {};
        // if ('system' in openonload && 'title' in openonload && 'file' in openonload) {
        //     PlayGame(openonload.system, openonload.title, openonload.file);
        // }
    });

    /* public methods */

    /* private methods */

    var CleanUpEmulator = function(callback) {

        if (_Emulator) {

            //hide emulator, input is taken away
            _Emulator.Hide(null, function() {   

                //close game context, no callbacks needed
                HideGameContext();

                //clean up attempts to remove all events, frees memory (yeah I wish)
                _Emulator.CleanUp(function() {

                    _Emulator = null;

                    if (callback) {
                        callback();
                    }
                });
                
            });
        } 
        //no emulator, just callback
        else {
            if (callback) {
                callback();
            }
        }   
    };

    /**
     * Prepare layout etc. for running a game! cleans up current too
     * @param  {GameKey} gameKey    required. see ces.compression for definition. members: system, title, file, gk
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var PlayGame = function (gameKey, slot, shader, callback) {

        //bail if attempted to load before current has finished
        if (_preventLoadingGame) {
            return;
        }

        _preventLoadingGame = true; //prevent loading any other games until this flag is lifted
        _preventGamePause = false;

        window.scrollTo(0, 0); //will bring scroll to top of page (if case they clicked a suggestion, no need to scroll back up)

        //will clear up existing emulator if it exists
        CleanUpEmulator(function() {
            
            $('#emulatorcanvas').empty(); //ensure empty (there can be a canvas here if the user bailed during load)

            //close any dialogs
            _Dialogs.CloseDialog(null, function() {

                //close any sliders
                //_Sliders.Closeall();

                //close any notifications
                _Notifications.Reset();

                //create new canvas (canvas must exist before call to get emulator (expects to find it right away))
                $('#emulatorcanvas').append('<canvas tabindex="0" id="emulator" oncontextmenu="event.preventDefault()"></canvas>');

                //call bootstrap
                RetroArchBootstrap(gameKey, slot, shader, function() {

                    _preventLoadingGame = false;

                    if(callback) {
                        callback();
                    }
                });
            });
        });
    };

    /**
     * bootstrap function for loading a game with retroarch. setups animations, loading screens, and iframe for emulator. also destoryes currently running
     * @param  {GameKey} gameKey    required. see compression for class definition. Has members system, title, file, gk
     * @param  {number} state       optional. restore a saved state with the slot value (0, 1, 2, etc)
     * @param  {string} shader      optional. preselected shader. if supplied, will skip the shader selection
     * @return {undef}
     */
    var RetroArchBootstrap = function(gameKey, slot, shader, callback) {

        var box = cesGetBoxFront(_config, gameKey.system, gameKey.title, 170); //preload loading screen box
        _Collections.SetCurrentGameLoading(gameKey); //inform collections what the current game is so that they don't attempt to delete it during load

        //which emulator to load?
        EmulatorFactory(gameKey, function(err, emulator) {
            if (err) {
                //not sure how to handle this yet
                console.error(err);
                return;
            }

            _Emulator = emulator;

            // all deferres defined for separate network dependancies
            var emulatorLoadComplete = $.Deferred();
            var savePreferencesAndGetPlayerGameDetailsComplete = $.Deferred();

            _preventLoadingGame = false; //during shader select, allow other games to load

            //show shader selector. returns an object with shader details
            ShowShaderSelection(gameKey.system, shader, function(shaderselection) {

                _preventLoadingGame = true; //lock loading after shader select
                var gameLoadingStart = Date.now();

                _ProgressBar.Reset(); //before loading dialog, reset progress bar from previous

                //game load dialog show
                ShowGameLoading(gameKey.system, gameKey.title, box, function(tipInterval) {

                    var optionsToSendToServer = {
                        shader: shaderselection.shader,  //name of shader file
                    };

                    //this call is a POST. Unlike the others, it is destined for the mongo instance (MY DOMAIN not a cdn). we send user preference data to the server in addition to getting game details.
                    SavePreferencesAndGetPlayerGameDetails(gameKey, optionsToSendToServer, savePreferencesAndGetPlayerGameDetailsComplete);

                    //run to my domain first to get details about the game before we retrieve it
                    $.when(savePreferencesAndGetPlayerGameDetailsComplete).done(function(gameDetails) {

                        var saves = gameDetails.saves;
                        var files = gameDetails.files;
                        var shaderFileSize = gameDetails.shaderFileSize; //will be 0 if no shader to load
                        var supportFileSize = _config.systemdetails[gameKey.system].supportfilesize; //will be 0 for systems without support
                        var info = {};
                        try {
                            info = JSON.parse(gameDetails.info);
                        } catch (e) {
                            //meh
                        }
                        var filesize = gameDetails.size;

                        //_ProgressBar.AddBucket('done', filesize * 0.05); //this represents the final work I need to do before the game starts (prevents bar from showing 1 until totally done)

                        //begin loading all content. I know it seems like some of these (game, emulator, etc) could load while the user
                        //is viewing the shader select, but I found that when treated as background tasks, it interfere with the performance
                        //of the shader selection ui. I think its best to wait until the loading animation is up to perform all of these
                        _Emulator.Load(_Emulator.createModule(), _ProgressBar, filesize, shaderselection.shader, shaderFileSize, supportFileSize, emulatorLoadComplete);

                        //when all deffered calls are ready
                        $.when(emulatorLoadComplete).done(function(emulatorLoaded) {

                            _Emulator.InitializeSavesManager(saves, gameKey);

                            //date copmany
                            if (info && info.Publisher && info.ReleaseDate) {
                                var year = info.ReleaseDate.match(/(\d{4})/);
                                $('#gametitlecaption').text(info.Publisher + ', ' +  year[0]);
                            }
                                
                            _preventLoadingGame = false; //during save select, allow other games to load

                            //are there saves to load? Let's show a dialog to chose from, if not - will go straight to start
                            _SaveSelection = new cesSaveSelection(_config, _Dialogs, _Emulator, gameKey.system, $('#savedgameselector'), function(err, selectedSaveTimeStamp, selectedSavescreenshot) {
                                
                                if (selectedSaveTimeStamp) {
                                    ShowSaveLoading(gameKey.system, selectedSavescreenshot);
                                }

                                _preventLoadingGame = true;

                                //calculate how long the loading screen has been up. Showing it too short looks dumb
                                var gameLoadingDialogUptime = Math.floor(Date.now() - gameLoadingStart);
                                var artificialDelayForLoadingScreen = gameLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - gameLoadingDialogUptime;

                                //set an artificial timeout based on the amount of time the loading screen was up
                                //lets ensure a minimum time has passed (see private vars)
                                setTimeout(function() {

                                    //_ProgressBar.Update('done', 1); //complete the progress bar here

                                    // load state? bails if not set
                                    _Emulator.WriteSaveData(selectedSaveTimeStamp, function(stateToLoad) { //if save not set, bails on null

                                        //begin game, callback is function which handles expections for any emulator error
                                        _Emulator.BeginGame(function(e) {
                                            clearInterval(tipInterval);
                                            _PubSub.Publish('error', ['There was an error with the emulator:', e]);
                                        });

                                        //before going any further, we can correctly assume that once the config
                                        //is written, the file system is ready for us to read from it
                                        _PubSub.SubscribeOnce('retroArchConfigWritten', self, function() {

                                            //load state? bails if null.. if valid, will show a new save loading dialog
                                            //and will load state. callback occurs after state has loaded
                                            LoadEmulatorState(gameKey.system, stateToLoad, function() {

                                                //close all dialogs (save loading or game loading), game begins!
                                                _Dialogs.CloseDialog(false, function() {

                                                    //stop rolling tips
                                                    $('#tips').stop().hide();
                                                    clearInterval(tipInterval);

                                                    //handle title and content fadein steps
                                                    DisplayGameContext(gameKey, function() {

                                                    });

                                                    //enlarge dialog area for emulator
                                                    _Dialogs.SetHeight($('#emulatorwrapper').outerHeight(), function() {

                                                        //assign focus to emulator canvas
                                                        $('#emulator')
                                                            .blur(function(event) {
                                                                if (!_preventGamePause) {

                                                                    _Emulator.PauseGame();
                                                                    $('#emulatorwrapperoverlay').fadeIn();
                                                                }
                                                            })
                                                            .focus(function() {
                                                                window.scrollTo(0, 0); //bring attention back up top
                                                                _Emulator.ResumeGame();
                                                                $('#emulatorwrapperoverlay').hide();
                                                            });

                                                        //reveal emulator
                                                        _Emulator.Show(); //control is game is given at this step

                                                        $('#emulator').focus(); //give focus (also calls resume game, I took care of the oddities :P)

                                                        //inform instances that game is starting (for those that care)
                                                        _Collections.RemoveCurrentGameLoading();

                                                        //with all operations complete, callback
                                                        if (callback) {
                                                            callback();
                                                        }
                                                    });
                                                });
                                            });
                                        }, true); //subscribe once, exclusive flag
                                    });
                                }, artificialDelayForLoadingScreen);
                            });
                        });
                    });
                });
            });
        });
    };

    var LoadEmulatorState = function(system, stateToLoad, callback) {

        if (!stateToLoad) {
            callback();
            return;
        }

        //build loading dialog with image
        var saveLoadingStart = Date.now();

        //create a subscription for when the state file will have finished loading, then resume
        _PubSub.SubscribeOnce('stateRead', self, function() {

            //keep in mind that this publish fires once the state has been loaded so the game is currently running
            // callback();
            // _Emulator._InputHelper.Keypress('mute');
            
            //just like game loading, show the save loading screen for a minimum time before pressing the load
            var saveLoadingDialogUptime = Math.floor(Date.now() - saveLoadingStart);
            var artificialDelayForLoadingScreen = saveLoadingDialogUptime > _minimumGameLoadingTime ? 0 : _minimumGameLoadingTime - saveLoadingDialogUptime;

            //pause loaded state because we want to show the loading screen for a minimim amount of time
            _Emulator._InputHelper.Keypress('pause', function() {

                setTimeout(function() {
                    callback();

                    //unpause and unmute
                    _Emulator._InputHelper.Keypress('mute', function() {
                        _Emulator._InputHelper.Keypress('pause', function() {
                            _PubSub.Unmute('notification');
                        });
                    });

                }, _minimumSaveLoadingTime);
            });
        }, true); //sub once exclusive flag

        //start here
        _PubSub.Mute('notification'); //mute notifications during load
        _Emulator._InputHelper.Keypress('mute', function() {

            _Emulator._InputHelper.Keypress('loadstate');
        });
    };

    var ShowErrorDialog = function(message, e) {

        CleanUpEmulator(function() {

            _preventLoadingGame = false; //in case it failed during start
            //_RecentlyPlayed.RemoveCurrentGameLoading();

            $('#emulatorexceptiondetails').text(message + '\r\n' + e);
            console.error(e);

            _Dialogs.ShowDialog('emulatorexception');
        });
    };

    var EmulatorFactory = function(gameKey, callback) {

        var emuExtention = _config.systemdetails[gameKey.system].emuextention;
        var emuExtentionFileName = 'ces.' + emuExtention + '.js';

        //get emulator extention file
        $.getScript(_config.emuextentionspath + '/' + emuExtentionFileName).done(function(script, textStatus) {

                //ui handles for the emulator class (add as needed, we want to only referece jquery in main if possible)
                var ui = {
                    'wrapper': $('#emulatorwrapper'),
                    'canvas': $('#emulator')
                }

                //the class extention process: on the prototype of the ext, create using the base class.
                cesEmulator.prototype = new cesEmulatorBase(_Compression, _PubSub, _config, _Sync, gameKey, ui, _ClientCache);

                var emulator = new cesEmulator(_Compression, _PubSub, _config, _Sync, gameKey);

                //KEEP IN MIND: this pattern is imperfect. only the resulting structure (var emulator and later _Emulator)
                //will have access to data in both, cesEmulatorBase does not have knowledge of anything in cesEmulator
                
                callback(null, emulator);
            })
            .fail(function(jqxhr, settings, exception ) {
                callback(exception);
            }
        );
    };

    var OnEmulatorFileWrite = function(filename, contents, options) {
        
        if (type === 'screen') {

            var arrayBufferView = options.arrayBufferView;
            var system = options.system;
            var title = options.title;

            $('p.screenshothelper').remove(); //remove helper text

            var width = $('#screenshotsslider div.slidercontainer').width() / 3; //550px is the size of the panel, the second number is how many screens to want to show per line
            var img = BuildScreenshot(_config, system, arrayBufferView, width);

            $(img).addClass('close').load(function() {
                $(this).removeClass('close');
            });
            var a = $('<a class="screenshotthumb" href="' + img.src + '" download="' + title + '-' + filename + '"></a>'); //html 5 spec downloads image
            a.append(img).insertAfter('#screenshotsslider p');

            //kick open the screenshot slider
            //_Sliders.Open('screenshotsslider', true);
        }
    };

    /**
     * this functio handles showing the shader selection before a game is loaded
     * @param  {string}   system
     * @param  {string}   preselectedShader if a shader is predefined in the bootstap, it is passed along here
     * @param  {Function} callback
     * @return {undef}
     */
    var ShowShaderSelection = function(system, preselectedShader, callback) {

        $('#systemshaderseletor span').text(_config.systemdetails[system].shortname); //fix text on shader screen
        $('#shaderselectlist').empty(); //clear all previous content

        //bail early: check if shader already defined for this system (an override value passed in)
        if (typeof preselectedShader !== 'undefined') {
            callback({
                'shader': preselectedShader
            });
            return;
        }

        //bail early: check if user checked to use a shader for this system everytime
        //if they saved "No Processing" its an empty string
        var userpreference = _Preferences.GetShader(system);
        if (userpreference || userpreference == "") {
            callback({
                'shader': userpreference
            });
            return;
        }

        //get the recommended shaders list
        var recommended = _config.systemdetails[system].recommendedshaders;
        var shaderfamilies = _config.shaders;
        var i = 0;

        //suggest all (for debugging), remove when the ability to test all shaders is present
        // for (i; i < shaderfamilies.length; ++i) {
        //     $('#shaderselectlist').append($('<div style="display:block;padding:0px 5px;" data-shader="' + shaderfamilies[i] + '">' + shaderfamilies[i] + '</div>').on('click', function(e) {
        //         onFinish($(this).attr('data-shader'));
        //     }));
        // }

        $('#shaderselectlist').append($('<li class="zoom" data-shader=""><h3>No Processing</h3><img class="tada" src="' + _config.assetpath + '/images/shaders/' + system + '/pixels.png" /></li>').on('click', function(e) {
            onFinish($(this).attr('data-shader'));
        }));

        for (i; i < recommended.length; ++i) {

            var key = recommended[i];

            $('#shaderselectlist').append($('<li class="zoom" data-shader="' + key.shader + '"><h3>' + key.title + '</h3><img src="' + _config.assetpath + '/images/shaders/' + system + '/' + i + '.png" /></li>').on('click', function(e) {
                onFinish($(this).attr('data-shader'));
            }));
        }

        /**
         * when shader has been selected
         * @param  {string} shader
         * @return {undef}
         */
        var onFinish = function(shader) {
            $('#systemshaderseletorwrapper').addClass('close');
            
            var playerPreferencesToSave = {};
            var saveselection = false;

            //get result of checkbox
            if ($('#shaderselectcheckbox').is(':checked')) {
                saveselection = true;
                _Preferences.SetShader(system, shader); //we set a flag in pref when update to go out over the next request
            }

            setTimeout(function() {
                $('#systemshaderseletorwrapper').hide();
                callback({
                    'shader': shader
                });
            }, 250);
        };

        //show dialog
        _Dialogs.ShowDialog('shaderselector');
    };

    var ShowSaveLoading = function(system, screenshotData) {

        var $image = $(BuildScreenshot(_config, system, screenshotData, null, 200));
        $image.addClass('tada');
        $image.load(function() {
            $(this).fadeIn(200);
        });

        $('#saveloadingimage').empty().addClass('centered').append($image);

        _Dialogs.ShowDialog('saveloading');
    };

    var ShowGameLoading = function(system, title, box, callback) {

        $('#tip').hide();
        $('#gameloadingname').show().text(title);

        //build loading box
        var box = cesGetBoxFront(_config, system, title, 170) || box; //if it was preloaded!
        box.addClass('tada');
        box.load(function() {
            $(this).fadeIn(200);
        });

        $('#gameloadingimage').empty().addClass('centered').append(box);

        //show tips on loading
        var randomizedTips = shuffle(_tips);
        var tipIndex = -1;
        var tipInterval = setInterval(function() {
            $('#gameloadingname').fadeOut(500);
            $('#tip').fadeOut(500, function() {
                
                ++tipIndex;
                if (tipIndex >= randomizedTips.length) {
                    tipIndex = 0;
                }

                var tip = randomizedTips[tipIndex];

                if (!$('#gameloading').is(':animated')) {
                    $('#tip').empty().append('Tip: ' + tip).fadeIn(500);
                }

            });
        }, _tipsCycleRate); //show tip for this long

        _Dialogs.ShowDialog('gameloading', null, function() {
            callback(tipInterval);
        }); 
    };

    /**
     * build content area underneath emulator canvas
     * @param  {string}   system
     * @param  {string}   title
     * @param  {Function} callback
     * @return {undef}
     */
    var DisplayGameContext = function(gameKey, callback) {

        var box = cesGetBoxFront(_config, gameKey.system, gameKey.title, 170);

        //using old skool img because it was the only way to get proper image height
        var img = document.createElement('img');
        img.addEventListener('load', function() {

            $('#gamedetailsboxfront').empty().append(box);
            $('#gametitle').empty().hide().append(gameKey.title);

            // slide down background
            $('#gamedetailsboxfront img').addClass('close');
            $('#gamedetailsbackground').animate({
                height: 250
            }, 1000, function() {

                //fade in details
                $('#gamedetailswrapper').fadeIn(1000, function() {

                    $('#gamedetailsboxfront img').removeClass();

                    //load controls
                    $('#controlsslider').empty();
                    $.get('/layout/controls/' + gameKey.system, function(result) {
                        $('#controlsslider').append(result);
                    });

                    callback();
                });

                //needs to occur after fade in to understand dimensions
                $('#gametitle').bigText({
                    textAlign: 'left',
                    horizontalAlign: 'left'
                }); //auto size text to fit
            });
        }, true);

        //once the formal box loads, use the same src for our temp img to measure its height
        box.load(function() {
            img.setAttribute('src', box.attr('src'));
        });
    };

    var HideGameContext = function(callback) {

        //fade out game details
        $('#gamedetailsboxfront img').addClass('close');
        $('#gamedetailswrapper').fadeOut();
        $('#gamedetailsbackground').animate({
            height: 0
        }, 1000, function() {

            if (callback) {
                callback();
            }
        });
    };

    /**
     * Runs a series of keyboard instructions by keycode with optional delays between keystrokes
     * @param  {Object|Array}   instructions
     * @param  {Function} callback
     * @return {undef}
     */
    var runKeyboardMacro = function(instructions, callback) {


        //base case, either not an array or no more instructions are on queue
        if (!$.isArray(instructions) || instructions.length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        var keycode = instructions[0];
        var pause = 0;

        //if instruction contains code and pause length (in ms)
        if ($.isArray(keycode)) {
            keycode = keycode[0];
            if (keycode[1]) {
                pause = keycode[1];
            }
        }
        _Emulator._InputHelper.Keypress('', function() {
            runKeyboardMacro(instructions.slice(1), callback);
        });
    };

    /**
     * a trip to the server (same domain) to load an extra details about a game at load: states, rom files, ...
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @param  {Object} all options to pass to server
     * @param  {Object} deffered
     * @return {undef}
     */
    var SavePreferencesAndGetPlayerGameDetails = function(gameKey, options, deffered) {

        //call returns not only states but misc game details. I tried to make this
        //part of the LoadGame call but the formatting for the compressed game got weird
        var url = '/games/load?gk=' + encodeURIComponent(gameKey.gk);

        _Sync.Post(url, options, function(data) {
            deffered.resolve(data);
        });
    };

    /**
     * generate a base64 encoded compressed string of the values necessary to load this game directly
     * @param  {string} system
     * @param  {string} title
     * @param  {string} file
     * @return {string}
     */
    var GenerateLink = function(system, title, file) {
        return _Compression.In.string(encodeURI(system + '/' + title + '/' + file)); //prehaps slot for load state as query string?
    };

    /**
     * a quick function that downlaods all captured screens
     * @return {undef}
     */
    var DownloadAllScreens = function() {

        var delay = 500;
        var time = delay;

        $('.screenshotthumb').each(function(index) {


            setTimeout(function() {
                $(self)[0].click();
            }, delay);
            time += delay;
        });
    };

    return this;

})();

/**
 * css rotation animation helper and jquery extension
 * @param  {number} startingangle
 * @param  {number} angle
 * @param  {number} duration
 * @param  {string} easing
 * @param  {Function} complete
 * @return {Object}
 */
$.fn.animateRotate = function(startingangle, angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete);
    var step = args.step;
    return this.each(function(i, e) {
        args.complete = $.proxy(args.complete, e);
        /**
         * dont know, not my code
         * @param  {Date} now
         * @return {Object}
         */
        args.step = function(now) {
            $.style(e, 'transform', 'rotate(' + now + 'deg)');
            if (step) {
                return step.apply(e, arguments);
            }
        };

        $({deg: startingangle}).animate({deg: angle}, args);
    });
};

/**
 * a common function to return to the jquery object of a box front image. includes onerror handler for loading generic art when box not found
 * @param  {string} system
 * @param  {string} title
 * @param  {number} size   size of the box art (114, 150...)
 * @return {Object}        jquery img
 */
cesGetBoxFront = function(config, system, title, size, onErrorHandler) {

    var _Compression = new cesCompression();
    var _nerfImages = false;

    //double encode, once for the url, again for the actual file name (files saved with encoding becase they contain illegal characters without)
    title = encodeURIComponent(encodeURIComponent(_Compression.Zip.string(title)));

    var errorsrc = config.assetpath + '/images/blanks/' + system + '_' + size + '.png';
    var src = config.boxpath + '/' + system + '/' + config.systemdetails[system].boxcdnversion + '/' + (title + (_nerfImages ? 'sofawnsay' : '')) + '/' + size + '.jpg';

    var img = document.createElement('img');
    img.src = src;
    img.addEventListener('error', function() {

        //on error, set a new load listener and load the error image
        this.addEventListener('load', function() {    
            if (this.height) {
                this.setAttribute('height', this.height + 'px');
            }
            if (onErrorHandler) {
                onErrorHandler();
            }
        });
        this.src = errorsrc;
    });

    _Compression = null;

    //incldes swap to blank cart onerror
    return $(img); //$('<img width="' + size + '" onerror="this.src=\'' + errorsrc + '\'" src="' + src + '" />');
};

/**
 * common function to take arraybufferview of screenshot data and return a dom image. prodive width of image and we'll lookup aspect ration in config data
 * @param {string} system the system for which this screenshot belongs. used to look up aspect ratio
 * @param  {Array} arraybufferview
 * @param  {number} width
 * @return {Object}
 */
var BuildScreenshot = function(config, system, arraybufferview, width, height) {

    var screenratio = 1;

    var blob = new Blob([arraybufferview], {
        type: 'image/bmp'
    });

    //get screen ratio from config
    if (config.systemdetails[system] && config.systemdetails[system].screenshotaspectratio) {
        screenratio = parseFloat(config.systemdetails[system].screenshotaspectratio);
    }

    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    
    if (width) {
        var img = new Image(width, width / screenratio);        //create new image with correct ratio
    }
    if (height) {
        var img = new Image(height * screenratio, height);        //create new image with correct ratio   
    }

    
    img.src = imageUrl;

    return img;
};

var shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesNotifications = (function(_config, _Compression, _PubSub, $wrapper) {

    //private members
    var self = this;
    var $message = $wrapper.find('p');
    var $icon = $wrapper.find('div.spinner');
    var _transitionDuration = 500; //a magic number, check with css transition
    var _notificationQueue = [];
    var _minimumTimeToShow = 1500; //in ms
    var _minimumTimeTimeout = null; //holds a setTimeout
    var _currentlyShowing = null; //holds a note instance
    var _currentShowingTimeStamp = null; //holds a date instance of when note began showing
    var _passageOfTime = 10; //in s. the amount of time to pass before showing (n seconds ago) on the notification
    
    /*
    Priority:
    1 - immediately drop all queued notifications and show
    2 - move to front of queue, allowing current to finish first
    3 - normal prior
    */

    var _notification = (function(message, priority, hold, icon, topic) {

        this.message = message || ''; //the message to show
        this.priority = priority || 3; //1-3. 1 being most important
        this.hold = hold || false; //true holds message until clear is published
        this.icon = icon || false; //to show spinner or not, default yes
        this.topic = topic || null; //the pubsub topic to subscribe to for when to close
        this.timeAdded = Date.now(); //the time the notification was supposed to occur
    });

    //public members

    //public methods
    
    this.Enqueue = function(message, priority, hold, icon, topic) {

        //create notification
        var note = new _notification(message, priority, hold, icon, topic);

        switch (note.priority)
        {
            case 3:
                _notificationQueue.push(note);
                break;
            case 2:
                _notificationQueue.unshift(note); //insert at front
                break;
            case 1:
                //stop everything!
                self.Reset();
                _notificationQueue.push(note);
                break;
        }
        
        //pubsub to close?
        if (topic) {

            _PubSub.SubscribeOnce(topic, self, function() {

                //since the condition was met to close this note, if it hasn't shown yet (in queue) set its hold to false
                note.hold = false;
                
                //if it is the currently showing, close it
                if (_currentlyShowing === note) {
                    self.Hide();
                }
            });
        }

        //if nothing showing, show now
        if (!_currentlyShowing)
        {
            this.ShowNext();
        }

    };

    this.ShowNext = function() {
        
        if (_notificationQueue.length > 0)
        {
            _currentlyShowing = _notificationQueue.shift();

            var occurTimeDiff = (Date.now() - _currentlyShowing.timeAdded) / 1000; //mil to secs

            var message = _currentlyShowing.message;

            //if the time the note was queued to the time it was shown is greater than 5 second, append that message
            if (occurTimeDiff > _passageOfTime) {
                var value = Math.floor(occurTimeDiff);
                message += '(' + value + ' second' + (value > 1 ? 's' : '') + ' ago)';
            }

            //update dom
            $message.text(message);
            $wrapper.removeClass('closed');
            
            if (_currentlyShowing.icon) {
                $icon.show();
            } else {
                $icon.hide();
            }

            //auto hide if not hold
            if (!_currentlyShowing.hold) {
                _minimumTimeTimeout = setTimeout(function() {
                    self.Hide();
                }, _minimumTimeToShow);
            }

            _currentShowingTimeStamp = Date.now();
        }
    };

    this.Hide = function() {
        
        //sanity check
        if (_currentShowingTimeStamp && _currentlyShowing)
        {
            var timeShown = Date.now() - _currentShowingTimeStamp;
            _currentShowingTimeStamp = null;

            var onMinimumTimeShown = function() {

                $wrapper.addClass('closed');
                
                //when css animation is complete
                setTimeout(function() {

                    _currentlyShowing = false;
                    self.ShowNext(); //move to next in queue

                }, _transitionDuration);
            };

            if (timeShown < _minimumTimeToShow) {
                _minimumTimeTimeout = setTimeout(function() {
                    onMinimumTimeShown();
                }, _minimumTimeToShow - timeShown);
            }
            else {
                onMinimumTimeShown();
            }
        }
    };

    this.Reset = function() {

        _notificationQueue = [];
        $wrapper.addClass('closed');
        _currentShowingTimeStamp = null;
        _currentlyShowing = null;
        
        if (_minimumTimeTimeout) {
            clearTimeout(_minimumTimeTimeout);
        }
        _minimumTimeTimeout = null;
    };

    return this;
});
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPreferences = (function(_Compression, initialData) {

    var _self = this;
    var _data = {};
    var _storageName = 'preferences';

    /**
     * returns player's shader preference for the system specified
     * @param  {string} system
     * @return {string}
     */
    this.GetShader = function(system) {

        var shader = Get('systems.' + system + '.shader');
        if (shader != null && typeof shader != 'undefined') {
            return shader;
        }
        return null;
    };

    /**
     * set's a player's shader preference for the system specified.
     * @param {string} system
     * @param {string} value
     */
    this.SetShader = function(system, value) {
        
        Set('systems.' + system + '.shader', value);
        return _data;
    };

    /**
     * Helper function to get values out of nested object structure
     * @param {String} key 
     */
    var Get = function(key, values) {
        return key.split('.').reduce(function(o, x) {
            return (typeof o == 'undefined' || o === null) ? o : o[x];
        }, _data);
    };

    var Set = function(key, value) {

        var pieces = key.split('.');
        var currentDepth = _data;

        for (var i = 0, len = pieces.length; i < len; ++i) {
            
            var valueToInsert = {};
            //final assigns value
            if (i == len - 1) {
                valueToInsert = value;
            }
            
            if (!currentDepth.hasOwnProperty(pieces[i])) {
                currentDepth[pieces[i]] = valueToInsert;

            } else if (typeof currentDepth[pieces[i]] != 'object') {
                currentDepth[pieces[i]] = valueToInsert;
            } 
            currentDepth = currentDepth[pieces[i]];
        }
        
        _self.Sync.ready = true; //flag to update server
        SetStorage();
    };

    var SetStorage = function() {
        localStorage.setItem(_storageName, _Compression.Compress.json(_data));
    };

    var GetStorage = function() {

        var result;
        try {
            result = localStorage.getItem(_storageName);
            result = _Compression.Decompress.json(result);
        } 
        catch (e) {
            //nothing really, if its invalid, then we wont use it
        }
        return result;
    }

    //in order to sync data between server and client, this structure must exist
    this.Sync = new (function() {
        
        var __self = this;
        this.ready = false;

        this.Incoming = function(preferences) {

            _data = preferences;
            SetStorage();
        };

        this.Outgoing = function() {
            __self.ready = false;
            return _data;
        };

        return this;
    })();

    //exists at bottom to ensure all other methods/members are defined
    var Constructor = (function() {

        //initialData will always be something, but check the client validation flag
        if (initialData.validated === 1) {
            _self.Sync.Incoming(initialData);
            return;
        }
        
        //if here, not validated with client yet. Perhaps client has more up to date data (server restart, cache cleared)
        var clientData = GetStorage();
        
        if (clientData) {
            _self.Sync.Incoming(clientData);
        }
        //there was no client cookie, accept the server data
        else {
            initialData.validated = 1;
            _self.Sync.Incoming(initialData);
        }
        //in either case, we need to update the server cache to inform validation took place
        _self.Sync.ready = true; //update the server with validated data

    })();

    return this;
});
var cesProgressBar = (function(_wrapper) {

    //private members
    var self = this;
    var _bar = null;
    var _currentComplete = 0;
    var _buckets = {};
    
    //public members
    this.AddBucket = function(name, totalsize) {

        _buckets[name] = {
            'progress': 0,
            'total': totalsize
        }
    };

    this.Update = function(name, amount) {

        if (!_buckets.hasOwnProperty(name)) {
            return;
        }

        _buckets[name].progress = amount;

        //console.log('Progress ' + name + ': ' + amount + '/' + _buckets[name].total);
        Compute();
    };

    this.Reset = function() {
        _buckets = {};
        _bar.set(0);
        _currentComplete = 0;
    };

    //public methods

    $(document).ready(function() {

        //progress bar
        _bar = new ProgressBar.Line(_wrapper, {
            strokeWidth: 4,
            easing: 'easeInOut',
            duration: 100,
            color: '#00B7FF',
            trailColor: '#eee',
            trailWidth: 1,
            svgStyle: {width: '100%', height: '100%'}
        });
    });

    //private methods

    var Compute = function() {

        var totalSize = 0;
        var totalProgress = 0;

        for (var name in _buckets) {
            totalSize += _buckets[name].total;
            totalProgress += _buckets[name].progress;
        }

        var percentage = (totalProgress / totalSize);

        _bar.animate(percentage);
        _currentComplete = percentage;
    };

    return this;

});
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesPubSub = (function() {

    //private members
    var self = this;
    var _topics = {};
    var _muted = {};
    var _debug = true; //when true, console logging
    
    //public members

    this.Publish = function(topic, args) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }

        if (_debug) {
            console.log('PUBLISH: ' + topic, args);
        }

        var itemsToDelete = [];

        //call all handlers within the topic and pass the args along
        _topics[topic].forEach(function(item, index) {
            item.handler.apply(item.context, args);

            //if countdown to delete, mark down. null would be a sub that exists forever
            if (item.countdown) {
                item.countdown--;

                if (item.countdown === 0) {
                    itemsToDelete.push(index);
                }
            }
        });

        itemsToDelete.forEach(function (item) {
            delete _topics[topic][item];
        });
    };

    this.Subscribe = function(topic, context, handler) {

        return Subscribe(topic, context, handler);

    };

    this.SubscribeOnce = function(topic, context, handler, exclusive) {
        
        //if exclusive, that means we only have one listener
        if (exclusive) {
            self.Unsubscribe(topic); //remove all topics
        }

        return Subscribe(topic, context, handler, 1);
    };

    this.Unsubscribe = function(topic) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }
        delete _topics[topic];
    };

    this.Mute = function(topic) {

        if (!_topics.hasOwnProperty(topic)) {
            return;
        }

        _muted[topic] = _topics[topic];
        delete _topics[topic];
    };

    this.Unmute = function(topic) {

        if (!_muted.hasOwnProperty(topic)) {
            return;
        }
        _topics[topic] = _muted[topic];
        delete _muted[topic];
    };

    var Subscribe = function(topic, context, handler, countdown) {

        //create topic
        if (!_topics.hasOwnProperty(topic)) {
            _topics[topic] = [];
        }

        //add a new handler to the topic
        var index = _topics[topic].push({
            handler: handler,
            context: context,
            countdown: countdown
        });

        //we can use this to allow a sub to remove itself, check first since I could have removed it through unsub
        return function() {

            if (!_topics.hasOwnProperty(topic)) {
                return;
            }
            if (_topics[topic].hasOwnProperty(index)) {
                delete _topics[topic][index];
            }
            return;
        }
    }

    this.Pub = this.Publish;
    this.Sub = this.Subscribe;

    return this;
});
var cesRecentlyPlayed = (function(config, _Compression, _PlayGame, $wrapper, _initialData, _OnRemoveHandler) {
		
	//private members
	var self = this;
	var _grid = null;
	var _BOXSIZE = 120;
    var _currentLoadingGame = null;

	//public members

	//public methods

    this.SortBy = function(property, sortAscending) {
        
        sortAscending = sortAscending === true || false;

        //ensure data is up to date5
        _grid.isotope('updateSortData').isotope();

        _grid.isotope({ 
            sortBy : property,
            sortAscending: sortAscending
        });
    };

	this.Add = function (key, data, isNew, callback) {

        //data comes in from playerdata
        if (data.system && data.title && data.file && data.lastPlayed) {

            //is new, create a gamelink and add
            if (isNew) {

        		AddToGrid(key, data.system, data.title, data.file, data.lastPlayed, function() {

                    OnImagesLoaded();
                });
            }
            //update detils and resort
            else {
                
                var $item = _grid.find('*[data-key="' + key + '"]');

                $item.attr('data-lastPlayed', data.lastPlayed);

                self.SortBy('lastPlayed', false);

                OnImagesLoaded();
            }
        }
	};

    this.SetCurrentGameLoading = function(gameKey) {
        _currentLoadingGame = gameKey;
    };

    this.RemoveCurrentGameLoading = function() {
        _currentLoadingGame = null;
    };

    var OnImagesLoaded = function() {

        _grid.find('img').imagesLoaded().progress(function(imgLoad, image) {
            
            $(image.img).parent().removeClass('close'); //remove close on parent to reveal image
            _grid.isotope('layout');
        });
    };

	/**
     * Assign actions to a gamelink and then append it to the grid but does NOT perform grid layout
     * @param {[type]}   key      [description]
     * @param {[type]}   system   [description]
     * @param {[type]}   title    [description]
     * @param {[type]}   file     [description]
     * @param {[type]}   played   [description]
     * @param {[type]}   slots    [description]
     * @param {Function} callback [description]
     */
	var AddToGrid = function(key, system, title, file, lastPlayed, callback) {

        //create the grid item
        var $griditem = $('<div class="grid-item" />');

		var gamelink = new cesGameLink(config, system, title, file, 120, true, _PlayGame);

        //set the on remove function
        gamelink.OnRemoveClick(function() {
            Remove(key, gamelink, $griditem);
        });

        //place sorting data on grid item
        $griditem.attr('data-key', key);
        $griditem.attr('data-lastPlayed', lastPlayed);

        $griditem.append(gamelink.GetDOM()); //add gamelink
        
        _grid.isotope( 'insert', $griditem[0]);

        if (callback) {
        	callback();
        }
	};

    
    /**
     * @param  {String} gameKey
     * @param  {Object} gamelink
     * @param  {Object} griditem
     */
    var Remove = function(gameKey, gamelink, griditem) {

        //before removing, is this the current game being loaded? 
        //we cannot allow it to be deleted (like if there are selecting a save)
        if (gameKey == _currentLoadingGame) {
            return;
        }

        //maybe set a loading spinner on image here?
        gamelink.DisableAllEvents(); //disabled buttons on gamelink to prevent loading game or removing again

        //immediately remove from grid (i used to wait for response but why right?)
        _grid.isotope('remove', griditem).isotope('layout');

        // $.ajax({
        //     url: '/saves/delete?gk=' + encodeURIComponent(gameKey),
        //     type: 'DELETE',
        //     /**
        //      * on successful state deletion
        //      * @return {undef}
        //      */
        //     complete: function() {
                
        //         //clear mem
        //         gamelink = null;

        //         //callback the function to remove from player data
        //         if (_OnRemoveHandler) {
        //             _OnRemoveHandler(gameKey); //passed in, will remove from player data at main level 
        //         }
        //     }
        // });
    };

    
    /**
     * Constructors live at the bottom so that all private functions are available
     * @param  {} function(
     */
    var Constructor = (function() {

		_grid = $wrapper.isotope({
            layoutMode: 'masonry',
            itemSelector: '.grid-item',
            getSortData: {
                lastPlayed: function(item) {
                    var played = $(item).attr('data-lastPlayed');
                    return parseInt(played, 10);
                }
            }
        });

        for (var game in _initialData) {
            AddToGrid(game, _initialData[game].system, _initialData[game].title, _initialData[game].file, _initialData[game].lastPlayed); 
        }

        self.SortBy('lastPlayed', false);

        OnImagesLoaded();

	})();

	return this;

});
/**
 * Unlike the other "classes", save selection is more proceedural in operation. I basically wanted to remove this functionality from main
 */
var cesSaveSelection = (function(_config, _Dialogs, _Emulator, _system, $wrapper, callback) {

    //private members
    var self = this;
    var _grid = null;
    var $grid = $wrapper.find('.grid');

    //handle bail
    if ($.isEmptyObject(_Emulator.GetMostRecentSaves(1))) {
        callback('There are no recent saves to display');
        return;
    }

    $('#savesselectlist').empty(); //clear from last time

    var GetSaves = function(type) {

        var saves = _Emulator.GetMostRecentSaves(3, type);

        for (timestamp in saves) {

            switch (saves[timestamp].save.type) {
                case 'user':
                AddToGrid(timestamp, saves[timestamp], 'green', 'YOUR SAVE');
                break;
                case 'auto':
                AddToGrid(timestamp, saves[timestamp], 'orange', 'AUTO-SAVED');
                break;
            }
        }
    };

    var AddToGrid = function(timestamp, saveData, ribbonColor, ribbonText) {

        var $image = $(BuildScreenshot(_config, _system, saveData.save.screenshot, 200));

        var $li = $('<li class="zoom" data-shader=""><h3>#' + (saveData.total - saveData.i) + ' of ' + saveData.total + ': ' + saveData.save.time + '</h3></li>').on('click', function(e) {
                
            callback(null, timestamp, saveData.save.screenshot);
        });

        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $li.append($imageWrapper);
        $('#savesselectlist').append($li);
	};

    $('#loadnosaves').off().on('mouseup', function() {
        callback('User chose not to load a save');
        _Dialogs.CloseDialog(); //close now
    });

    //populate
    GetSaves();

    switch (_Emulator.MaximumSavesCheck()) {
        case 'max':
            $wrapper.find('p.max').removeClass(); //shows at maximum message
            break;
        case 'near':
            $wrapper.find('p.near').removeClass(); //shows at near maximum message    
            break;
    }

    //show dialog
    _Dialogs.ShowDialog('savedgameselector');

    return this;

});

/**
 * saved state selection dialog.
 * @param  {Object}   states   structure with states, screenshot and timestap. empty when no states exist
 * @param  {Function} callback
 * @return {undef}
 */
var ShowSaveSelection = function(system, title, file, callback) {

    if (!_Emulator) {
        callback();
        return;
    }

    //get saves from emaultor saves manager to show for selection
    //will return an array for each type, empty if none
    var saves = _Emulator.GetMostRecentSaves(3);

    //no states saved to chose from
    if ($.isEmptyObject(saves)) {
        callback();
        return;
    }

    $('#savesselectlist').empty(); //clear from last time

    //generic function for adding auto and user saves to list
    var addToSelectionList = function(timestamp, saveData, ribbonColor, ribbonText) {

        var $image = $(BuildScreenshot(system, saveData.screenshot, 200));

        var $li = $('<li class="zoom" data-shader=""><h3>' + saveData.time + '</h3></li>').on('click', function(e) {
                
            callback(timestamp);
            ShowSaveLoading(system, saveData.screenshot);
        });

        var $ribbonInner = $('<div class="ribbon-' + ribbonColor + ' ribbon" />').text(ribbonText);
        var $ribbonOuter = $('<div class="ribbon-wrapper" />').append($ribbonInner);
        var $imageWrapper = $('<div class="rel" />').append($ribbonOuter).append($image);

        $li.append($imageWrapper);
        $('#savesselectlist').append($li);
    };

    for (timestamp in saves) {
        switch (saves[timestamp].type) {
            case 'user':
            addToSelectionList(timestamp, saves[timestamp], 'green', 'YOUR SAVE');
            break;
            case 'auto':
            addToSelectionList(timestamp, saves[timestamp], 'orange', 'AUTO-SAVED');
            break;
        }
    }

    $('#loadnosaves').off().on('mouseup', function() {
        callback(null);
        _Dialogs.CloseDialog(); //close now
    });

    //show dialog
    _Dialogs.ShowDialog('savedgameselector');
};
/**
 * Object which wraps all functionality specific to handling game save states
 * @type {Object}
 */
var cesSavesManager = (function (_config, _Compression, _Sync, _gameKey, _initialSaveData) {

    var self = this;
    var _savesData = {};
    var _timestamps = [];
    var _currentlyWrittenSaveData = {};

    this.AddSave = function(saveType, screenDataUnzipped, stateDataUnzipped, callback) {

        AddSaveToServer(saveType, screenDataUnzipped, stateDataUnzipped, function (response) {
            
            //data coming back is formatted to help
            if (response.hasOwnProperty('data') && response.hasOwnProperty('pruned')) {

                //the server controls the maximum number of saves. if over the max, it will return the timestamp to delete (usually the oldest save)
                if (response.pruned) {
                    delete _savesData[parseInt(response.pruned, 10)];
                }

                //add save to local store, only do it after successful server response (using server timestamp)
                AddSave(saveType, response.data.timestamp, screenDataUnzipped, stateDataUnzipped);
            }

            if (callback) {
                callback();
            }
        })
    };

    this.GetMostRecentSaves = function(count, type) {

        result = {};
        for (var i = 0, len = _timestamps.length; i < len && i < count; ++i) {
            
            if (type && type != _savesData[_timestamps[i]].type) {
                continue;
            }

            result[_timestamps[i]] = {
                save: _savesData[_timestamps[i]],
                i: i,
                total: len
            }
        }
        return result;
    };

    //returns the state of how close we are to maximum saves for this game. returned as string or null
    this.MaximumSavesCheck = function() {

        if (_timestamps.length >= _config.maxSavesPerGame) {
            return 'max';
        }
        if (_timestamps.length >= (_config.maxSavesPerGame - (_config.maxSavesPerGame * 0.2))) {
            return 'near';
        }
        return null;
    };

    this.GetState = function(timestamp, callback) {

        //two possibilities here, we either have the state data already or we need to go and get it
        if (!_savesData.hasOwnProperty(timestamp)) {
            callback('The property ' + timestamp + ' does not exist in client-stored save data');
            return;
        }

        if (_savesData[timestamp].state) {
            callback(null, _savesData[timestamp].state);
            return;
        }
        //don't have it! go and get it
        $.ajax({
            url: '/saves?_=' + timestamp, //we'll attach userid to the lookup for extra security
            contentType: 'text/plain',
            type: 'GET'
        })
        .done(function(data) {
            if (data.error) {
                callback(data.error);
                return;
            }

            if (callback && data.state) {

                var stateDataUnzipped = _Compression.Unzip.bytearray(data.state);

                //now that we have it, append it to the existing local data
                _savesData[timestamp].state = stateDataUnzipped;

                callback(null, stateDataUnzipped);
            }
        });
    };  

    var AddSave = function(type, timestamp, screenDataUnzipped, stateDataUnzipped) {

        timestamp = parseInt(timestamp, 10);
        var time = $.format.date(timestamp, 'MMM D h:mm:ss a'); //using the jquery dateFormat plugin

        _savesData[timestamp] = {
            screenshot: screenDataUnzipped,
            state: stateDataUnzipped,
            time: time,
            timestamp: timestamp,
            type: type
        };

        _timestamps.push(timestamp); //store timestamps separately for sorting

        //newest to oldest
        _timestamps.sort(function(a, b) {
          return b - a;
        });
    };


    var AddSaveToServer = function(type, screenDataUnzipped, stateDataUnzipped, callback) {

        //compression screen
        var screenDataZipped = _Compression.Zip.bytearray(screenDataUnzipped);
        var stateDataZipped = _Compression.Zip.bytearray(stateDataUnzipped);

        var url = '/saves?gk=' + encodeURIComponent(_gameKey.gk);
        var data = {
            'state': stateDataZipped,
            'screenshot': screenDataZipped,
            'type': type,
            'timestamp': Date.now() //now because this is the moment the player (with timezone) understands when they saved
        };

        _Sync.Post(url, data, (response) => {
            callback(response);
        });
    };

    var Constructor = (function() {

        if (_initialSaveData) {

            for (var i = 0, len = _initialSaveData.length; i < len; ++i) {
                var item = _initialSaveData[i];
                
                //sanity check for all expected initial save properties
                if (item.type && item.screenshot && item.timestamp) {

                    var screenDataUnzipped  = _Compression.Unzip.bytearray(item.screenshot);

                    AddSave(item.type, item.timestamp, screenDataUnzipped, null);
                }
            }
        }


    })();
    
});

var cesSliders = (function() {

    // private members

    var self = this;
    

    //public methods

    /**
     * go through list of silder controls and seek the correct one to open. if open, then close.
     * @param  {string} key
     * @return {undef}
     */
    // this.Open = function(key, stayopen) {

    //     if (this._animating) {
    //         return;
    //     }


    //     stayopen = stayopen || false; //if true and open, stay open. if false, will close if open
    //     this._animating = true;

    //     $('#gamecontrolslist li').each(function(index, item) {

    //         var slider = $('#' + $(this).attr('class'));

    //         //if match found
    //         if ($(item).hasClass(key)) {

    //             /**
    //              * a quick anon function to toggle the slider intended
    //              * @return {undef}
    //              */
    //             var selfToggle = function() {
    //                 setTimeout(function() {
    //                     self._toggle(item, slider, function() {
    //                         self._animating = false;
    //                     });
    //                 }, self._animationRate);
    //             };

    //             //if closed, open
    //             if ($(slider).hasClass('closed')) {
    //                 $(slider).removeClass('closed');
    //                 selfToggle();
    //             } else {
    //                 //already open
    //                 //should I stay open?
    //                 if (!stayopen) {
    //                     $(slider).addClass('closed');
    //                     selfToggle();
    //                 } else {
    //                     //stay open
    //                     self._animating = false;
    //                 }
    //             }
    //         } else {
    //             //others in list
    //             //if does not have class closed, its open, close it. else case is has closed
    //             if (!$(slider).hasClass('closed')) {
    //                 $(slider).addClass('closed');
    //                 self._toggle(item, slider);
    //             }
    //         }

    //     });
    // };

    /**
     * closes all sliders by asking to open one that does not exist
     * @return {undef}
     */
    // this.Closeall = function() {

    //     this.Open('');

    //     //since nothing is opening, we need to turn off the animation flag when all are closed
    //     setTimeout(function() {
    //         self._animating = false;
    //     }, self._animationRate);
    // };

    // private methods

    /**
     * toggle simply changes the state of the slider, if open then close, if closed, then open. controled only by this class
     * @param  {Object} li     list dom element, or button
     * @param  {Object} slider div dom element which is the sliding panel
     * @return {undef}
     */
    // var Toggle = function(li, slider, callback) {


    //     callback = callback || null;

    //     //toggle dom with id of this class name (which is the sliding element)
    //     $(slider).animate({width: 'toggle', padding: 'toggle'}, self._animationRate, function() {
    //         if (callback) {
    //             callback();
    //         }
    //     });

    //     if ($(li).attr('data-click-state') == 0) {
    //         $(li).attr('data-click-state', 1);
    //         $(li).find('img').animateRotate(0, 90, self._animationRate);

    //     } else {
    //         $(li).attr('data-click-state', 0);
    //         $(li).find('img').animateRotate(90, 0, self._animationRate);
    //     }
    // };

    /**
     * bind events to dom elements
     * @return {undef}
     */
    // var Bind = function() {



    //     $('#gamecontrolslist li')
    //     .on('mousedown mouseup click', function(event) {
    //         event.preventDefault();
    //         $('#emulator').focus();
    //     })
    //     .on('mouseup', function(event) {

    //         self.open($(this).attr('class'));
    //     });
    // };

    return this;

});
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSuggestions = (function(config, _Compression, PlayGame, $wrapper) {

    //private members
    var self = this;
    var _grid = null;
    var _BOXSIZE = 120;
    var _lastRecipe = null;
    var _currentGameLinks = [];
    var _loading = false;
    var _allowMore = false;

    this.Load = function(recipe, allowMore, callback, opt_canned) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;
        _allowMore = (allowMore == true) ? true : false;

        if (_loading) {
            return;
        }

        _lastRecipe = {
            recipe: recipe,
            canned: opt_canned
        };
        _loading = true;

        Clear();
        Fetch(recipe, (err, suggestions) => {

            Build(suggestions, function() {

                _loading = false; 

                if (callback) {
                    callback();
                }
            })

        }, opt_canned);
    };

    this.LoadMore = function(callback) {

        if (!_lastRecipe || _loading || !_allowMore) {
            return;
        }

        Fetch(_lastRecipe.recipe, (err, suggestions) => {

            Build(suggestions, function() {

                _loading = false;

                if (callback) {
                    callback();
                }
            })

        }, _lastRecipe.canned);
    };

    var Fetch = function(recipe, callback, opt_canned) {

        //are we fetching a canned result?
        opt_canned = (opt_canned == true) ? true : false;

        if (opt_canned) {

            $.get('/suggest?rp=' + recipe, function(response) {
                response = _Compression.Out.json(response);
                callback(null, response);
            });
        } 
        else {
            var compressedRecipe = _Compression.Zip.json(recipe);

            $.post('/suggest', {
                'recipe': compressedRecipe

            }, function(response) {
                response = _Compression.Out.json(response);
                callback(null, response);
            });
        }
    };

    var Clear = function() {
        _grid.isotope('remove', _grid.children());

        //attempt to free mem
        for (var i = 0, len = _currentGameLinks.length; i < len; i++) {
            _currentGameLinks[i] = null;
        }
        _currentGameLinks = [];
    };

    var Build = function(suggestions, callback) {

        for (var i = 0; i < suggestions.length; ++i) {
            
            var gameKey = _Compression.Decompress.gamekey(suggestions[i].gk);

            //spawn new gamelink
            var gamelink = new cesGameLink(config, gameKey, _BOXSIZE, false, PlayGame);

            //create the grid item and insert it
            var $griditem = $('<div class="grid-item" />');
            $griditem.append(gamelink.GetDOM());
            
            _grid.isotope( 'insert', $griditem[0]);
        }

        //functionality for when each images loads
        _grid.find('img').imagesLoaded()
            .progress(function(imgLoad, image) {
                
                $(image.img).parent().removeClass('close');
                _grid.isotope('layout');
            })
            .done(function() {

                if (callback) {
                    callback();
                }
            });

        _currentGameLinks.push(gamelink);
    }

    //constructor
    var Constructor = (function() {

        //create grid
        _grid = $wrapper.isotope({
            itemSelector: '.grid-item'
        });

    })();

    return this;

});
/**
 * Object which wraps common functions related to player preferences, data that comes form the server initially but can be changed
 * @type {Object}
 */
var cesSync = (function(_config, _Compression) {

    //private members
    var _self = this;
    var _components = {};

    this.Post = function(url, body, callback) {

        body = body || {};
        body._c = body._c || {}; //component data
        var componentData = {};

        //before sending out post request, check sync to see if client wants to update server
        for (var key in _components) {
            if (_components[key].ready) {
                componentData[key] = _components[key].Outgoing(); //compress the json from the Outgoing function
            }
        }

        //append compressed component data to update server with
        body._c = componentData; //_Compression.Compress.json(componentData);
        compressedBody = _Compression.Compress.json(body);

        Request(url, 'POST', compressedBody, callback);
    };

    //delete type simply passes through
    this.Delete = function(url, callback) {

        Request(url, 'DELETE', null, callback);
    };

    //common assembly of request object before sending
    var Request = function(url, type, body, callback) {

        var request = {
            url: url,
            processData: false,
            contentType: 'text/plain',
            type: type
        };

        //if form body contains sync updates, add it to be process by the server
        if (body) {
            request.data = compressedBody;
            request.headers = {
                sync: 1
            }
        }
        
        $.ajax(request)
        .done(function(data) {
            
            //we handle decompression here, before dispatching
            var response = _Compression.Decompress.json(data);
            
            //component data in response
            if (response._c) {

                for (var key in _components) {
                    if (response._c[key]) {
                        _components[key].Incoming(response._c[key]);
                    }
                }
                delete response._c;
            }
            
            callback(response);
        });
    };

    this.RegisterComponent = function(key, syncObject) {

        //making assumption that sync component is correctly structured
        _components[key] = syncObject;
    };
    
});
/**
 Wrapper for tooltips
 Important not to pass in the $(selector) because you will have a subset at the time it was passed. needs to be live
 */
var cesTooltips = (function(config, tooltipSelector, tooltipContentSelector) {
    
    //private members
    var self = this;
    const alreadyProcessedSelector = '.tooltipstered';

    this.Any = function() {

        $(tooltipSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100
        });
    };

    this.AnyContent = function(opt_interactive) {

        $(tooltipContentSelector + ':not(' + alreadyProcessedSelector + ')').tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 100,
            interactive: opt_interactive || false
        });
    }

    //constructor
    var Constructor = (function() {
    })();

    return this;
});
/*!
 * imagesLoaded PACKAGED v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=0,o=i[n];e=e||[];for(var r=this._onceEvents&&this._onceEvents[t];o;){var s=r&&r[o];s&&(this.off(t,o),delete r[o]),o.apply(this,e),n+=s?0:1,o=i[n]}return this}},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}(window,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){var e=[];if(Array.isArray(t))e=t;else if("number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e}function o(t,e,r){return this instanceof o?("string"==typeof t&&(t=document.querySelectorAll(t)),this.elements=n(t),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(function(){this.check()}.bind(this))):new o(t,e,r)}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var h=t.jQuery,a=t.console;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&d[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var d={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(h=e,h.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});
/*!
 * Isotope PACKAGED v3.0.4
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * http://isotope.metafizzy.co
 * Copyright 2017 Metafizzy
 */

!function(t,e){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,function(t,e){"use strict";function i(i,s,a){function u(t,e,o){var n,s="$()."+i+'("'+e+'")';return t.each(function(t,u){var h=a.data(u,i);if(!h)return void r(i+" not initialized. Cannot call methods, i.e. "+s);var d=h[e];if(!d||"_"==e.charAt(0))return void r(s+" is not a valid method");var l=d.apply(h,o);n=void 0===n?l:n}),void 0!==n?n:t}function h(t,e){t.each(function(t,o){var n=a.data(o,i);n?(n.option(e),n._init()):(n=new s(o,e),a.data(o,i,n))})}a=a||e||t.jQuery,a&&(s.prototype.option||(s.prototype.option=function(t){a.isPlainObject(t)&&(this.options=a.extend(!0,this.options,t))}),a.fn[i]=function(t){if("string"==typeof t){var e=n.call(arguments,1);return u(this,t,e)}return h(this,t),this},o(a))}function o(t){!t||t&&t.bridget||(t.bridget=i)}var n=Array.prototype.slice,s=t.console,r="undefined"==typeof s?function(){}:function(t){s.error(t)};return o(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},o=i[t]=i[t]||[];return o.indexOf(e)==-1&&o.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},o=i[t]=i[t]||{};return o[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var o=i.indexOf(e);return o!=-1&&i.splice(o,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var o=0,n=i[o];e=e||[];for(var s=this._onceEvents&&this._onceEvents[t];n;){var r=s&&s[n];r&&(this.off(t,n),delete s[n]),n.apply(this,e),o+=r?0:1,n=i[o]}return this}},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("get-size/get-size",[],function(){return e()}):"object"==typeof module&&module.exports?module.exports=e():t.getSize=e()}(window,function(){"use strict";function t(t){var e=parseFloat(t),i=t.indexOf("%")==-1&&!isNaN(e);return i&&e}function e(){}function i(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0;e<h;e++){var i=u[e];t[i]=0}return t}function o(t){var e=getComputedStyle(t);return e||a("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),e}function n(){if(!d){d=!0;var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style.boxSizing="border-box";var i=document.body||document.documentElement;i.appendChild(e);var n=o(e);s.isBoxSizeOuter=r=200==t(n.width),i.removeChild(e)}}function s(e){if(n(),"string"==typeof e&&(e=document.querySelector(e)),e&&"object"==typeof e&&e.nodeType){var s=o(e);if("none"==s.display)return i();var a={};a.width=e.offsetWidth,a.height=e.offsetHeight;for(var d=a.isBorderBox="border-box"==s.boxSizing,l=0;l<h;l++){var f=u[l],c=s[f],m=parseFloat(c);a[f]=isNaN(m)?0:m}var p=a.paddingLeft+a.paddingRight,y=a.paddingTop+a.paddingBottom,g=a.marginLeft+a.marginRight,v=a.marginTop+a.marginBottom,_=a.borderLeftWidth+a.borderRightWidth,I=a.borderTopWidth+a.borderBottomWidth,z=d&&r,x=t(s.width);x!==!1&&(a.width=x+(z?0:p+_));var S=t(s.height);return S!==!1&&(a.height=S+(z?0:y+I)),a.innerWidth=a.width-(p+_),a.innerHeight=a.height-(y+I),a.outerWidth=a.width+g,a.outerHeight=a.height+v,a}}var r,a="undefined"==typeof console?e:function(t){console.error(t)},u=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"],h=u.length,d=!1;return s}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("desandro-matches-selector/matches-selector",e):"object"==typeof module&&module.exports?module.exports=e():t.matchesSelector=e()}(window,function(){"use strict";var t=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var o=e[i],n=o+"MatchesSelector";if(t[n])return n}}();return function(e,i){return e[t](i)}}),function(t,e){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["desandro-matches-selector/matches-selector"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("desandro-matches-selector")):t.fizzyUIUtils=e(t,t.matchesSelector)}(window,function(t,e){var i={};i.extend=function(t,e){for(var i in e)t[i]=e[i];return t},i.modulo=function(t,e){return(t%e+e)%e},i.makeArray=function(t){var e=[];if(Array.isArray(t))e=t;else if(t&&"object"==typeof t&&"number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e},i.removeFrom=function(t,e){var i=t.indexOf(e);i!=-1&&t.splice(i,1)},i.getParent=function(t,i){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,e(t,i))return t},i.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},i.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},i.filterFindElements=function(t,o){t=i.makeArray(t);var n=[];return t.forEach(function(t){if(t instanceof HTMLElement){if(!o)return void n.push(t);e(t,o)&&n.push(t);for(var i=t.querySelectorAll(o),s=0;s<i.length;s++)n.push(i[s])}}),n},i.debounceMethod=function(t,e,i){var o=t.prototype[e],n=e+"Timeout";t.prototype[e]=function(){var t=this[n];t&&clearTimeout(t);var e=arguments,s=this;this[n]=setTimeout(function(){o.apply(s,e),delete s[n]},i||100)}},i.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},i.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var o=t.console;return i.htmlInit=function(e,n){i.docReady(function(){var s=i.toDashed(n),r="data-"+s,a=document.querySelectorAll("["+r+"]"),u=document.querySelectorAll(".js-"+s),h=i.makeArray(a).concat(i.makeArray(u)),d=r+"-options",l=t.jQuery;h.forEach(function(t){var i,s=t.getAttribute(r)||t.getAttribute(d);try{i=s&&JSON.parse(s)}catch(a){return void(o&&o.error("Error parsing "+r+" on "+t.className+": "+a))}var u=new e(t,i);l&&l.data(t,n,u)})})},i}),function(t,e){"function"==typeof define&&define.amd?define("outlayer/item",["ev-emitter/ev-emitter","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("ev-emitter"),require("get-size")):(t.Outlayer={},t.Outlayer.Item=e(t.EvEmitter,t.getSize))}(window,function(t,e){"use strict";function i(t){for(var e in t)return!1;return e=null,!0}function o(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}function n(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}var s=document.documentElement.style,r="string"==typeof s.transition?"transition":"WebkitTransition",a="string"==typeof s.transform?"transform":"WebkitTransform",u={WebkitTransition:"webkitTransitionEnd",transition:"transitionend"}[r],h={transform:a,transition:r,transitionDuration:r+"Duration",transitionProperty:r+"Property",transitionDelay:r+"Delay"},d=o.prototype=Object.create(t.prototype);d.constructor=o,d._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},d.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},d.getSize=function(){this.size=e(this.element)},d.css=function(t){var e=this.element.style;for(var i in t){var o=h[i]||i;e[o]=t[i]}},d.getPosition=function(){var t=getComputedStyle(this.element),e=this.layout._getOption("originLeft"),i=this.layout._getOption("originTop"),o=t[e?"left":"right"],n=t[i?"top":"bottom"],s=this.layout.size,r=o.indexOf("%")!=-1?parseFloat(o)/100*s.width:parseInt(o,10),a=n.indexOf("%")!=-1?parseFloat(n)/100*s.height:parseInt(n,10);r=isNaN(r)?0:r,a=isNaN(a)?0:a,r-=e?s.paddingLeft:s.paddingRight,a-=i?s.paddingTop:s.paddingBottom,this.position.x=r,this.position.y=a},d.layoutPosition=function(){var t=this.layout.size,e={},i=this.layout._getOption("originLeft"),o=this.layout._getOption("originTop"),n=i?"paddingLeft":"paddingRight",s=i?"left":"right",r=i?"right":"left",a=this.position.x+t[n];e[s]=this.getXValue(a),e[r]="";var u=o?"paddingTop":"paddingBottom",h=o?"top":"bottom",d=o?"bottom":"top",l=this.position.y+t[u];e[h]=this.getYValue(l),e[d]="",this.css(e),this.emitEvent("layout",[this])},d.getXValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&!e?t/this.layout.size.width*100+"%":t+"px"},d.getYValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&e?t/this.layout.size.height*100+"%":t+"px"},d._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=parseInt(t,10),s=parseInt(e,10),r=n===this.position.x&&s===this.position.y;if(this.setPosition(t,e),r&&!this.isTransitioning)return void this.layoutPosition();var a=t-i,u=e-o,h={};h.transform=this.getTranslate(a,u),this.transition({to:h,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},d.getTranslate=function(t,e){var i=this.layout._getOption("originLeft"),o=this.layout._getOption("originTop");return t=i?t:-t,e=o?e:-e,"translate3d("+t+"px, "+e+"px, 0)"},d.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},d.moveTo=d._transitionTo,d.setPosition=function(t,e){this.position.x=parseInt(t,10),this.position.y=parseInt(e,10)},d._nonTransition=function(t){this.css(t.to),t.isCleaning&&this._removeStyles(t.to);for(var e in t.onTransitionEnd)t.onTransitionEnd[e].call(this)},d.transition=function(t){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(t);var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);var o=this.element.offsetHeight;o=null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0};var l="opacity,"+n(a);d.enableTransition=function(){if(!this.isTransitioning){var t=this.layout.options.transitionDuration;t="number"==typeof t?t+"ms":t,this.css({transitionProperty:l,transitionDuration:t,transitionDelay:this.staggerDelay||0}),this.element.addEventListener(u,this,!1)}},d.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},d.onotransitionend=function(t){this.ontransitionend(t)};var f={"-webkit-transform":"transform"};d.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,o=f[t.propertyName]||t.propertyName;if(delete e.ingProperties[o],i(e.ingProperties)&&this.disableTransition(),o in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[o]),o in e.onEnd){var n=e.onEnd[o];n.call(this),delete e.onEnd[o]}this.emitEvent("transitionEnd",[this])}},d.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(u,this,!1),this.isTransitioning=!1},d._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var c={transitionProperty:"",transitionDuration:"",transitionDelay:""};return d.removeTransitionStyles=function(){this.css(c)},d.stagger=function(t){t=isNaN(t)?0:t,this.staggerDelay=t+"ms"},d.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},d.remove=function(){return r&&parseFloat(this.layout.options.transitionDuration)?(this.once("transitionEnd",function(){this.removeElem()}),void this.hide()):void this.removeElem()},d.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("visibleStyle");e[i]=this.onRevealTransitionEnd,this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0,onTransitionEnd:e})},d.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},d.getHideRevealTransitionEndProperty=function(t){var e=this.layout.options[t];if(e.opacity)return"opacity";for(var i in e)return i},d.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("hiddenStyle");e[i]=this.onHideTransitionEnd,this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:e})},d.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},d.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},o}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("outlayer/outlayer",["ev-emitter/ev-emitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(i,o,n,s){return e(t,i,o,n,s)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):t.Outlayer=e(t,t.EvEmitter,t.getSize,t.fizzyUIUtils,t.Outlayer.Item)}(window,function(t,e,i,o,n){"use strict";function s(t,e){var i=o.getQueryElement(t);if(!i)return void(u&&u.error("Bad element for "+this.constructor.namespace+": "+(i||t)));this.element=i,h&&(this.$element=h(this.element)),this.options=o.extend({},this.constructor.defaults),this.option(e);var n=++l;this.element.outlayerGUID=n,f[n]=this,this._create();var s=this._getOption("initLayout");s&&this.layout()}function r(t){function e(){t.apply(this,arguments)}return e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e}function a(t){if("number"==typeof t)return t;var e=t.match(/(^\d*\.?\d*)(\w*)/),i=e&&e[1],o=e&&e[2];if(!i.length)return 0;i=parseFloat(i);var n=m[o]||1;return i*n}var u=t.console,h=t.jQuery,d=function(){},l=0,f={};s.namespace="outlayer",s.Item=n,s.defaults={containerStyle:{position:"relative"},initLayout:!0,originLeft:!0,originTop:!0,resize:!0,resizeContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}};var c=s.prototype;o.extend(c,e.prototype),c.option=function(t){o.extend(this.options,t)},c._getOption=function(t){var e=this.constructor.compatOptions[t];return e&&void 0!==this.options[e]?this.options[e]:this.options[t]},s.compatOptions={initLayout:"isInitLayout",horizontal:"isHorizontal",layoutInstant:"isLayoutInstant",originLeft:"isOriginLeft",originTop:"isOriginTop",resize:"isResizeBound",resizeContainer:"isResizingContainer"},c._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),o.extend(this.element.style,this.options.containerStyle);var t=this._getOption("resize");t&&this.bindResize()},c.reloadItems=function(){this.items=this._itemize(this.element.children)},c._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0;n<e.length;n++){var s=e[n],r=new i(s,this);o.push(r)}return o},c._filterFindItemElements=function(t){return o.filterFindElements(t,this.options.itemSelector)},c.getItemElements=function(){return this.items.map(function(t){return t.element})},c.layout=function(){this._resetLayout(),this._manageStamps();var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;this.layoutItems(this.items,e),this._isLayoutInited=!0},c._init=c.layout,c._resetLayout=function(){this.getSize()},c.getSize=function(){this.size=i(this.element)},c._getMeasurement=function(t,e){var o,n=this.options[t];n?("string"==typeof n?o=this.element.querySelector(n):n instanceof HTMLElement&&(o=n),this[t]=o?i(o)[e]:n):this[t]=0},c.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},c._getItemsForLayout=function(t){return t.filter(function(t){return!t.isIgnored})},c._layoutItems=function(t,e){if(this._emitCompleteOnItems("layout",t),t&&t.length){var i=[];t.forEach(function(t){var o=this._getItemLayoutPosition(t);o.item=t,o.isInstant=e||t.isLayoutInstant,i.push(o)},this),this._processLayoutQueue(i)}},c._getItemLayoutPosition=function(){return{x:0,y:0}},c._processLayoutQueue=function(t){this.updateStagger(),t.forEach(function(t,e){this._positionItem(t.item,t.x,t.y,t.isInstant,e)},this)},c.updateStagger=function(){var t=this.options.stagger;return null===t||void 0===t?void(this.stagger=0):(this.stagger=a(t),this.stagger)},c._positionItem=function(t,e,i,o,n){o?t.goTo(e,i):(t.stagger(n*this.stagger),t.moveTo(e,i))},c._postLayout=function(){this.resizeContainer()},c.resizeContainer=function(){var t=this._getOption("resizeContainer");if(t){var e=this._getContainerSize();e&&(this._setContainerMeasure(e.width,!0),this._setContainerMeasure(e.height,!1))}},c._getContainerSize=d,c._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},c._emitCompleteOnItems=function(t,e){function i(){n.dispatchEvent(t+"Complete",null,[e])}function o(){r++,r==s&&i()}var n=this,s=e.length;if(!e||!s)return void i();var r=0;e.forEach(function(e){e.once(t,o)})},c.dispatchEvent=function(t,e,i){var o=e?[e].concat(i):i;if(this.emitEvent(t,o),h)if(this.$element=this.$element||h(this.element),e){var n=h.Event(e);n.type=t,this.$element.trigger(n,i)}else this.$element.trigger(t,i)},c.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},c.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},c.stamp=function(t){t=this._find(t),t&&(this.stamps=this.stamps.concat(t),t.forEach(this.ignore,this))},c.unstamp=function(t){t=this._find(t),t&&t.forEach(function(t){o.removeFrom(this.stamps,t),this.unignore(t)},this)},c._find=function(t){if(t)return"string"==typeof t&&(t=this.element.querySelectorAll(t)),t=o.makeArray(t)},c._manageStamps=function(){this.stamps&&this.stamps.length&&(this._getBoundingRect(),this.stamps.forEach(this._manageStamp,this))},c._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},c._manageStamp=d,c._getElementOffset=function(t){var e=t.getBoundingClientRect(),o=this._boundingRect,n=i(t),s={left:e.left-o.left-n.marginLeft,top:e.top-o.top-n.marginTop,right:o.right-e.right-n.marginRight,bottom:o.bottom-e.bottom-n.marginBottom};return s},c.handleEvent=o.handleEvent,c.bindResize=function(){t.addEventListener("resize",this),this.isResizeBound=!0},c.unbindResize=function(){t.removeEventListener("resize",this),this.isResizeBound=!1},c.onresize=function(){this.resize()},o.debounceMethod(s,"onresize",100),c.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},c.needsResizeLayout=function(){var t=i(this.element),e=this.size&&t;return e&&t.innerWidth!==this.size.innerWidth},c.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},c.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},c.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},c.reveal=function(t){if(this._emitCompleteOnItems("reveal",t),t&&t.length){var e=this.updateStagger();t.forEach(function(t,i){t.stagger(i*e),t.reveal()})}},c.hide=function(t){if(this._emitCompleteOnItems("hide",t),t&&t.length){var e=this.updateStagger();t.forEach(function(t,i){t.stagger(i*e),t.hide()})}},c.revealItemElements=function(t){var e=this.getItems(t);this.reveal(e)},c.hideItemElements=function(t){var e=this.getItems(t);this.hide(e)},c.getItem=function(t){for(var e=0;e<this.items.length;e++){var i=this.items[e];if(i.element==t)return i}},c.getItems=function(t){t=o.makeArray(t);var e=[];return t.forEach(function(t){var i=this.getItem(t);i&&e.push(i)},this),e},c.remove=function(t){var e=this.getItems(t);this._emitCompleteOnItems("remove",e),e&&e.length&&e.forEach(function(t){t.remove(),o.removeFrom(this.items,t)},this)},c.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="",this.items.forEach(function(t){t.destroy()}),this.unbindResize();var e=this.element.outlayerGUID;delete f[e],delete this.element.outlayerGUID,h&&h.removeData(this.element,this.constructor.namespace)},s.data=function(t){t=o.getQueryElement(t);var e=t&&t.outlayerGUID;return e&&f[e]},s.create=function(t,e){var i=r(s);return i.defaults=o.extend({},s.defaults),o.extend(i.defaults,e),i.compatOptions=o.extend({},s.compatOptions),i.namespace=t,i.data=s.data,i.Item=r(n),o.htmlInit(i,t),h&&h.bridget&&h.bridget(t,i),i};var m={ms:1,s:1e3};return s.Item=n,s}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/item",["outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window,function(t){"use strict";function e(){t.Item.apply(this,arguments)}var i=e.prototype=Object.create(t.Item.prototype),o=i._create;i._create=function(){this.id=this.layout.itemGUID++,o.call(this),this.sortData={}},i.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}};var n=i.destroy;return i.destroy=function(){n.apply(this,arguments),this.css({display:""})},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("get-size"),require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window,function(t,e){"use strict";function i(t){this.isotope=t,t&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}var o=i.prototype,n=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout","_getOption"];return n.forEach(function(t){o[t]=function(){return e.prototype[t].apply(this.isotope,arguments)}}),o.needsVerticalResizeLayout=function(){var e=t(this.isotope.element),i=this.isotope.size&&e;return i&&e.innerHeight!=this.isotope.size.innerHeight},o._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},o.getColumnWidth=function(){this.getSegmentSize("column","Width")},o.getRowHeight=function(){this.getSegmentSize("row","Height")},o.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},o.getFirstItemSize=function(){var e=this.isotope.filteredItems[0];return e&&e.element&&t(e.element)},o.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},o.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},i.modes={},i.create=function(t,e){function n(){i.apply(this,arguments)}return n.prototype=Object.create(o),n.prototype.constructor=n,e&&(n.options=e),n.prototype.namespace=t,i.modes[t]=n,n},i}),function(t,e){"function"==typeof define&&define.amd?define("masonry/masonry",["outlayer/outlayer","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer"),require("get-size")):t.Masonry=e(t.Outlayer,t.getSize)}(window,function(t,e){var i=t.create("masonry");i.compatOptions.fitWidth="isFitWidth";var o=i.prototype;return o._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns(),this.colYs=[];for(var t=0;t<this.cols;t++)this.colYs.push(0);this.maxY=0,this.horizontalColIndex=0},o.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}var o=this.columnWidth+=this.gutter,n=this.containerWidth+this.gutter,s=n/o,r=o-n%o,a=r&&r<1?"round":"floor";s=Math[a](s),this.cols=Math.max(s,1)},o.getContainerWidth=function(){var t=this._getOption("fitWidth"),i=t?this.element.parentNode:this.element,o=e(i);this.containerWidth=o&&o.innerWidth},o._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,i=e&&e<1?"round":"ceil",o=Math[i](t.size.outerWidth/this.columnWidth);o=Math.min(o,this.cols);for(var n=this.options.horizontalOrder?"_getHorizontalColPosition":"_getTopColPosition",s=this[n](o,t),r={x:this.columnWidth*s.col,y:s.y},a=s.y+t.size.outerHeight,u=o+s.col,h=s.col;h<u;h++)this.colYs[h]=a;return r},o._getTopColPosition=function(t){var e=this._getTopColGroup(t),i=Math.min.apply(Math,e);return{col:e.indexOf(i),y:i}},o._getTopColGroup=function(t){if(t<2)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;o<i;o++)e[o]=this._getColGroupY(o,t);return e},o._getColGroupY=function(t,e){if(e<2)return this.colYs[t];var i=this.colYs.slice(t,t+e);return Math.max.apply(Math,i)},o._getHorizontalColPosition=function(t,e){var i=this.horizontalColIndex%this.cols,o=t>1&&i+t>this.cols;i=o?0:i;var n=e.size.outerWidth&&e.size.outerHeight;return this.horizontalColIndex=n?i+t:this.horizontalColIndex,{col:i,y:this._getColGroupY(i,t)}},o._manageStamp=function(t){var i=e(t),o=this._getElementOffset(t),n=this._getOption("originLeft"),s=n?o.left:o.right,r=s+i.outerWidth,a=Math.floor(s/this.columnWidth);a=Math.max(0,a);var u=Math.floor(r/this.columnWidth);u-=r%this.columnWidth?0:1,u=Math.min(this.cols-1,u);for(var h=this._getOption("originTop"),d=(h?o.top:o.bottom)+i.outerHeight,l=a;l<=u;l++)this.colYs[l]=Math.max(d,this.colYs[l])},o._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this._getOption("fitWidth")&&(t.width=this._getContainerFitWidth()),t},o._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},o.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!=this.containerWidth},i}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode"),require("masonry-layout")):e(t.Isotope.LayoutMode,t.Masonry)}(window,function(t,e){"use strict";var i=t.create("masonry"),o=i.prototype,n={_getElementOffset:!0,layout:!0,_getMeasurement:!0};for(var s in e.prototype)n[s]||(o[s]=e.prototype[s]);var r=o.measureColumns;o.measureColumns=function(){this.items=this.isotope.filteredItems,r.call(this)};var a=o._getOption;return o._getOption=function(t){return"fitWidth"==t?void 0!==this.options.isFitWidth?this.options.isFitWidth:this.options.fitWidth:a.apply(this.isotope,arguments)},i}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/fit-rows",["../layout-mode"],e):"object"==typeof exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("fitRows"),i=e.prototype;return i._resetLayout=function(){this.x=0,this.y=0,this.maxY=0,this._getMeasurement("gutter","outerWidth")},i._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth+this.gutter,i=this.isotope.size.innerWidth+this.gutter;0!==this.x&&e+this.x>i&&(this.x=0,this.y=this.maxY);var o={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=e,o},i._getContainerSize=function(){return{height:this.maxY}},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/vertical",["../layout-mode"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("vertical",{horizontalAlignment:0}),i=e.prototype;return i._resetLayout=function(){this.y=0},i._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},i._getContainerSize=function(){return{height:this.y}},e}),function(t,e){"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","desandro-matches-selector/matches-selector","fizzy-ui-utils/utils","isotope/js/item","isotope/js/layout-mode","isotope/js/layout-modes/masonry","isotope/js/layout-modes/fit-rows","isotope/js/layout-modes/vertical"],function(i,o,n,s,r,a){return e(t,i,o,n,s,r,a)}):"object"==typeof module&&module.exports?module.exports=e(t,require("outlayer"),require("get-size"),require("desandro-matches-selector"),require("fizzy-ui-utils"),require("isotope/js/item"),require("isotope/js/layout-mode"),require("isotope/js/layout-modes/masonry"),require("isotope/js/layout-modes/fit-rows"),require("isotope/js/layout-modes/vertical")):t.Isotope=e(t,t.Outlayer,t.getSize,t.matchesSelector,t.fizzyUIUtils,t.Isotope.Item,t.Isotope.LayoutMode)}(window,function(t,e,i,o,n,s,r){function a(t,e){return function(i,o){for(var n=0;n<t.length;n++){var s=t[n],r=i.sortData[s],a=o.sortData[s];if(r>a||r<a){var u=void 0!==e[s]?e[s]:e,h=u?1:-1;return(r>a?1:-1)*h}}return 0}}var u=t.jQuery,h=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},d=e.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});d.Item=s,d.LayoutMode=r;var l=d.prototype;l._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),e.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var t in r.modes)this._initLayoutMode(t)},l.reloadItems=function(){this.itemGUID=0,e.prototype.reloadItems.call(this)},l._itemize=function(){for(var t=e.prototype._itemize.apply(this,arguments),i=0;i<t.length;i++){var o=t[i];o.id=this.itemGUID++}return this._updateItemsSortData(t),t},l._initLayoutMode=function(t){var e=r.modes[t],i=this.options[t]||{};this.options[t]=e.options?n.extend(e.options,i):i,this.modes[t]=new e(this)},l.layout=function(){return!this._isLayoutInited&&this._getOption("initLayout")?void this.arrange():void this._layout()},l._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},l.arrange=function(t){this.option(t),this._getIsInstant();var e=this._filter(this.items);this.filteredItems=e.matches,this._bindArrangeComplete(),this._isInstant?this._noTransition(this._hideReveal,[e]):this._hideReveal(e),this._sort(),this._layout()},l._init=l.arrange,l._hideReveal=function(t){this.reveal(t.needReveal),this.hide(t.needHide)},l._getIsInstant=function(){var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;return this._isInstant=e,e},l._bindArrangeComplete=function(){function t(){e&&i&&o&&n.dispatchEvent("arrangeComplete",null,[n.filteredItems])}var e,i,o,n=this;this.once("layoutComplete",function(){e=!0,t()}),this.once("hideComplete",function(){i=!0,t()}),this.once("revealComplete",function(){o=!0,t()})},l._filter=function(t){var e=this.options.filter;e=e||"*";for(var i=[],o=[],n=[],s=this._getFilterTest(e),r=0;r<t.length;r++){var a=t[r];if(!a.isIgnored){var u=s(a);u&&i.push(a),u&&a.isHidden?o.push(a):u||a.isHidden||n.push(a)}}return{matches:i,needReveal:o,needHide:n}},l._getFilterTest=function(t){return u&&this.options.isJQueryFiltering?function(e){return u(e.element).is(t)}:"function"==typeof t?function(e){return t(e.element)}:function(e){return o(e.element,t)}},l.updateSortData=function(t){
var e;t?(t=n.makeArray(t),e=this.getItems(t)):e=this.items,this._getSorters(),this._updateItemsSortData(e)},l._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=f(i)}},l._updateItemsSortData=function(t){for(var e=t&&t.length,i=0;e&&i<e;i++){var o=t[i];o.updateSortData()}};var f=function(){function t(t){if("string"!=typeof t)return t;var i=h(t).split(" "),o=i[0],n=o.match(/^\[(.+)\]$/),s=n&&n[1],r=e(s,o),a=d.sortDataParsers[i[1]];return t=a?function(t){return t&&a(r(t))}:function(t){return t&&r(t)}}function e(t,e){return t?function(e){return e.getAttribute(t)}:function(t){var i=t.querySelector(e);return i&&i.textContent}}return t}();d.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},l._sort=function(){if(this.options.sortBy){var t=n.makeArray(this.options.sortBy);this._getIsSameSortBy(t)||(this.sortHistory=t.concat(this.sortHistory));var e=a(this.sortHistory,this.options.sortAscending);this.filteredItems.sort(e)}},l._getIsSameSortBy=function(t){for(var e=0;e<t.length;e++)if(t[e]!=this.sortHistory[e])return!1;return!0},l._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw new Error("No layout mode: "+t);return e.options=this.options[t],e},l._resetLayout=function(){e.prototype._resetLayout.call(this),this._mode()._resetLayout()},l._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},l._manageStamp=function(t){this._mode()._manageStamp(t)},l._getContainerSize=function(){return this._mode()._getContainerSize()},l.needsResizeLayout=function(){return this._mode().needsResizeLayout()},l.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},l.prepended=function(t){var e=this._itemize(t);if(e.length){this._resetLayout(),this._manageStamps();var i=this._filterRevealAdded(e);this.layoutItems(this.filteredItems),this.filteredItems=i.concat(this.filteredItems),this.items=e.concat(this.items)}},l._filterRevealAdded=function(t){var e=this._filter(t);return this.hide(e.needHide),this.reveal(e.matches),this.layoutItems(e.matches,!0),e.matches},l.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;i<n;i++)o=e[i],this.element.appendChild(o.element);var s=this._filter(e).matches;for(i=0;i<n;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;i<n;i++)delete e[i].isLayoutInstant;this.reveal(s)}};var c=l.remove;return l.remove=function(t){t=n.makeArray(t);var e=this.getItems(t);c.call(this,t);for(var i=e&&e.length,o=0;i&&o<i;o++){var s=e[o];n.removeFrom(this.filteredItems,s)}},l.shuffle=function(){for(var t=0;t<this.items.length;t++){var e=this.items[t];e.sortData.random=Math.random()}this.options.sortBy="random",this._sort(),this._layout()},l._noTransition=function(t,e){var i=this.options.transitionDuration;this.options.transitionDuration=0;var o=t.apply(this,e);return this.options.transitionDuration=i,o},l.getFilteredItemElements=function(){return this.filteredItems.map(function(t){return t.element})},d});
// jQuery autoComplete v1.0.7
// https://github.com/Pixabay/jQuery-autoComplete
!function(e){e.fn.autoComplete=function(t){var o=e.extend({},e.fn.autoComplete.defaults,t);return"string"==typeof t?(this.each(function(){var o=e(this);"destroy"==t&&(e(window).off("resize.autocomplete",o.updateSC),o.off("blur.autocomplete focus.autocomplete keydown.autocomplete keyup.autocomplete"),o.data("autocomplete")?o.attr("autocomplete",o.data("autocomplete")):o.removeAttr("autocomplete"),e(o.data("sc")).remove(),o.removeData("sc").removeData("autocomplete"))}),this):this.each(function(){function t(e){var t=s.val();if(s.cache[t]=e,e.length&&t.length>=o.minChars){for(var a="",c=0;c<e.length;c++)a+=o.renderItem(e[c],t);s.sc.html(a),s.updateSC(0)}else s.sc.hide()}var s=e(this);s.sc=e('<div class="autocomplete-suggestions '+o.menuClass+'"></div>'),s.data("sc",s.sc).data("autocomplete",s.attr("autocomplete")),s.attr("autocomplete","off"),s.cache={},s.last_val="",s.updateSC=function(t,o){if(s.sc.css({top:s.offset().top+s.outerHeight(),left:s.offset().left,width:s.outerWidth()}),!t&&(s.sc.show(),s.sc.maxHeight||(s.sc.maxHeight=parseInt(s.sc.css("max-height"))),s.sc.suggestionHeight||(s.sc.suggestionHeight=e(".autocomplete-suggestion",s.sc).first().outerHeight()),s.sc.suggestionHeight))if(o){var a=s.sc.scrollTop(),c=o.offset().top-s.sc.offset().top;c+s.sc.suggestionHeight-s.sc.maxHeight>0?s.sc.scrollTop(c+s.sc.suggestionHeight+a-s.sc.maxHeight):0>c&&s.sc.scrollTop(c+a)}else s.sc.scrollTop(0)},e(window).on("resize.autocomplete",s.updateSC),s.sc.appendTo("body"),s.sc.on("mouseleave",".autocomplete-suggestion",function(){e(".autocomplete-suggestion.selected").removeClass("selected")}),s.sc.on("mouseenter",".autocomplete-suggestion",function(){e(".autocomplete-suggestion.selected").removeClass("selected"),e(this).addClass("selected")}),s.sc.on("mousedown",".autocomplete-suggestion",function(t){var a=e(this),c=a.data("val");(c||a.hasClass("autocomplete-suggestion"))&&(s.val(c),o.onSelect(t,c,a),s.sc.hide())}),s.on("blur.autocomplete",function(){try{over_sb=e(".autocomplete-suggestions:hover").length}catch(t){over_sb=0}over_sb?s.is(":focus")||setTimeout(function(){s.focus()},20):(s.last_val=s.val(),s.sc.hide(),setTimeout(function(){s.sc.hide()},350))}),o.minChars||s.on("focus.autocomplete",function(){s.last_val="\n",s.trigger("keyup.autocomplete")}),s.on("keydown.autocomplete",function(t){if((40==t.which||38==t.which)&&s.sc.html()){var a,c=e(".autocomplete-suggestion.selected",s.sc);return c.length?(a=40==t.which?c.next(".autocomplete-suggestion"):c.prev(".autocomplete-suggestion"),a.length?(c.removeClass("selected"),s.val(a.addClass("selected").data("val"))):(c.removeClass("selected"),s.val(s.last_val),a=0)):(a=40==t.which?e(".autocomplete-suggestion",s.sc).first():e(".autocomplete-suggestion",s.sc).last(),s.val(a.addClass("selected").data("val"))),s.updateSC(0,a),!1}if(27==t.which)s.val(s.last_val).sc.hide();else if(13==t.which||9==t.which){var c=e(".autocomplete-suggestion.selected",s.sc);c.length&&s.sc.is(":visible")&&(o.onSelect(t,c.data("val"),c),setTimeout(function(){s.sc.hide()},20))}}),s.on("keyup.autocomplete",function(a){if(!~e.inArray(a.which,[13,27,35,36,37,38,39,40])){var c=s.val();if(c.length>=o.minChars){if(c!=s.last_val){if(s.last_val=c,clearTimeout(s.timer),o.cache){if(c in s.cache)return void t(s.cache[c]);for(var l=1;l<c.length-o.minChars;l++){var i=c.slice(0,c.length-l);if(i in s.cache&&!s.cache[i].length)return void t([])}}s.timer=setTimeout(function(){o.source(c,t)},o.delay)}}else s.last_val=c,s.sc.hide()}})})},e.fn.autoComplete.defaults={source:0,minChars:3,delay:150,cache:1,menuClass:"",renderItem:function(e,t){var o=new RegExp("("+t.split(" ").join("|")+")","gi");return'<div class="autocomplete-suggestion" data-val="'+e+'">'+e.replace(o,"<b>$1</b>")+"</div>"},onSelect:function(e,t,o){}}}(jQuery);
/*
jQuery BigText v1.3.0, May 2014

Usage:
$("#div").bigText({
	rotateText: {Number}, (null)
	fontSizeFactor: {Number}, (0.8)
	maximumFontSize: {Number}, (null)
	limitingDimension: {Number}, ("both")
	horizontalAlign: {String}, ("center")
	verticalAlign: {String}, ("center")
	textAlign: {String}, ("center")
});

https://github.com/DanielHoffmann/jquery-bigtext

Options:

rotateText: Rotates the text inside the element by X degrees.

fontSizeFactor: This option is used to give some vertical spacing for letters that overflow the line-height (like 'g', 'Á' and most other accentuated uppercase letters). This does not affect the font-size if the limiting factor is the width of the parent div. The default is 0.8

maximumFontSize: maximum font size to use.

limitingDimension: In which dimension the font size should be limited. Possible values: "width", "height" or "both". Defaults to both. Using this option with values different than "both" overwrites the element parent width or height.

horizontalAlign: Where to align the text horizontally. Possible values: "left", "center", "right". Defaults to "center".

verticalAlign: Where to align the text vertically. Possible values: "top", "center", "bottom". Defaults to "center".

textAlign: Sets the text align of the element. Possible values: "left", "center", "right". Defaults to "center". This option is only useful if there are linebreaks (<br> tags) inside the text.

whiteSpace: Sets whitespace handling. Possible values: "nowrap", "pre". Defaults to "nowrap". (Can also be set to enable wrapping but this doesn't work well.)

Copyright (C) 2013 Daniel Hoffmann Bernardes, Ícaro Technologies

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function($){
    "use strict";
    var defaultOptions= {
        rotateText: null,
        fontSizeFactor: 0.8,
        maximumFontSize: null,
        limitingDimension: "both",
        horizontalAlign: "center",
        verticalAlign: "center",
        textAlign: "center",
        whiteSpace: "nowrap"
    };

    $.fn.bigText= function(options) {
        return this.each(function() {
            options= $.extend({}, defaultOptions, options);
            var $this= $(this);
            var $parent= $this.parent();

            //hides the element to prevent "flashing"
            $this.css("visibility", "hidden");

            $this.css({
                display: "inline-block",
                clear: "both",
                'float': "left", //the need to set this is very odd, its due to margin-collapsing. See https://developer.mozilla.org/en-US/docs/Web/CSS/margin_collapsing
                'font-size': (1000 * options.fontSizeFactor) + "px",
                'line-height': "1000px",
                'white-space': options.whiteSpace,
                "text-align": options.textAlign,
                position: "relative",
                padding: 0,
                margin: 0,
                left: "50%",
                top: "50%"
            });

            var parentPadding= {
                left: parseInt($parent.css('padding-left')),
                top: parseInt($parent.css('padding-top')),
                right: parseInt($parent.css('padding-right')),
                bottom: parseInt($parent.css('padding-bottom'))
            };

            var box= {
                width: $this.outerWidth(),
                height: $this.outerHeight()
            };
            var rotateCSS= {}
            if (options.rotateText !== null) {
                if (typeof options.rotateText !== "number")
                    throw "bigText error: rotateText value must be a number";
                var rotate= "rotate(" + options.rotateText + "deg)";
                rotateCSS= {
                    "-webkit-transform": rotate,
                    "-ms-transform": rotate,
                    "-moz-transform": rotate,
                    "-o-transform": rotate,
                    "transform": rotate
                };
                $this.css(rotateCSS);
                //calculating bounding box of the rotated element
                var sin= Math.abs(Math.sin(options.rotateText * Math.PI / 180));
                var cos= Math.abs(Math.cos(options.rotateText * Math.PI / 180));
                box.width= $this.outerWidth() * cos + $this.outerHeight() * sin;
                box.height= $this.outerWidth() * sin + $this.outerHeight() * cos;
            }

            var widthFactor= ($parent.innerWidth() - parentPadding.left - parentPadding.right) / box.width;
            var heightFactor= ($parent.innerHeight() - parentPadding.top - parentPadding.bottom) / box.height;
            var lineHeight;

            if (options.limitingDimension.toLowerCase() === "width") {
                lineHeight= Math.floor(widthFactor * 1000);
                $parent.height(lineHeight);
            } else if (options.limitingDimension.toLowerCase() === "height") {
                lineHeight= Math.floor(heightFactor * 1000);
            } else if (widthFactor < heightFactor)
                lineHeight= Math.floor(widthFactor * 1000);
            else if (widthFactor >= heightFactor)
                lineHeight= Math.floor(heightFactor * 1000);

            var fontSize= lineHeight * options.fontSizeFactor;
            if (options.maximumFontSize !== null && fontSize > options.maximumFontSize) {
                fontSize= options.maximumFontSize;
                lineHeight= fontSize / options.fontSizeFactor;
            }


            $this.css({
                'font-size': Math.floor(fontSize)  + "px",
                'line-height': Math.ceil(lineHeight)  + "px",
                'margin-bottom': "0px",
                'margin-right': "0px"
            });

            if (options.limitingDimension.toLowerCase() === "height") {
                //this option needs the font-size to be set already so $this.width() returns the right size
                //this +4 is to compensate the rounding erros that can occur due to the calls to Math.floor in the centering code
                $parent.width(($this.width() + 4) + "px");
            }
            var endCSS= {};

            switch(options.verticalAlign.toLowerCase()) {
                case "top":
                    endCSS['top']= "0%";
                break;
                case "bottom":
                    endCSS['top']= "100%";
                    endCSS['margin-top']= Math.floor(-$this.innerHeight()) + "px";
                break;
                default:
                    endCSS['margin-top']= Math.floor((-$this.innerHeight() / 2)) + "px";
                break;
            }

            switch(options.horizontalAlign.toLowerCase()) {
                case "left":
                    endCSS['left']= "0%";
                break;
                case "right":
                    endCSS['left']= "100%";
                    endCSS['margin-left']= Math.floor(-$this.innerWidth()) + "px";
                break;
                default:
                    endCSS['margin-left']= Math.floor((-$this.innerWidth() / 2)) + "px";
                break;
            }


            $this.css(endCSS);
            //shows the element after the work is done
            $this.css("visibility", "visible");
        });
    }
})(jQuery);
/*! jquery-dateFormat 18-05-2015 */
var DateFormat={};!function(a){var b=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],c=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],d=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],e=["January","February","March","April","May","June","July","August","September","October","November","December"],f={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"},g=/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d{0,3}[Z\-+]?(\d{2}:?\d{2})?/;a.format=function(){function a(a){return b[parseInt(a,10)]||a}function h(a){return c[parseInt(a,10)]||a}function i(a){var b=parseInt(a,10)-1;return d[b]||a}function j(a){var b=parseInt(a,10)-1;return e[b]||a}function k(a){return f[a]||a}function l(a){var b,c,d,e,f,g=a,h="";return-1!==g.indexOf(".")&&(e=g.split("."),g=e[0],h=e[e.length-1]),f=g.split(":"),3===f.length?(b=f[0],c=f[1],d=f[2].replace(/\s.+/,"").replace(/[a-z]/gi,""),g=g.replace(/\s.+/,"").replace(/[a-z]/gi,""),{time:g,hour:b,minute:c,second:d,millis:h}):{time:"",hour:"",minute:"",second:"",millis:""}}function m(a,b){for(var c=b-String(a).length,d=0;c>d;d++)a="0"+a;return a}return{parseDate:function(a){var b,c,d={date:null,year:null,month:null,dayOfMonth:null,dayOfWeek:null,time:null};if("number"==typeof a)return this.parseDate(new Date(a));if("function"==typeof a.getFullYear)d.year=String(a.getFullYear()),d.month=String(a.getMonth()+1),d.dayOfMonth=String(a.getDate()),d.time=l(a.toTimeString()+"."+a.getMilliseconds());else if(-1!=a.search(g))b=a.split(/[T\+-]/),d.year=b[0],d.month=b[1],d.dayOfMonth=b[2],d.time=l(b[3].split(".")[0]);else switch(b=a.split(" "),6===b.length&&isNaN(b[5])&&(b[b.length]="()"),b.length){case 6:d.year=b[5],d.month=k(b[1]),d.dayOfMonth=b[2],d.time=l(b[3]);break;case 2:c=b[0].split("-"),d.year=c[0],d.month=c[1],d.dayOfMonth=c[2],d.time=l(b[1]);break;case 7:case 9:case 10:d.year=b[3],d.month=k(b[1]),d.dayOfMonth=b[2],d.time=l(b[4]);break;case 1:c=b[0].split(""),d.year=c[0]+c[1]+c[2]+c[3],d.month=c[5]+c[6],d.dayOfMonth=c[8]+c[9],d.time=l(c[13]+c[14]+c[15]+c[16]+c[17]+c[18]+c[19]+c[20]);break;default:return null}return d.date=d.time?new Date(d.year,d.month-1,d.dayOfMonth,d.time.hour,d.time.minute,d.time.second,d.time.millis):new Date(d.year,d.month-1,d.dayOfMonth),d.dayOfWeek=String(d.date.getDay()),d},date:function(b,c){try{var d=this.parseDate(b);if(null===d)return b;for(var e,f=d.year,g=d.month,k=d.dayOfMonth,l=d.dayOfWeek,n=d.time,o="",p="",q="",r=!1,s=0;s<c.length;s++){var t=c.charAt(s),u=c.charAt(s+1);if(r)"'"==t?(p+=""===o?"'":o,o="",r=!1):o+=t;else switch(o+=t,q="",o){case"ddd":p+=a(l),o="";break;case"dd":if("d"===u)break;p+=m(k,2),o="";break;case"d":if("d"===u)break;p+=parseInt(k,10),o="";break;case"D":k=1==k||21==k||31==k?parseInt(k,10)+"st":2==k||22==k?parseInt(k,10)+"nd":3==k||23==k?parseInt(k,10)+"rd":parseInt(k,10)+"th",p+=k,o="";break;case"MMMM":p+=j(g),o="";break;case"MMM":if("M"===u)break;p+=i(g),o="";break;case"MM":if("M"===u)break;p+=m(g,2),o="";break;case"M":if("M"===u)break;p+=parseInt(g,10),o="";break;case"y":case"yyy":if("y"===u)break;p+=o,o="";break;case"yy":if("y"===u)break;p+=String(f).slice(-2),o="";break;case"yyyy":p+=f,o="";break;case"HH":p+=m(n.hour,2),o="";break;case"H":if("H"===u)break;p+=parseInt(n.hour,10),o="";break;case"hh":e=0===parseInt(n.hour,10)?12:n.hour<13?n.hour:n.hour-12,p+=m(e,2),o="";break;case"h":if("h"===u)break;e=0===parseInt(n.hour,10)?12:n.hour<13?n.hour:n.hour-12,p+=parseInt(e,10),o="";break;case"mm":p+=m(n.minute,2),o="";break;case"m":if("m"===u)break;p+=n.minute,o="";break;case"ss":p+=m(n.second.substring(0,2),2),o="";break;case"s":if("s"===u)break;p+=n.second,o="";break;case"S":case"SS":if("S"===u)break;p+=o,o="";break;case"SSS":var v="000"+n.millis.substring(0,3);p+=v.substring(v.length-3),o="";break;case"a":p+=n.hour>=12?"PM":"AM",o="";break;case"p":p+=n.hour>=12?"p.m.":"a.m.",o="";break;case"E":p+=h(l),o="";break;case"'":o="",r=!0;break;default:p+=t,o=""}}return p+=q}catch(w){return console&&console.log&&console.log(w),b}},prettyDate:function(a){var b,c,d;return("string"==typeof a||"number"==typeof a)&&(b=new Date(a)),"object"==typeof a&&(b=new Date(a.toString())),c=((new Date).getTime()-b.getTime())/1e3,d=Math.floor(c/86400),isNaN(d)||0>d?void 0:60>c?"just now":120>c?"1 minute ago":3600>c?Math.floor(c/60)+" minutes ago":7200>c?"1 hour ago":86400>c?Math.floor(c/3600)+" hours ago":1===d?"Yesterday":7>d?d+" days ago":31>d?Math.ceil(d/7)+" weeks ago":d>=31?"more than 5 weeks ago":void 0},toBrowserTimeZone:function(a,b){return this.date(new Date(a),b||"MM/dd/yyyy HH:mm:ss")}}}()}(DateFormat),function(a){a.format=DateFormat.format}(jQuery);
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */
/*!
 * JavaScript Cookie v2.1.4
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader = false;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init (converter) {
		function api (key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				// We're using "expires" because "max-age" is not supported by IE
				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				var stringifiedAttributes = '';

				for (var attributeName in attributes) {
					if (!attributes[attributeName]) {
						continue;
					}
					stringifiedAttributes += '; ' + attributeName;
					if (attributes[attributeName] === true) {
						continue;
					}
					stringifiedAttributes += '=' + attributes[attributeName];
				}
				return (document.cookie = key + '=' + value + stringifiedAttributes);
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ?
						converter.read(cookie, name) : converter(cookie, name) ||
						cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api.call(api, key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));
/*!jQuery Knob*/
/**
 * Downward compatible, touchable dial
 *
 * Version: 1.2.12
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2012 Anthony Terrien
 * Under MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Thanks to vor, eskimoblood, spiffistan, FabrizioC
 */
(function (factory) {
    if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    /**
     * Kontrol library
     */
    "use strict";

    /**
     * Definition of globals and core
     */
    var k = {}, // kontrol
        max = Math.max,
        min = Math.min;

    k.c = {};
    k.c.d = $(document);
    k.c.t = function (e) {
        return e.originalEvent.touches.length - 1;
    };

    /**
     * Kontrol Object
     *
     * Definition of an abstract UI control
     *
     * Each concrete component must call this one.
     * <code>
     * k.o.call(this);
     * </code>
     */
    k.o = function () {
        var s = this;

        this.o = null; // array of options
        this.$ = null; // jQuery wrapped element
        this.i = null; // mixed HTMLInputElement or array of HTMLInputElement
        this.g = null; // deprecated 2D graphics context for 'pre-rendering'
        this.v = null; // value ; mixed array or integer
        this.cv = null; // change value ; not commited value
        this.x = 0; // canvas x position
        this.y = 0; // canvas y position
        this.w = 0; // canvas width
        this.h = 0; // canvas height
        this.$c = null; // jQuery canvas element
        this.c = null; // rendered canvas context
        this.t = 0; // touches index
        this.isInit = false;
        this.fgColor = null; // main color
        this.pColor = null; // previous color
        this.dH = null; // draw hook
        this.cH = null; // change hook
        this.eH = null; // cancel hook
        this.rH = null; // release hook
        this.scale = 1; // scale factor
        this.relative = false;
        this.relativeWidth = false;
        this.relativeHeight = false;
        this.$div = null; // component div

        this.run = function () {
            var cf = function (e, conf) {
                var k;
                for (k in conf) {
                    s.o[k] = conf[k];
                }
                s._carve().init();
                s._configure()
                 ._draw();
            };

            if (this.$.data('kontroled')) return;
            this.$.data('kontroled', true);

            this.extend();
            this.o = $.extend({
                    // Config
                    min: this.$.data('min') !== undefined ? this.$.data('min') : 0,
                    max: this.$.data('max') !== undefined ? this.$.data('max') : 100,
                    stopper: true,
                    readOnly: this.$.data('readonly') || (this.$.attr('readonly') === 'readonly'),

                    // UI
                    cursor: this.$.data('cursor') === true && 30
                            || this.$.data('cursor') || 0,
                    thickness: this.$.data('thickness')
                               && Math.max(Math.min(this.$.data('thickness'), 1), 0.01)
                               || 0.35,
                    lineCap: this.$.data('linecap') || 'butt',
                    width: this.$.data('width') || 200,
                    height: this.$.data('height') || 200,
                    displayInput: this.$.data('displayinput') == null || this.$.data('displayinput'),
                    displayPrevious: this.$.data('displayprevious'),
                    fgColor: this.$.data('fgcolor') || '#87CEEB',
                    inputColor: this.$.data('inputcolor'),
                    font: this.$.data('font') || 'Arial',
                    fontWeight: this.$.data('font-weight') || 'bold',
                    inline: false,
                    step: this.$.data('step') || 1,
                    rotation: this.$.data('rotation'),

                    // Hooks
                    draw: null, // function () {}
                    change: null, // function (value) {}
                    cancel: null, // function () {}
                    release: null, // function (value) {}

                    // Output formatting, allows to add unit: %, ms ...
                    format: function(v) {
                        return v;
                    },
                    parse: function (v) {
                        return parseFloat(v);
                    }
                }, this.o
            );

            // finalize options
            this.o.flip = this.o.rotation === 'anticlockwise' || this.o.rotation === 'acw';
            if (!this.o.inputColor) {
                this.o.inputColor = this.o.fgColor;
            }

            // routing value
            if (this.$.is('fieldset')) {

                // fieldset = array of integer
                this.v = {};
                this.i = this.$.find('input');
                this.i.each(function(k) {
                    var $this = $(this);
                    s.i[k] = $this;
                    s.v[k] = s.o.parse($this.val());

                    $this.bind(
                        'change blur',
                        function () {
                            var val = {};
                            val[k] = $this.val();
                            s.val(s._validate(val));
                        }
                    );
                });
                this.$.find('legend').remove();
            } else {

                // input = integer
                this.i = this.$;
                this.v = this.o.parse(this.$.val());
                this.v === '' && (this.v = this.o.min);
                this.$.bind(
                    'change blur',
                    function () {
                        s.val(s._validate(s.o.parse(s.$.val())));
                    }
                );

            }

            !this.o.displayInput && this.$.hide();

            // adds needed DOM elements (canvas, div)
            this.$c = $(document.createElement('canvas')).attr({
                width: this.o.width,
                height: this.o.height
            });

            // wraps all elements in a div
            // add to DOM before Canvas init is triggered
            this.$div = $('<div style="'
                + (this.o.inline ? 'display:inline;' : '')
                + 'width:' + this.o.width + 'px;height:' + this.o.height + 'px;'
                + '"></div>');

            this.$.wrap(this.$div).before(this.$c);
            this.$div = this.$.parent();

            if (typeof G_vmlCanvasManager !== 'undefined') {
                G_vmlCanvasManager.initElement(this.$c[0]);
            }

            this.c = this.$c[0].getContext ? this.$c[0].getContext('2d') : null;

            if (!this.c) {
                throw {
                    name:        "CanvasNotSupportedException",
                    message:     "Canvas not supported. Please use excanvas on IE8.0.",
                    toString:    function(){return this.name + ": " + this.message}
                }
            }

            // hdpi support
            this.scale = (window.devicePixelRatio || 1) / (
                            this.c.webkitBackingStorePixelRatio ||
                            this.c.mozBackingStorePixelRatio ||
                            this.c.msBackingStorePixelRatio ||
                            this.c.oBackingStorePixelRatio ||
                            this.c.backingStorePixelRatio || 1
                         );

            // detects relative width / height
            this.relativeWidth =  this.o.width % 1 !== 0
                                  && this.o.width.indexOf('%');
            this.relativeHeight = this.o.height % 1 !== 0
                                  && this.o.height.indexOf('%');
            this.relative = this.relativeWidth || this.relativeHeight;

            // computes size and carves the component
            this._carve();

            // prepares props for transaction
            if (this.v instanceof Object) {
                this.cv = {};
                this.copy(this.v, this.cv);
            } else {
                this.cv = this.v;
            }

            // binds configure event
            this.$
                .bind("configure", cf)
                .parent()
                .bind("configure", cf);

            // finalize init
            this._listen()
                ._configure()
                ._xy()
                .init();

            this.isInit = true;

            this.$.val(this.o.format(this.v));
            this._draw();

            return this;
        };

        this._carve = function() {
            if (this.relative) {
                var w = this.relativeWidth ?
                        this.$div.parent().width() *
                        parseInt(this.o.width) / 100
                        : this.$div.parent().width(),
                    h = this.relativeHeight ?
                        this.$div.parent().height() *
                        parseInt(this.o.height) / 100
                        : this.$div.parent().height();

                // apply relative
                this.w = this.h = Math.min(w, h);
            } else {
                this.w = this.o.width;
                this.h = this.o.height;
            }

            // finalize div
            this.$div.css({
                'width': this.w + 'px',
                'height': this.h + 'px'
            });

            // finalize canvas with computed width
            this.$c.attr({
                width: this.w,
                height: this.h
            });

            // scaling
            if (this.scale !== 1) {
                this.$c[0].width = this.$c[0].width * this.scale;
                this.$c[0].height = this.$c[0].height * this.scale;
                this.$c.width(this.w);
                this.$c.height(this.h);
            }

            return this;
        };

        this._draw = function () {

            // canvas pre-rendering
            var d = true;

            s.g = s.c;

            s.clear();

            s.dH && (d = s.dH());

            d !== false && s.draw();
        };

        this._touch = function (e) {
            var touchMove = function (e) {
                var v = s.xy2val(
                            e.originalEvent.touches[s.t].pageX,
                            e.originalEvent.touches[s.t].pageY
                        );

                if (v == s.cv) return;

                if (s.cH && s.cH(v) === false) return;

                s.change(s._validate(v));
                s._draw();
            };

            // get touches index
            this.t = k.c.t(e);

            // First touch
            touchMove(e);

            // Touch events listeners
            k.c.d
                .bind("touchmove.k", touchMove)
                .bind(
                    "touchend.k",
                    function () {
                        k.c.d.unbind('touchmove.k touchend.k');
                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._mouse = function (e) {
            var mouseMove = function (e) {
                var v = s.xy2val(e.pageX, e.pageY);

                if (v == s.cv) return;

                if (s.cH && (s.cH(v) === false)) return;

                s.change(s._validate(v));
                s._draw();
            };

            // First click
            mouseMove(e);

            // Mouse events listeners
            k.c.d
                .bind("mousemove.k", mouseMove)
                .bind(
                    // Escape key cancel current change
                    "keyup.k",
                    function (e) {
                        if (e.keyCode === 27) {
                            k.c.d.unbind("mouseup.k mousemove.k keyup.k");

                            if (s.eH && s.eH() === false)
                                return;

                            s.cancel();
                        }
                    }
                )
                .bind(
                    "mouseup.k",
                    function (e) {
                        k.c.d.unbind('mousemove.k mouseup.k keyup.k');
                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._xy = function () {
            var o = this.$c.offset();
            this.x = o.left;
            this.y = o.top;

            return this;
        };

        this._listen = function () {
            if (!this.o.readOnly) {
                this.$c
                    .bind(
                        "mousedown",
                        function (e) {
                            e.preventDefault();
                            s._xy()._mouse(e);
                        }
                    )
                    .bind(
                        "touchstart",
                        function (e) {
                            e.preventDefault();
                            s._xy()._touch(e);
                        }
                    );

                this.listen();
            } else {
                this.$.attr('readonly', 'readonly');
            }

            if (this.relative) {
                $(window).resize(function() {
                    s._carve().init();
                    s._draw();
                });
            }

            return this;
        };

        this._configure = function () {

            // Hooks
            if (this.o.draw) this.dH = this.o.draw;
            if (this.o.change) this.cH = this.o.change;
            if (this.o.cancel) this.eH = this.o.cancel;
            if (this.o.release) this.rH = this.o.release;

            if (this.o.displayPrevious) {
                this.pColor = this.h2rgba(this.o.fgColor, "0.4");
                this.fgColor = this.h2rgba(this.o.fgColor, "0.6");
            } else {
                this.fgColor = this.o.fgColor;
            }

            return this;
        };

        this._clear = function () {
            this.$c[0].width = this.$c[0].width;
        };

        this._validate = function (v) {
            var val = (~~ (((v < 0) ? -0.5 : 0.5) + (v/this.o.step))) * this.o.step;
            return Math.round(val * 100) / 100;
        };

        // Abstract methods
        this.listen = function () {}; // on start, one time
        this.extend = function () {}; // each time configure triggered
        this.init = function () {}; // each time configure triggered
        this.change = function (v) {}; // on change
        this.val = function (v) {}; // on release
        this.xy2val = function (x, y) {}; //
        this.draw = function () {}; // on change / on release
        this.clear = function () { this._clear(); };

        // Utils
        this.h2rgba = function (h, a) {
            var rgb;
            h = h.substring(1,7);
            rgb = [
                parseInt(h.substring(0,2), 16),
                parseInt(h.substring(2,4), 16),
                parseInt(h.substring(4,6), 16)
            ];

            return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        };

        this.copy = function (f, t) {
            for (var i in f) {
                t[i] = f[i];
            }
        };
    };


    /**
     * k.Dial
     */
    k.Dial = function () {
        k.o.call(this);

        this.startAngle = null;
        this.xy = null;
        this.radius = null;
        this.lineWidth = null;
        this.cursorExt = null;
        this.w2 = null;
        this.PI2 = 2*Math.PI;

        this.extend = function () {
            this.o = $.extend({
                bgColor: this.$.data('bgcolor') || '#EEEEEE',
                angleOffset: this.$.data('angleoffset') || 0,
                angleArc: this.$.data('anglearc') || 360,
                inline: true
            }, this.o);
        };

        this.val = function (v, triggerRelease) {
            if (null != v) {

                // reverse format
                v = this.o.parse(v);

                if (triggerRelease !== false
                    && v != this.v
                    && this.rH
                    && this.rH(v) === false) { return; }

                this.cv = this.o.stopper ? max(min(v, this.o.max), this.o.min) : v;
                this.v = this.cv;
                this.$.val(this.o.format(this.v));
                this._draw();
            } else {
                return this.v;
            }
        };

        this.xy2val = function (x, y) {
            var a, ret;

            a = Math.atan2(
                        x - (this.x + this.w2),
                        - (y - this.y - this.w2)
                    ) - this.angleOffset;

            if (this.o.flip) {
                a = this.angleArc - a - this.PI2;
            }

            if (this.angleArc != this.PI2 && (a < 0) && (a > -0.5)) {

                // if isset angleArc option, set to min if .5 under min
                a = 0;
            } else if (a < 0) {
                a += this.PI2;
            }

            ret = (a * (this.o.max - this.o.min) / this.angleArc) + this.o.min;

            this.o.stopper && (ret = max(min(ret, this.o.max), this.o.min));

            return ret;
        };

        this.listen = function () {

            // bind MouseWheel
            var s = this, mwTimerStop,
                mwTimerRelease,
                mw = function (e) {
                    e.preventDefault();

                    var ori = e.originalEvent,
                        deltaX = ori.detail || ori.wheelDeltaX,
                        deltaY = ori.detail || ori.wheelDeltaY,
                        v = s._validate(s.o.parse(s.$.val()))
                            + (
                                deltaX > 0 || deltaY > 0
                                ? s.o.step
                                : deltaX < 0 || deltaY < 0 ? -s.o.step : 0
                              );

                    v = max(min(v, s.o.max), s.o.min);

                    s.val(v, false);

                    if (s.rH) {
                        // Handle mousewheel stop
                        clearTimeout(mwTimerStop);
                        mwTimerStop = setTimeout(function () {
                            s.rH(v);
                            mwTimerStop = null;
                        }, 100);

                        // Handle mousewheel releases
                        if (!mwTimerRelease) {
                            mwTimerRelease = setTimeout(function () {
                                if (mwTimerStop)
                                    s.rH(v);
                                mwTimerRelease = null;
                            }, 200);
                        }
                    }
                },
                kval,
                to,
                m = 1,
                kv = {
                    37: -s.o.step,
                    38: s.o.step,
                    39: s.o.step,
                    40: -s.o.step
                };

            this.$
                .bind(
                    "keydown",
                    function (e) {
                        var kc = e.keyCode;

                        // numpad support
                        if (kc >= 96 && kc <= 105) {
                            kc = e.keyCode = kc - 48;
                        }

                        kval = parseInt(String.fromCharCode(kc));

                        if (isNaN(kval)) {
                            (kc !== 13)                     // enter
                            && kc !== 8                     // bs
                            && kc !== 9                     // tab
                            && kc !== 189                   // -
                            && (kc !== 190
                                || s.$.val().match(/\./))   // . allowed once
                            && e.preventDefault();

                            // arrows
                            if ($.inArray(kc,[37,38,39,40]) > -1) {
                                e.preventDefault();

                                var v = s.o.parse(s.$.val()) + kv[kc] * m;
                                s.o.stopper && (v = max(min(v, s.o.max), s.o.min));

                                s.change(s._validate(v));
                                s._draw();

                                // long time keydown speed-up
                                to = window.setTimeout(function () {
                                    m *= 2;
                                }, 30);
                            }
                        }
                    }
                )
                .bind(
                    "keyup",
                    function (e) {
                        if (isNaN(kval)) {
                            if (to) {
                                window.clearTimeout(to);
                                to = null;
                                m = 1;
                                s.val(s.$.val());
                            }
                        } else {
                            // kval postcond
                            (s.$.val() > s.o.max && s.$.val(s.o.max))
                            || (s.$.val() < s.o.min && s.$.val(s.o.min));
                        }
                    }
                );

            this.$c.bind("mousewheel DOMMouseScroll", mw);
            this.$.bind("mousewheel DOMMouseScroll", mw);
        };

        this.init = function () {
            if (this.v < this.o.min
                || this.v > this.o.max) { this.v = this.o.min; }

            this.$.val(this.v);
            this.w2 = this.w / 2;
            this.cursorExt = this.o.cursor / 100;
            this.xy = this.w2 * this.scale;
            this.lineWidth = this.xy * this.o.thickness;
            this.lineCap = this.o.lineCap;
            this.radius = this.xy - this.lineWidth / 2;

            this.o.angleOffset
            && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset);

            this.o.angleArc
            && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc);

            // deg to rad
            this.angleOffset = this.o.angleOffset * Math.PI / 180;
            this.angleArc = this.o.angleArc * Math.PI / 180;

            // compute start and end angles
            this.startAngle = 1.5 * Math.PI + this.angleOffset;
            this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc;

            var s = max(
                String(Math.abs(this.o.max)).length,
                String(Math.abs(this.o.min)).length,
                2
            ) + 2;

            this.o.displayInput
                && this.i.css({
                        'width' : ((this.w / 2 + 4) >> 0) + 'px',
                        'height' : ((this.w / 3) >> 0) + 'px',
                        'position' : 'absolute',
                        'vertical-align' : 'middle',
                        'margin-top' : ((this.w / 3) >> 0) + 'px',
                        'margin-left' : '-' + ((this.w * 3 / 4 + 2) >> 0) + 'px',
                        'border' : 0,
                        'background' : 'none',
                        'font' : this.o.fontWeight + ' ' + ((this.w / s) >> 0) + 'px ' + this.o.font,
                        'text-align' : 'center',
                        'color' : this.o.inputColor || this.o.fgColor,
                        'padding' : '0px',
                        '-webkit-appearance': 'none'
                        }) || this.i.css({
                            'width': '0px',
                            'visibility': 'hidden'
                        });
        };

        this.change = function (v) {
            this.cv = v;
            this.$.val(this.o.format(v));
        };

        this.angle = function (v) {
            return (v - this.o.min) * this.angleArc / (this.o.max - this.o.min);
        };

        this.arc = function (v) {
          var sa, ea;
          v = this.angle(v);
          if (this.o.flip) {
              sa = this.endAngle + 0.00001;
              ea = sa - v - 0.00001;
          } else {
              sa = this.startAngle - 0.00001;
              ea = sa + v + 0.00001;
          }
          this.o.cursor
              && (sa = ea - this.cursorExt)
              && (ea = ea + this.cursorExt);

          return {
              s: sa,
              e: ea,
              d: this.o.flip && !this.o.cursor
          };
        };

        this.draw = function () {
            var c = this.g,                 // context
                a = this.arc(this.cv),      // Arc
                pa,                         // Previous arc
                r = 1;

            c.lineWidth = this.lineWidth;
            c.lineCap = this.lineCap;

            if (this.o.bgColor !== "none") {
                c.beginPath();
                    c.strokeStyle = this.o.bgColor;
                    c.arc(this.xy, this.xy, this.radius, this.endAngle - 0.00001, this.startAngle + 0.00001, true);
                c.stroke();
            }

            if (this.o.displayPrevious) {
                pa = this.arc(this.v);
                c.beginPath();
                c.strokeStyle = this.pColor;
                c.arc(this.xy, this.xy, this.radius, pa.s, pa.e, pa.d);
                c.stroke();
                r = this.cv == this.v;
            }

            c.beginPath();
            c.strokeStyle = r ? this.o.fgColor : this.fgColor ;
            c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
            c.stroke();
        };

        this.cancel = function () {
            this.val(this.v);
        };
    };

    $.fn.dial = $.fn.knob = function (o) {
        return this.each(
            function () {
                var d = new k.Dial();
                d.o = o;
                d.$ = $(this);
                d.run();
            }
        ).parent();
    };

}));
/* Tooltipster v3.3.0 */;(function(e,t,n){function s(t,n){this.bodyOverflowX;this.callbacks={hide:[],show:[]};this.checkInterval=null;this.Content;this.$el=e(t);this.$elProxy;this.elProxyPosition;this.enabled=true;this.options=e.extend({},i,n);this.mouseIsOverProxy=false;this.namespace="tooltipster-"+Math.round(Math.random()*1e5);this.Status="hidden";this.timerHide=null;this.timerShow=null;this.$tooltip;this.options.iconTheme=this.options.iconTheme.replace(".","");this.options.theme=this.options.theme.replace(".","");this._init()}function o(t,n){var r=true;e.each(t,function(e,i){if(typeof n[e]==="undefined"||t[e]!==n[e]){r=false;return false}});return r}function f(){return!a&&u}function l(){var e=n.body||n.documentElement,t=e.style,r="transition";if(typeof t[r]=="string"){return true}v=["Moz","Webkit","Khtml","O","ms"],r=r.charAt(0).toUpperCase()+r.substr(1);for(var i=0;i<v.length;i++){if(typeof t[v[i]+r]=="string"){return true}}return false}var r="tooltipster",i={animation:"fade",arrow:true,arrowColor:"",autoClose:true,content:null,contentAsHTML:false,contentCloning:true,debug:true,delay:200,minWidth:0,maxWidth:null,functionInit:function(e,t){},functionBefore:function(e,t){t()},functionReady:function(e,t){},functionAfter:function(e){},hideOnClick:false,icon:"(?)",iconCloning:true,iconDesktop:false,iconTouch:false,iconTheme:"tooltipster-icon",interactive:false,interactiveTolerance:350,multiple:false,offsetX:0,offsetY:0,onlyOne:false,position:"top",positionTracker:false,positionTrackerCallback:function(e){if(this.option("trigger")=="hover"&&this.option("autoClose")){this.hide()}},restoration:"current",speed:350,timer:0,theme:"tooltipster-default",touchDevices:true,trigger:"hover",updateAnimation:true};s.prototype={_init:function(){var t=this;if(n.querySelector){var r=null;if(t.$el.data("tooltipster-initialTitle")===undefined){r=t.$el.attr("title");if(r===undefined)r=null;t.$el.data("tooltipster-initialTitle",r)}if(t.options.content!==null){t._content_set(t.options.content)}else{t._content_set(r)}var i=t.options.functionInit.call(t.$el,t.$el,t.Content);if(typeof i!=="undefined")t._content_set(i);t.$el.removeAttr("title").addClass("tooltipstered");if(!u&&t.options.iconDesktop||u&&t.options.iconTouch){if(typeof t.options.icon==="string"){t.$elProxy=e('<span class="'+t.options.iconTheme+'"></span>');t.$elProxy.text(t.options.icon)}else{if(t.options.iconCloning)t.$elProxy=t.options.icon.clone(true);else t.$elProxy=t.options.icon}t.$elProxy.insertAfter(t.$el)}else{t.$elProxy=t.$el}if(t.options.trigger=="hover"){t.$elProxy.on("mouseenter."+t.namespace,function(){if(!f()||t.options.touchDevices){t.mouseIsOverProxy=true;t._show()}}).on("mouseleave."+t.namespace,function(){if(!f()||t.options.touchDevices){t.mouseIsOverProxy=false}});if(u&&t.options.touchDevices){t.$elProxy.on("touchstart."+t.namespace,function(){t._showNow()})}}else if(t.options.trigger=="click"){t.$elProxy.on("click."+t.namespace,function(){if(!f()||t.options.touchDevices){t._show()}})}}},_show:function(){var e=this;if(e.Status!="shown"&&e.Status!="appearing"){if(e.options.delay){e.timerShow=setTimeout(function(){if(e.options.trigger=="click"||e.options.trigger=="hover"&&e.mouseIsOverProxy){e._showNow()}},e.options.delay)}else e._showNow()}},_showNow:function(n){var r=this;r.options.functionBefore.call(r.$el,r.$el,function(){if(r.enabled&&r.Content!==null){if(n)r.callbacks.show.push(n);r.callbacks.hide=[];clearTimeout(r.timerShow);r.timerShow=null;clearTimeout(r.timerHide);r.timerHide=null;if(r.options.onlyOne){e(".tooltipstered").not(r.$el).each(function(t,n){var r=e(n),i=r.data("tooltipster-ns");e.each(i,function(e,t){var n=r.data(t),i=n.status(),s=n.option("autoClose");if(i!=="hidden"&&i!=="disappearing"&&s){n.hide()}})})}var i=function(){r.Status="shown";e.each(r.callbacks.show,function(e,t){t.call(r.$el)});r.callbacks.show=[]};if(r.Status!=="hidden"){var s=0;if(r.Status==="disappearing"){r.Status="appearing";if(l()){r.$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-"+r.options.animation+"-show");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(i)}else{r.$tooltip.stop().fadeIn(i)}}else if(r.Status==="shown"){i()}}else{r.Status="appearing";var s=r.options.speed;r.bodyOverflowX=e("body").css("overflow-x");e("body").css("overflow-x","hidden");var o="tooltipster-"+r.options.animation,a="-webkit-transition-duration: "+r.options.speed+"ms; -webkit-animation-duration: "+r.options.speed+"ms; -moz-transition-duration: "+r.options.speed+"ms; -moz-animation-duration: "+r.options.speed+"ms; -o-transition-duration: "+r.options.speed+"ms; -o-animation-duration: "+r.options.speed+"ms; -ms-transition-duration: "+r.options.speed+"ms; -ms-animation-duration: "+r.options.speed+"ms; transition-duration: "+r.options.speed+"ms; animation-duration: "+r.options.speed+"ms;",f=r.options.minWidth?"min-width:"+Math.round(r.options.minWidth)+"px;":"",c=r.options.maxWidth?"max-width:"+Math.round(r.options.maxWidth)+"px;":"",h=r.options.interactive?"pointer-events: auto;":"";r.$tooltip=e('<div class="tooltipster-base '+r.options.theme+'" style="'+f+" "+c+" "+h+" "+a+'"><div class="tooltipster-content"></div></div>');if(l())r.$tooltip.addClass(o);r._content_insert();r.$tooltip.appendTo("body");r.reposition();r.options.functionReady.call(r.$el,r.$el,r.$tooltip);if(l()){r.$tooltip.addClass(o+"-show");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(i)}else{r.$tooltip.css("display","none").fadeIn(r.options.speed,i)}r._interval_set();e(t).on("scroll."+r.namespace+" resize."+r.namespace,function(){r.reposition()});if(r.options.autoClose){e("body").off("."+r.namespace);if(r.options.trigger=="hover"){if(u){setTimeout(function(){e("body").on("touchstart."+r.namespace,function(){r.hide()})},0)}if(r.options.interactive){if(u){r.$tooltip.on("touchstart."+r.namespace,function(e){e.stopPropagation()})}var p=null;r.$elProxy.add(r.$tooltip).on("mouseleave."+r.namespace+"-autoClose",function(){clearTimeout(p);p=setTimeout(function(){r.hide()},r.options.interactiveTolerance)}).on("mouseenter."+r.namespace+"-autoClose",function(){clearTimeout(p)})}else{r.$elProxy.on("mouseleave."+r.namespace+"-autoClose",function(){r.hide()})}if(r.options.hideOnClick){r.$elProxy.on("click."+r.namespace+"-autoClose",function(){r.hide()})}}else if(r.options.trigger=="click"){setTimeout(function(){e("body").on("click."+r.namespace+" touchstart."+r.namespace,function(){r.hide()})},0);if(r.options.interactive){r.$tooltip.on("click."+r.namespace+" touchstart."+r.namespace,function(e){e.stopPropagation()})}}}}if(r.options.timer>0){r.timerHide=setTimeout(function(){r.timerHide=null;r.hide()},r.options.timer+s)}}})},_interval_set:function(){var t=this;t.checkInterval=setInterval(function(){if(e("body").find(t.$el).length===0||e("body").find(t.$elProxy).length===0||t.Status=="hidden"||e("body").find(t.$tooltip).length===0){if(t.Status=="shown"||t.Status=="appearing")t.hide();t._interval_cancel()}else{if(t.options.positionTracker){var n=t._repositionInfo(t.$elProxy),r=false;if(o(n.dimension,t.elProxyPosition.dimension)){if(t.$elProxy.css("position")==="fixed"){if(o(n.position,t.elProxyPosition.position))r=true}else{if(o(n.offset,t.elProxyPosition.offset))r=true}}if(!r){t.reposition();t.options.positionTrackerCallback.call(t,t.$el)}}}},200)},_interval_cancel:function(){clearInterval(this.checkInterval);this.checkInterval=null},_content_set:function(e){if(typeof e==="object"&&e!==null&&this.options.contentCloning){e=e.clone(true)}this.Content=e},_content_insert:function(){var e=this,t=this.$tooltip.find(".tooltipster-content");if(typeof e.Content==="string"&&!e.options.contentAsHTML){t.text(e.Content)}else{t.empty().append(e.Content)}},_update:function(e){var t=this;t._content_set(e);if(t.Content!==null){if(t.Status!=="hidden"){t._content_insert();t.reposition();if(t.options.updateAnimation){if(l()){t.$tooltip.css({width:"","-webkit-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-moz-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-o-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-ms-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms",transition:"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms"}).addClass("tooltipster-content-changing");setTimeout(function(){if(t.Status!="hidden"){t.$tooltip.removeClass("tooltipster-content-changing");setTimeout(function(){if(t.Status!=="hidden"){t.$tooltip.css({"-webkit-transition":t.options.speed+"ms","-moz-transition":t.options.speed+"ms","-o-transition":t.options.speed+"ms","-ms-transition":t.options.speed+"ms",transition:t.options.speed+"ms"})}},t.options.speed)}},t.options.speed)}else{t.$tooltip.fadeTo(t.options.speed,.5,function(){if(t.Status!="hidden"){t.$tooltip.fadeTo(t.options.speed,1)}})}}}}else{t.hide()}},_repositionInfo:function(e){return{dimension:{height:e.outerHeight(false),width:e.outerWidth(false)},offset:e.offset(),position:{left:parseInt(e.css("left")),top:parseInt(e.css("top"))}}},hide:function(n){var r=this;if(n)r.callbacks.hide.push(n);r.callbacks.show=[];clearTimeout(r.timerShow);r.timerShow=null;clearTimeout(r.timerHide);r.timerHide=null;var i=function(){e.each(r.callbacks.hide,function(e,t){t.call(r.$el)});r.callbacks.hide=[]};if(r.Status=="shown"||r.Status=="appearing"){r.Status="disappearing";var s=function(){r.Status="hidden";if(typeof r.Content=="object"&&r.Content!==null){r.Content.detach()}r.$tooltip.remove();r.$tooltip=null;e(t).off("."+r.namespace);e("body").off("."+r.namespace).css("overflow-x",r.bodyOverflowX);e("body").off("."+r.namespace);r.$elProxy.off("."+r.namespace+"-autoClose");r.options.functionAfter.call(r.$el,r.$el);i()};if(l()){r.$tooltip.clearQueue().removeClass("tooltipster-"+r.options.animation+"-show").addClass("tooltipster-dying");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(s)}else{r.$tooltip.stop().fadeOut(r.options.speed,s)}}else if(r.Status=="hidden"){i()}return r},show:function(e){this._showNow(e);return this},update:function(e){return this.content(e)},content:function(e){if(typeof e==="undefined"){return this.Content}else{this._update(e);return this}},reposition:function(){var n=this;if(e("body").find(n.$tooltip).length!==0){n.$tooltip.css("width","");n.elProxyPosition=n._repositionInfo(n.$elProxy);var r=null,i=e(t).width(),s=n.elProxyPosition,o=n.$tooltip.outerWidth(false),u=n.$tooltip.innerWidth()+1,a=n.$tooltip.outerHeight(false);if(n.$elProxy.is("area")){var f=n.$elProxy.attr("shape"),l=n.$elProxy.parent().attr("name"),c=e('img[usemap="#'+l+'"]'),h=c.offset().left,p=c.offset().top,d=n.$elProxy.attr("coords")!==undefined?n.$elProxy.attr("coords").split(","):undefined;if(f=="circle"){var v=parseInt(d[0]),m=parseInt(d[1]),g=parseInt(d[2]);s.dimension.height=g*2;s.dimension.width=g*2;s.offset.top=p+m-g;s.offset.left=h+v-g}else if(f=="rect"){var v=parseInt(d[0]),m=parseInt(d[1]),y=parseInt(d[2]),b=parseInt(d[3]);s.dimension.height=b-m;s.dimension.width=y-v;s.offset.top=p+m;s.offset.left=h+v}else if(f=="poly"){var w=[],E=[],S=0,x=0,T=0,N=0,C="even";for(var k=0;k<d.length;k++){var L=parseInt(d[k]);if(C=="even"){if(L>T){T=L;if(k===0){S=T}}if(L<S){S=L}C="odd"}else{if(L>N){N=L;if(k==1){x=N}}if(L<x){x=L}C="even"}}s.dimension.height=N-x;s.dimension.width=T-S;s.offset.top=p+x;s.offset.left=h+S}else{s.dimension.height=c.outerHeight(false);s.dimension.width=c.outerWidth(false);s.offset.top=p;s.offset.left=h}}var A=0,O=0,M=0,_=parseInt(n.options.offsetY),D=parseInt(n.options.offsetX),P=n.options.position;function H(){var n=e(t).scrollLeft();if(A-n<0){r=A-n;A=n}if(A+o-n>i){r=A-(i+n-o);A=i+n-o}}function B(n,r){if(s.offset.top-e(t).scrollTop()-a-_-12<0&&r.indexOf("top")>-1){P=n}if(s.offset.top+s.dimension.height+a+12+_>e(t).scrollTop()+e(t).height()&&r.indexOf("bottom")>-1){P=n;M=s.offset.top-a-_-12}}if(P=="top"){var j=s.offset.left+o-(s.offset.left+s.dimension.width);A=s.offset.left+D-j/2;M=s.offset.top-a-_-12;H();B("bottom","top")}if(P=="top-left"){A=s.offset.left+D;M=s.offset.top-a-_-12;H();B("bottom-left","top-left")}if(P=="top-right"){A=s.offset.left+s.dimension.width+D-o;M=s.offset.top-a-_-12;H();B("bottom-right","top-right")}if(P=="bottom"){var j=s.offset.left+o-(s.offset.left+s.dimension.width);A=s.offset.left-j/2+D;M=s.offset.top+s.dimension.height+_+12;H();B("top","bottom")}if(P=="bottom-left"){A=s.offset.left+D;M=s.offset.top+s.dimension.height+_+12;H();B("top-left","bottom-left")}if(P=="bottom-right"){A=s.offset.left+s.dimension.width+D-o;M=s.offset.top+s.dimension.height+_+12;H();B("top-right","bottom-right")}if(P=="left"){A=s.offset.left-D-o-12;O=s.offset.left+D+s.dimension.width+12;var F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_;if(A<0&&O+o>i){var I=parseFloat(n.$tooltip.css("border-width"))*2,q=o+A-I;n.$tooltip.css("width",q+"px");a=n.$tooltip.outerHeight(false);A=s.offset.left-D-q-12-I;F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_}else if(A<0){A=s.offset.left+D+s.dimension.width+12;r="left"}}if(P=="right"){A=s.offset.left+D+s.dimension.width+12;O=s.offset.left-D-o-12;var F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_;if(A+o>i&&O<0){var I=parseFloat(n.$tooltip.css("border-width"))*2,q=i-A-I;n.$tooltip.css("width",q+"px");a=n.$tooltip.outerHeight(false);F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_}else if(A+o>i){A=s.offset.left-D-o-12;r="right"}}if(n.options.arrow){var R="tooltipster-arrow-"+P;if(n.options.arrowColor.length<1){var U=n.$tooltip.css("background-color")}else{var U=n.options.arrowColor}if(!r){r=""}else if(r=="left"){R="tooltipster-arrow-right";r=""}else if(r=="right"){R="tooltipster-arrow-left";r=""}else{r="left:"+Math.round(r)+"px;"}if(P=="top"||P=="top-left"||P=="top-right"){var z=parseFloat(n.$tooltip.css("border-bottom-width")),W=n.$tooltip.css("border-bottom-color")}else if(P=="bottom"||P=="bottom-left"||P=="bottom-right"){var z=parseFloat(n.$tooltip.css("border-top-width")),W=n.$tooltip.css("border-top-color")}else if(P=="left"){var z=parseFloat(n.$tooltip.css("border-right-width")),W=n.$tooltip.css("border-right-color")}else if(P=="right"){var z=parseFloat(n.$tooltip.css("border-left-width")),W=n.$tooltip.css("border-left-color")}else{var z=parseFloat(n.$tooltip.css("border-bottom-width")),W=n.$tooltip.css("border-bottom-color")}if(z>1){z++}var X="";if(z!==0){var V="",J="border-color: "+W+";";if(R.indexOf("bottom")!==-1){V="margin-top: -"+Math.round(z)+"px;"}else if(R.indexOf("top")!==-1){V="margin-bottom: -"+Math.round(z)+"px;"}else if(R.indexOf("left")!==-1){V="margin-right: -"+Math.round(z)+"px;"}else if(R.indexOf("right")!==-1){V="margin-left: -"+Math.round(z)+"px;"}X='<span class="tooltipster-arrow-border" style="'+V+" "+J+';"></span>'}n.$tooltip.find(".tooltipster-arrow").remove();var K='<div class="'+R+' tooltipster-arrow" style="'+r+'">'+X+'<span style="border-color:'+U+';"></span></div>';n.$tooltip.append(K)}n.$tooltip.css({top:Math.round(M)+"px",left:Math.round(A)+"px"})}return n},enable:function(){this.enabled=true;return this},disable:function(){this.hide();this.enabled=false;return this},destroy:function(){var t=this;t.hide();if(t.$el[0]!==t.$elProxy[0]){t.$elProxy.remove()}t.$el.removeData(t.namespace).off("."+t.namespace);var n=t.$el.data("tooltipster-ns");if(n.length===1){var r=null;if(t.options.restoration==="previous"){r=t.$el.data("tooltipster-initialTitle")}else if(t.options.restoration==="current"){r=typeof t.Content==="string"?t.Content:e("<div></div>").append(t.Content).html()}if(r){t.$el.attr("title",r)}t.$el.removeClass("tooltipstered").removeData("tooltipster-ns").removeData("tooltipster-initialTitle")}else{n=e.grep(n,function(e,n){return e!==t.namespace});t.$el.data("tooltipster-ns",n)}return t},elementIcon:function(){return this.$el[0]!==this.$elProxy[0]?this.$elProxy[0]:undefined},elementTooltip:function(){return this.$tooltip?this.$tooltip[0]:undefined},option:function(e,t){if(typeof t=="undefined")return this.options[e];else{this.options[e]=t;return this}},status:function(){return this.Status}};e.fn[r]=function(){var t=arguments;if(this.length===0){if(typeof t[0]==="string"){var n=true;switch(t[0]){case"setDefaults":e.extend(i,t[1]);break;default:n=false;break}if(n)return true;else return this}else{return this}}else{if(typeof t[0]==="string"){var r="#*$~&";this.each(function(){var n=e(this).data("tooltipster-ns"),i=n?e(this).data(n[0]):null;if(i){if(typeof i[t[0]]==="function"){var s=i[t[0]](t[1],t[2])}else{throw new Error('Unknown method .tooltipster("'+t[0]+'")')}if(s!==i){r=s;return false}}else{throw new Error("You called Tooltipster's \""+t[0]+'" method on an uninitialized element')}});return r!=="#*$~&"?r:this}else{var o=[],u=t[0]&&typeof t[0].multiple!=="undefined",a=u&&t[0].multiple||!u&&i.multiple,f=t[0]&&typeof t[0].debug!=="undefined",l=f&&t[0].debug||!f&&i.debug;this.each(function(){var n=false,r=e(this).data("tooltipster-ns"),i=null;if(!r){n=true}else if(a){n=true}else if(l){console.log('Tooltipster: one or more tooltips are already attached to this element: ignoring. Use the "multiple" option to attach more tooltips.')}if(n){i=new s(this,t[0]);if(!r)r=[];r.push(i.namespace);e(this).data("tooltipster-ns",r);e(this).data(i.namespace,i)}o.push(i)});if(a)return o;else return this}}};var u=!!("ontouchstart"in t);var a=false;e("body").one("mousemove",function(){a=true})})(jQuery,window,document);
/* pako 0.2.8 nodeca/pako */
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.pako=t()}}(function(){return function t(e,a,i){function n(s,o){if(!a[s]){if(!e[s]){var l="function"==typeof require&&require;if(!o&&l)return l(s,!0);if(r)return r(s,!0);var h=new Error("Cannot find module '"+s+"'");throw h.code="MODULE_NOT_FOUND",h}var d=a[s]={exports:{}};e[s][0].call(d.exports,function(t){var a=e[s][1][t];return n(a?a:t)},d,d.exports,t,e,a,i)}return a[s].exports}for(var r="function"==typeof require&&require,s=0;s<i.length;s++)n(i[s]);return n}({1:[function(t,e,a){"use strict";function i(t,e){var a=new v(e);if(a.push(t,!0),a.err)throw a.msg;return a.result}function n(t,e){return e=e||{},e.raw=!0,i(t,e)}function r(t,e){return e=e||{},e.gzip=!0,i(t,e)}var s=t("./zlib/deflate.js"),o=t("./utils/common"),l=t("./utils/strings"),h=t("./zlib/messages"),d=t("./zlib/zstream"),f=Object.prototype.toString,_=0,u=4,c=0,b=1,g=2,m=-1,w=0,p=8,v=function(t){this.options=o.assign({level:m,method:p,chunkSize:16384,windowBits:15,memLevel:8,strategy:w,to:""},t||{});var e=this.options;e.raw&&e.windowBits>0?e.windowBits=-e.windowBits:e.gzip&&e.windowBits>0&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new d,this.strm.avail_out=0;var a=s.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(a!==c)throw new Error(h[a]);e.header&&s.deflateSetHeader(this.strm,e.header)};v.prototype.push=function(t,e){var a,i,n=this.strm,r=this.options.chunkSize;if(this.ended)return!1;i=e===~~e?e:e===!0?u:_,"string"==typeof t?n.input=l.string2buf(t):"[object ArrayBuffer]"===f.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(r),n.next_out=0,n.avail_out=r),a=s.deflate(n,i),a!==b&&a!==c)return this.onEnd(a),this.ended=!0,!1;(0===n.avail_out||0===n.avail_in&&(i===u||i===g))&&this.onData("string"===this.options.to?l.buf2binstring(o.shrinkBuf(n.output,n.next_out)):o.shrinkBuf(n.output,n.next_out))}while((n.avail_in>0||0===n.avail_out)&&a!==b);return i===u?(a=s.deflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===c):i===g?(this.onEnd(c),n.avail_out=0,!0):!0},v.prototype.onData=function(t){this.chunks.push(t)},v.prototype.onEnd=function(t){t===c&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},a.Deflate=v,a.deflate=i,a.deflateRaw=n,a.gzip=r},{"./utils/common":3,"./utils/strings":4,"./zlib/deflate.js":8,"./zlib/messages":13,"./zlib/zstream":15}],2:[function(t,e,a){"use strict";function i(t,e){var a=new u(e);if(a.push(t,!0),a.err)throw a.msg;return a.result}function n(t,e){return e=e||{},e.raw=!0,i(t,e)}var r=t("./zlib/inflate.js"),s=t("./utils/common"),o=t("./utils/strings"),l=t("./zlib/constants"),h=t("./zlib/messages"),d=t("./zlib/zstream"),f=t("./zlib/gzheader"),_=Object.prototype.toString,u=function(t){this.options=s.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&e.windowBits>=0&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(e.windowBits>=0&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),e.windowBits>15&&e.windowBits<48&&0===(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new d,this.strm.avail_out=0;var a=r.inflateInit2(this.strm,e.windowBits);if(a!==l.Z_OK)throw new Error(h[a]);this.header=new f,r.inflateGetHeader(this.strm,this.header)};u.prototype.push=function(t,e){var a,i,n,h,d,f=this.strm,u=this.options.chunkSize,c=!1;if(this.ended)return!1;i=e===~~e?e:e===!0?l.Z_FINISH:l.Z_NO_FLUSH,"string"==typeof t?f.input=o.binstring2buf(t):"[object ArrayBuffer]"===_.call(t)?f.input=new Uint8Array(t):f.input=t,f.next_in=0,f.avail_in=f.input.length;do{if(0===f.avail_out&&(f.output=new s.Buf8(u),f.next_out=0,f.avail_out=u),a=r.inflate(f,l.Z_NO_FLUSH),a===l.Z_BUF_ERROR&&c===!0&&(a=l.Z_OK,c=!1),a!==l.Z_STREAM_END&&a!==l.Z_OK)return this.onEnd(a),this.ended=!0,!1;f.next_out&&(0===f.avail_out||a===l.Z_STREAM_END||0===f.avail_in&&(i===l.Z_FINISH||i===l.Z_SYNC_FLUSH))&&("string"===this.options.to?(n=o.utf8border(f.output,f.next_out),h=f.next_out-n,d=o.buf2string(f.output,n),f.next_out=h,f.avail_out=u-h,h&&s.arraySet(f.output,f.output,n,h,0),this.onData(d)):this.onData(s.shrinkBuf(f.output,f.next_out))),0===f.avail_in&&0===f.avail_out&&(c=!0)}while((f.avail_in>0||0===f.avail_out)&&a!==l.Z_STREAM_END);return a===l.Z_STREAM_END&&(i=l.Z_FINISH),i===l.Z_FINISH?(a=r.inflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===l.Z_OK):i===l.Z_SYNC_FLUSH?(this.onEnd(l.Z_OK),f.avail_out=0,!0):!0},u.prototype.onData=function(t){this.chunks.push(t)},u.prototype.onEnd=function(t){t===l.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=s.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},a.Inflate=u,a.inflate=i,a.inflateRaw=n,a.ungzip=i},{"./utils/common":3,"./utils/strings":4,"./zlib/constants":6,"./zlib/gzheader":9,"./zlib/inflate.js":11,"./zlib/messages":13,"./zlib/zstream":15}],3:[function(t,e,a){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;a.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var a=e.shift();if(a){if("object"!=typeof a)throw new TypeError(a+"must be non-object");for(var i in a)a.hasOwnProperty(i)&&(t[i]=a[i])}}return t},a.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,a,i,n){if(e.subarray&&t.subarray)return void t.set(e.subarray(a,a+i),n);for(var r=0;i>r;r++)t[n+r]=e[a+r]},flattenChunks:function(t){var e,a,i,n,r,s;for(i=0,e=0,a=t.length;a>e;e++)i+=t[e].length;for(s=new Uint8Array(i),n=0,e=0,a=t.length;a>e;e++)r=t[e],s.set(r,n),n+=r.length;return s}},r={arraySet:function(t,e,a,i,n){for(var r=0;i>r;r++)t[n+r]=e[a+r]},flattenChunks:function(t){return[].concat.apply([],t)}};a.setTyped=function(t){t?(a.Buf8=Uint8Array,a.Buf16=Uint16Array,a.Buf32=Int32Array,a.assign(a,n)):(a.Buf8=Array,a.Buf16=Array,a.Buf32=Array,a.assign(a,r))},a.setTyped(i)},{}],4:[function(t,e,a){"use strict";function i(t,e){if(65537>e&&(t.subarray&&s||!t.subarray&&r))return String.fromCharCode.apply(null,n.shrinkBuf(t,e));for(var a="",i=0;e>i;i++)a+=String.fromCharCode(t[i]);return a}var n=t("./common"),r=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(o){r=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(o){s=!1}for(var l=new n.Buf8(256),h=0;256>h;h++)l[h]=h>=252?6:h>=248?5:h>=240?4:h>=224?3:h>=192?2:1;l[254]=l[254]=1,a.string2buf=function(t){var e,a,i,r,s,o=t.length,l=0;for(r=0;o>r;r++)a=t.charCodeAt(r),55296===(64512&a)&&o>r+1&&(i=t.charCodeAt(r+1),56320===(64512&i)&&(a=65536+(a-55296<<10)+(i-56320),r++)),l+=128>a?1:2048>a?2:65536>a?3:4;for(e=new n.Buf8(l),s=0,r=0;l>s;r++)a=t.charCodeAt(r),55296===(64512&a)&&o>r+1&&(i=t.charCodeAt(r+1),56320===(64512&i)&&(a=65536+(a-55296<<10)+(i-56320),r++)),128>a?e[s++]=a:2048>a?(e[s++]=192|a>>>6,e[s++]=128|63&a):65536>a?(e[s++]=224|a>>>12,e[s++]=128|a>>>6&63,e[s++]=128|63&a):(e[s++]=240|a>>>18,e[s++]=128|a>>>12&63,e[s++]=128|a>>>6&63,e[s++]=128|63&a);return e},a.buf2binstring=function(t){return i(t,t.length)},a.binstring2buf=function(t){for(var e=new n.Buf8(t.length),a=0,i=e.length;i>a;a++)e[a]=t.charCodeAt(a);return e},a.buf2string=function(t,e){var a,n,r,s,o=e||t.length,h=new Array(2*o);for(n=0,a=0;o>a;)if(r=t[a++],128>r)h[n++]=r;else if(s=l[r],s>4)h[n++]=65533,a+=s-1;else{for(r&=2===s?31:3===s?15:7;s>1&&o>a;)r=r<<6|63&t[a++],s--;s>1?h[n++]=65533:65536>r?h[n++]=r:(r-=65536,h[n++]=55296|r>>10&1023,h[n++]=56320|1023&r)}return i(h,n)},a.utf8border=function(t,e){var a;for(e=e||t.length,e>t.length&&(e=t.length),a=e-1;a>=0&&128===(192&t[a]);)a--;return 0>a?e:0===a?e:a+l[t[a]]>e?a:e}},{"./common":3}],5:[function(t,e,a){"use strict";function i(t,e,a,i){for(var n=65535&t|0,r=t>>>16&65535|0,s=0;0!==a;){s=a>2e3?2e3:a,a-=s;do n=n+e[i++]|0,r=r+n|0;while(--s);n%=65521,r%=65521}return n|r<<16|0}e.exports=i},{}],6:[function(t,e,a){e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],7:[function(t,e,a){"use strict";function i(){for(var t,e=[],a=0;256>a;a++){t=a;for(var i=0;8>i;i++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t}return e}function n(t,e,a,i){var n=r,s=i+a;t=-1^t;for(var o=i;s>o;o++)t=t>>>8^n[255&(t^e[o])];return-1^t}var r=i();e.exports=n},{}],8:[function(t,e,a){"use strict";function i(t,e){return t.msg=N[e],e}function n(t){return(t<<1)-(t>4?9:0)}function r(t){for(var e=t.length;--e>=0;)t[e]=0}function s(t){var e=t.state,a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(A.arraySet(t.output,e.pending_buf,e.pending_out,a,t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0))}function o(t,e){Z._tr_flush_block(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,s(t.strm)}function l(t,e){t.pending_buf[t.pending++]=e}function h(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e}function d(t,e,a,i){var n=t.avail_in;return n>i&&(n=i),0===n?0:(t.avail_in-=n,A.arraySet(e,t.input,t.next_in,n,a),1===t.state.wrap?t.adler=R(t.adler,e,n,a):2===t.state.wrap&&(t.adler=C(t.adler,e,n,a)),t.next_in+=n,t.total_in+=n,n)}function f(t,e){var a,i,n=t.max_chain_length,r=t.strstart,s=t.prev_length,o=t.nice_match,l=t.strstart>t.w_size-ht?t.strstart-(t.w_size-ht):0,h=t.window,d=t.w_mask,f=t.prev,_=t.strstart+lt,u=h[r+s-1],c=h[r+s];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do if(a=e,h[a+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do;while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&_>r);if(i=lt-(_-r),r=_-lt,i>s){if(t.match_start=e,s=i,i>=o)break;u=h[r+s-1],c=h[r+s]}}while((e=f[e&d])>l&&0!==--n);return s<=t.lookahead?s:t.lookahead}function _(t){var e,a,i,n,r,s=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=s+(s-ht)){A.arraySet(t.window,t.window,s,s,0),t.match_start-=s,t.strstart-=s,t.block_start-=s,a=t.hash_size,e=a;do i=t.head[--e],t.head[e]=i>=s?i-s:0;while(--a);a=s,e=a;do i=t.prev[--e],t.prev[e]=i>=s?i-s:0;while(--a);n+=s}if(0===t.strm.avail_in)break;if(a=d(t.strm,t.window,t.strstart+t.lookahead,n),t.lookahead+=a,t.lookahead+t.insert>=ot)for(r=t.strstart-t.insert,t.ins_h=t.window[r],t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+ot-1])&t.hash_mask,t.prev[r&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=r,r++,t.insert--,!(t.lookahead+t.insert<ot)););}while(t.lookahead<ht&&0!==t.strm.avail_in)}function u(t,e){var a=65535;for(a>t.pending_buf_size-5&&(a=t.pending_buf_size-5);;){if(t.lookahead<=1){if(_(t),0===t.lookahead&&e===O)return wt;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+a;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,o(t,!1),0===t.strm.avail_out))return wt;if(t.strstart-t.block_start>=t.w_size-ht&&(o(t,!1),0===t.strm.avail_out))return wt}return t.insert=0,e===F?(o(t,!0),0===t.strm.avail_out?vt:kt):t.strstart>t.block_start&&(o(t,!1),0===t.strm.avail_out)?wt:wt}function c(t,e){for(var a,i;;){if(t.lookahead<ht){if(_(t),t.lookahead<ht&&e===O)return wt;if(0===t.lookahead)break}if(a=0,t.lookahead>=ot&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+ot-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-ht&&(t.match_length=f(t,a)),t.match_length>=ot)if(i=Z._tr_tally(t,t.strstart-t.match_start,t.match_length-ot),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=ot){t.match_length--;do t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+ot-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart;while(0!==--t.match_length);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=Z._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(o(t,!1),0===t.strm.avail_out))return wt}return t.insert=t.strstart<ot-1?t.strstart:ot-1,e===F?(o(t,!0),0===t.strm.avail_out?vt:kt):t.last_lit&&(o(t,!1),0===t.strm.avail_out)?wt:pt}function b(t,e){for(var a,i,n;;){if(t.lookahead<ht){if(_(t),t.lookahead<ht&&e===O)return wt;if(0===t.lookahead)break}if(a=0,t.lookahead>=ot&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+ot-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=ot-1,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-ht&&(t.match_length=f(t,a),t.match_length<=5&&(t.strategy===P||t.match_length===ot&&t.strstart-t.match_start>4096)&&(t.match_length=ot-1)),t.prev_length>=ot&&t.match_length<=t.prev_length){n=t.strstart+t.lookahead-ot,i=Z._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-ot),t.lookahead-=t.prev_length-1,t.prev_length-=2;do++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+ot-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart);while(0!==--t.prev_length);if(t.match_available=0,t.match_length=ot-1,t.strstart++,i&&(o(t,!1),0===t.strm.avail_out))return wt}else if(t.match_available){if(i=Z._tr_tally(t,0,t.window[t.strstart-1]),i&&o(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return wt}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(i=Z._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<ot-1?t.strstart:ot-1,e===F?(o(t,!0),0===t.strm.avail_out?vt:kt):t.last_lit&&(o(t,!1),0===t.strm.avail_out)?wt:pt}function g(t,e){for(var a,i,n,r,s=t.window;;){if(t.lookahead<=lt){if(_(t),t.lookahead<=lt&&e===O)return wt;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=ot&&t.strstart>0&&(n=t.strstart-1,i=s[n],i===s[++n]&&i===s[++n]&&i===s[++n])){r=t.strstart+lt;do;while(i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&r>n);t.match_length=lt-(r-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=ot?(a=Z._tr_tally(t,1,t.match_length-ot),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=Z._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(o(t,!1),0===t.strm.avail_out))return wt}return t.insert=0,e===F?(o(t,!0),0===t.strm.avail_out?vt:kt):t.last_lit&&(o(t,!1),0===t.strm.avail_out)?wt:pt}function m(t,e){for(var a;;){if(0===t.lookahead&&(_(t),0===t.lookahead)){if(e===O)return wt;break}if(t.match_length=0,a=Z._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(o(t,!1),0===t.strm.avail_out))return wt}return t.insert=0,e===F?(o(t,!0),0===t.strm.avail_out?vt:kt):t.last_lit&&(o(t,!1),0===t.strm.avail_out)?wt:pt}function w(t){t.window_size=2*t.w_size,r(t.head),t.max_lazy_match=E[t.level].max_lazy,t.good_match=E[t.level].good_length,t.nice_match=E[t.level].nice_length,t.max_chain_length=E[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=ot-1,t.match_available=0,t.ins_h=0}function p(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=J,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new A.Buf16(2*rt),this.dyn_dtree=new A.Buf16(2*(2*it+1)),this.bl_tree=new A.Buf16(2*(2*nt+1)),r(this.dyn_ltree),r(this.dyn_dtree),r(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new A.Buf16(st+1),this.heap=new A.Buf16(2*at+1),r(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new A.Buf16(2*at+1),r(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function v(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=W,e=t.state,e.pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?ft:gt,t.adler=2===e.wrap?0:1,e.last_flush=O,Z._tr_init(e),D):i(t,H)}function k(t){var e=v(t);return e===D&&w(t.state),e}function x(t,e){return t&&t.state?2!==t.state.wrap?H:(t.state.gzhead=e,D):H}function y(t,e,a,n,r,s){if(!t)return H;var o=1;if(e===M&&(e=6),0>n?(o=0,n=-n):n>15&&(o=2,n-=16),1>r||r>Q||a!==J||8>n||n>15||0>e||e>9||0>s||s>G)return i(t,H);8===n&&(n=9);var l=new p;return t.state=l,l.strm=t,l.wrap=o,l.gzhead=null,l.w_bits=n,l.w_size=1<<l.w_bits,l.w_mask=l.w_size-1,l.hash_bits=r+7,l.hash_size=1<<l.hash_bits,l.hash_mask=l.hash_size-1,l.hash_shift=~~((l.hash_bits+ot-1)/ot),l.window=new A.Buf8(2*l.w_size),l.head=new A.Buf16(l.hash_size),l.prev=new A.Buf16(l.w_size),l.lit_bufsize=1<<r+6,l.pending_buf_size=4*l.lit_bufsize,l.pending_buf=new A.Buf8(l.pending_buf_size),l.d_buf=l.lit_bufsize>>1,l.l_buf=3*l.lit_bufsize,l.level=e,l.strategy=s,l.method=a,k(t)}function z(t,e){return y(t,e,J,V,$,X)}function B(t,e){var a,o,d,f;if(!t||!t.state||e>T||0>e)return t?i(t,H):H;if(o=t.state,!t.output||!t.input&&0!==t.avail_in||o.status===mt&&e!==F)return i(t,0===t.avail_out?K:H);if(o.strm=t,a=o.last_flush,o.last_flush=e,o.status===ft)if(2===o.wrap)t.adler=0,l(o,31),l(o,139),l(o,8),o.gzhead?(l(o,(o.gzhead.text?1:0)+(o.gzhead.hcrc?2:0)+(o.gzhead.extra?4:0)+(o.gzhead.name?8:0)+(o.gzhead.comment?16:0)),l(o,255&o.gzhead.time),l(o,o.gzhead.time>>8&255),l(o,o.gzhead.time>>16&255),l(o,o.gzhead.time>>24&255),l(o,9===o.level?2:o.strategy>=Y||o.level<2?4:0),l(o,255&o.gzhead.os),o.gzhead.extra&&o.gzhead.extra.length&&(l(o,255&o.gzhead.extra.length),l(o,o.gzhead.extra.length>>8&255)),o.gzhead.hcrc&&(t.adler=C(t.adler,o.pending_buf,o.pending,0)),o.gzindex=0,o.status=_t):(l(o,0),l(o,0),l(o,0),l(o,0),l(o,0),l(o,9===o.level?2:o.strategy>=Y||o.level<2?4:0),l(o,xt),o.status=gt);else{var _=J+(o.w_bits-8<<4)<<8,u=-1;u=o.strategy>=Y||o.level<2?0:o.level<6?1:6===o.level?2:3,_|=u<<6,0!==o.strstart&&(_|=dt),_+=31-_%31,o.status=gt,h(o,_),0!==o.strstart&&(h(o,t.adler>>>16),h(o,65535&t.adler)),t.adler=1}if(o.status===_t)if(o.gzhead.extra){for(d=o.pending;o.gzindex<(65535&o.gzhead.extra.length)&&(o.pending!==o.pending_buf_size||(o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),s(t),d=o.pending,o.pending!==o.pending_buf_size));)l(o,255&o.gzhead.extra[o.gzindex]),o.gzindex++;o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),o.gzindex===o.gzhead.extra.length&&(o.gzindex=0,o.status=ut)}else o.status=ut;if(o.status===ut)if(o.gzhead.name){d=o.pending;do{if(o.pending===o.pending_buf_size&&(o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),s(t),d=o.pending,o.pending===o.pending_buf_size)){f=1;break}f=o.gzindex<o.gzhead.name.length?255&o.gzhead.name.charCodeAt(o.gzindex++):0,l(o,f)}while(0!==f);o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),0===f&&(o.gzindex=0,o.status=ct)}else o.status=ct;if(o.status===ct)if(o.gzhead.comment){d=o.pending;do{if(o.pending===o.pending_buf_size&&(o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),s(t),d=o.pending,o.pending===o.pending_buf_size)){f=1;break}f=o.gzindex<o.gzhead.comment.length?255&o.gzhead.comment.charCodeAt(o.gzindex++):0,l(o,f)}while(0!==f);o.gzhead.hcrc&&o.pending>d&&(t.adler=C(t.adler,o.pending_buf,o.pending-d,d)),0===f&&(o.status=bt)}else o.status=bt;if(o.status===bt&&(o.gzhead.hcrc?(o.pending+2>o.pending_buf_size&&s(t),o.pending+2<=o.pending_buf_size&&(l(o,255&t.adler),l(o,t.adler>>8&255),t.adler=0,o.status=gt)):o.status=gt),0!==o.pending){if(s(t),0===t.avail_out)return o.last_flush=-1,D}else if(0===t.avail_in&&n(e)<=n(a)&&e!==F)return i(t,K);if(o.status===mt&&0!==t.avail_in)return i(t,K);if(0!==t.avail_in||0!==o.lookahead||e!==O&&o.status!==mt){var c=o.strategy===Y?m(o,e):o.strategy===q?g(o,e):E[o.level].func(o,e);if((c===vt||c===kt)&&(o.status=mt),c===wt||c===vt)return 0===t.avail_out&&(o.last_flush=-1),D;if(c===pt&&(e===I?Z._tr_align(o):e!==T&&(Z._tr_stored_block(o,0,0,!1),e===U&&(r(o.head),0===o.lookahead&&(o.strstart=0,o.block_start=0,o.insert=0))),s(t),0===t.avail_out))return o.last_flush=-1,D}return e!==F?D:o.wrap<=0?L:(2===o.wrap?(l(o,255&t.adler),l(o,t.adler>>8&255),l(o,t.adler>>16&255),l(o,t.adler>>24&255),l(o,255&t.total_in),l(o,t.total_in>>8&255),l(o,t.total_in>>16&255),l(o,t.total_in>>24&255)):(h(o,t.adler>>>16),h(o,65535&t.adler)),s(t),o.wrap>0&&(o.wrap=-o.wrap),0!==o.pending?D:L)}function S(t){var e;return t&&t.state?(e=t.state.status,e!==ft&&e!==_t&&e!==ut&&e!==ct&&e!==bt&&e!==gt&&e!==mt?i(t,H):(t.state=null,e===gt?i(t,j):D)):H}var E,A=t("../utils/common"),Z=t("./trees"),R=t("./adler32"),C=t("./crc32"),N=t("./messages"),O=0,I=1,U=3,F=4,T=5,D=0,L=1,H=-2,j=-3,K=-5,M=-1,P=1,Y=2,q=3,G=4,X=0,W=2,J=8,Q=9,V=15,$=8,tt=29,et=256,at=et+1+tt,it=30,nt=19,rt=2*at+1,st=15,ot=3,lt=258,ht=lt+ot+1,dt=32,ft=42,_t=69,ut=73,ct=91,bt=103,gt=113,mt=666,wt=1,pt=2,vt=3,kt=4,xt=3,yt=function(t,e,a,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=i,this.func=n};E=[new yt(0,0,0,0,u),new yt(4,4,8,4,c),new yt(4,5,16,8,c),new yt(4,6,32,32,c),new yt(4,4,16,16,b),new yt(8,16,32,32,b),new yt(8,16,128,128,b),new yt(8,32,128,256,b),new yt(32,128,258,1024,b),new yt(32,258,258,4096,b)],a.deflateInit=z,a.deflateInit2=y,a.deflateReset=k,a.deflateResetKeep=v,a.deflateSetHeader=x,a.deflate=B,a.deflateEnd=S,a.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":3,"./adler32":5,"./crc32":7,"./messages":13,"./trees":14}],9:[function(t,e,a){"use strict";function i(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}e.exports=i},{}],10:[function(t,e,a){"use strict";var i=30,n=12;e.exports=function(t,e){var a,r,s,o,l,h,d,f,_,u,c,b,g,m,w,p,v,k,x,y,z,B,S,E,A;a=t.state,r=t.next_in,E=t.input,s=r+(t.avail_in-5),o=t.next_out,A=t.output,l=o-(e-t.avail_out),h=o+(t.avail_out-257),d=a.dmax,f=a.wsize,_=a.whave,u=a.wnext,c=a.window,b=a.hold,g=a.bits,m=a.lencode,w=a.distcode,p=(1<<a.lenbits)-1,v=(1<<a.distbits)-1;t:do{15>g&&(b+=E[r++]<<g,g+=8,b+=E[r++]<<g,g+=8),k=m[b&p];e:for(;;){if(x=k>>>24,b>>>=x,g-=x,x=k>>>16&255,0===x)A[o++]=65535&k;else{if(!(16&x)){if(0===(64&x)){k=m[(65535&k)+(b&(1<<x)-1)];continue e}if(32&x){a.mode=n;break t}t.msg="invalid literal/length code",a.mode=i;break t}y=65535&k,x&=15,x&&(x>g&&(b+=E[r++]<<g,g+=8),y+=b&(1<<x)-1,b>>>=x,g-=x),15>g&&(b+=E[r++]<<g,g+=8,b+=E[r++]<<g,g+=8),k=w[b&v];a:for(;;){if(x=k>>>24,b>>>=x,g-=x,x=k>>>16&255,!(16&x)){if(0===(64&x)){k=w[(65535&k)+(b&(1<<x)-1)];continue a}t.msg="invalid distance code",a.mode=i;break t}if(z=65535&k,x&=15,x>g&&(b+=E[r++]<<g,g+=8,x>g&&(b+=E[r++]<<g,g+=8)),z+=b&(1<<x)-1,z>d){t.msg="invalid distance too far back",a.mode=i;break t}if(b>>>=x,g-=x,x=o-l,z>x){if(x=z-x,x>_&&a.sane){t.msg="invalid distance too far back",a.mode=i;break t}if(B=0,S=c,0===u){if(B+=f-x,y>x){y-=x;do A[o++]=c[B++];while(--x);B=o-z,S=A}}else if(x>u){if(B+=f+u-x,x-=u,y>x){y-=x;do A[o++]=c[B++];while(--x);if(B=0,y>u){x=u,y-=x;do A[o++]=c[B++];while(--x);B=o-z,S=A}}}else if(B+=u-x,y>x){y-=x;do A[o++]=c[B++];while(--x);B=o-z,S=A}for(;y>2;)A[o++]=S[B++],A[o++]=S[B++],A[o++]=S[B++],y-=3;y&&(A[o++]=S[B++],y>1&&(A[o++]=S[B++]))}else{B=o-z;do A[o++]=A[B++],A[o++]=A[B++],A[o++]=A[B++],y-=3;while(y>2);y&&(A[o++]=A[B++],y>1&&(A[o++]=A[B++]))}break}}break}}while(s>r&&h>o);y=g>>3,r-=y,g-=y<<3,b&=(1<<g)-1,t.next_in=r,t.next_out=o,t.avail_in=s>r?5+(s-r):5-(r-s),t.avail_out=h>o?257+(h-o):257-(o-h),a.hold=b,a.bits=g}},{}],11:[function(t,e,a){"use strict";function i(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function n(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new m.Buf16(320),this.work=new m.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function r(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=F,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new m.Buf32(ct),e.distcode=e.distdyn=new m.Buf32(bt),e.sane=1,e.back=-1,A):C}function s(t){var e;return t&&t.state?(e=t.state,e.wsize=0,e.whave=0,e.wnext=0,r(t)):C}function o(t,e){var a,i;return t&&t.state?(i=t.state,0>e?(a=0,e=-e):(a=(e>>4)+1,48>e&&(e&=15)),e&&(8>e||e>15)?C:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=a,i.wbits=e,s(t))):C}function l(t,e){var a,i;return t?(i=new n,t.state=i,i.window=null,a=o(t,e),a!==A&&(t.state=null),a):C}function h(t){return l(t,mt)}function d(t){if(wt){var e;for(b=new m.Buf32(512),g=new m.Buf32(32),e=0;144>e;)t.lens[e++]=8;for(;256>e;)t.lens[e++]=9;for(;280>e;)t.lens[e++]=7;for(;288>e;)t.lens[e++]=8;for(k(y,t.lens,0,288,b,0,t.work,{bits:9}),e=0;32>e;)t.lens[e++]=5;k(z,t.lens,0,32,g,0,t.work,{bits:5}),wt=!1}t.lencode=b,t.lenbits=9,t.distcode=g,t.distbits=5}function f(t,e,a,i){var n,r=t.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new m.Buf8(r.wsize)),i>=r.wsize?(m.arraySet(r.window,e,a-r.wsize,r.wsize,0),r.wnext=0,r.whave=r.wsize):(n=r.wsize-r.wnext,n>i&&(n=i),m.arraySet(r.window,e,a-i,n,r.wnext),i-=n,i?(m.arraySet(r.window,e,a-i,i,0),r.wnext=i,r.whave=r.wsize):(r.wnext+=n,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=n))),0}function _(t,e){var a,n,r,s,o,l,h,_,u,c,b,g,ct,bt,gt,mt,wt,pt,vt,kt,xt,yt,zt,Bt,St=0,Et=new m.Buf8(4),At=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return C;a=t.state,a.mode===G&&(a.mode=X),o=t.next_out,r=t.output,h=t.avail_out,s=t.next_in,n=t.input,l=t.avail_in,_=a.hold,u=a.bits,c=l,b=h,yt=A;t:for(;;)switch(a.mode){case F:if(0===a.wrap){a.mode=X;break}for(;16>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(2&a.wrap&&35615===_){a.check=0,Et[0]=255&_,Et[1]=_>>>8&255,a.check=p(a.check,Et,2,0),_=0,u=0,a.mode=T;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&_)<<8)+(_>>8))%31){t.msg="incorrect header check",a.mode=ft;break}if((15&_)!==U){t.msg="unknown compression method",a.mode=ft;break}if(_>>>=4,u-=4,xt=(15&_)+8,0===a.wbits)a.wbits=xt;else if(xt>a.wbits){t.msg="invalid window size",a.mode=ft;break}a.dmax=1<<xt,t.adler=a.check=1,a.mode=512&_?Y:G,_=0,u=0;break;case T:for(;16>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(a.flags=_,(255&a.flags)!==U){t.msg="unknown compression method",a.mode=ft;break}if(57344&a.flags){t.msg="unknown header flags set",a.mode=ft;break}a.head&&(a.head.text=_>>8&1),512&a.flags&&(Et[0]=255&_,Et[1]=_>>>8&255,a.check=p(a.check,Et,2,0)),_=0,u=0,a.mode=D;case D:for(;32>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.head&&(a.head.time=_),512&a.flags&&(Et[0]=255&_,Et[1]=_>>>8&255,Et[2]=_>>>16&255,Et[3]=_>>>24&255,a.check=p(a.check,Et,4,0)),_=0,u=0,a.mode=L;case L:for(;16>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.head&&(a.head.xflags=255&_,a.head.os=_>>8),512&a.flags&&(Et[0]=255&_,Et[1]=_>>>8&255,a.check=p(a.check,Et,2,0)),_=0,u=0,a.mode=H;case H:if(1024&a.flags){for(;16>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.length=_,a.head&&(a.head.extra_len=_),512&a.flags&&(Et[0]=255&_,Et[1]=_>>>8&255,a.check=p(a.check,Et,2,0)),_=0,u=0}else a.head&&(a.head.extra=null);a.mode=j;case j:if(1024&a.flags&&(g=a.length,g>l&&(g=l),g&&(a.head&&(xt=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),m.arraySet(a.head.extra,n,s,g,xt)),512&a.flags&&(a.check=p(a.check,n,g,s)),l-=g,s+=g,a.length-=g),a.length))break t;a.length=0,a.mode=K;case K:if(2048&a.flags){if(0===l)break t;g=0;do xt=n[s+g++],a.head&&xt&&a.length<65536&&(a.head.name+=String.fromCharCode(xt));while(xt&&l>g);if(512&a.flags&&(a.check=p(a.check,n,g,s)),l-=g,s+=g,xt)break t}else a.head&&(a.head.name=null);a.length=0,a.mode=M;case M:if(4096&a.flags){if(0===l)break t;g=0;do xt=n[s+g++],a.head&&xt&&a.length<65536&&(a.head.comment+=String.fromCharCode(xt));while(xt&&l>g);if(512&a.flags&&(a.check=p(a.check,n,g,s)),l-=g,s+=g,xt)break t}else a.head&&(a.head.comment=null);a.mode=P;case P:if(512&a.flags){for(;16>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(_!==(65535&a.check)){t.msg="header crc mismatch",a.mode=ft;break}_=0,u=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),t.adler=a.check=0,a.mode=G;break;case Y:for(;32>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}t.adler=a.check=i(_),_=0,u=0,a.mode=q;case q:if(0===a.havedict)return t.next_out=o,t.avail_out=h,t.next_in=s,t.avail_in=l,a.hold=_,a.bits=u,R;t.adler=a.check=1,a.mode=G;case G:if(e===S||e===E)break t;case X:if(a.last){_>>>=7&u,u-=7&u,a.mode=lt;break}for(;3>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}switch(a.last=1&_,_>>>=1,u-=1,3&_){case 0:a.mode=W;break;case 1:if(d(a),a.mode=et,e===E){_>>>=2,u-=2;break t}break;case 2:a.mode=V;break;case 3:t.msg="invalid block type",a.mode=ft}_>>>=2,u-=2;break;case W:for(_>>>=7&u,u-=7&u;32>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if((65535&_)!==(_>>>16^65535)){t.msg="invalid stored block lengths",a.mode=ft;break}if(a.length=65535&_,_=0,u=0,a.mode=J,e===E)break t;case J:a.mode=Q;case Q:if(g=a.length){if(g>l&&(g=l),g>h&&(g=h),0===g)break t;m.arraySet(r,n,s,g,o),l-=g,s+=g,h-=g,o+=g,a.length-=g;break}a.mode=G;break;case V:for(;14>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(a.nlen=(31&_)+257,_>>>=5,u-=5,a.ndist=(31&_)+1,_>>>=5,u-=5,a.ncode=(15&_)+4,_>>>=4,u-=4,a.nlen>286||a.ndist>30){t.msg="too many length or distance symbols",a.mode=ft;break}a.have=0,a.mode=$;case $:for(;a.have<a.ncode;){for(;3>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.lens[At[a.have++]]=7&_,_>>>=3,u-=3}for(;a.have<19;)a.lens[At[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,zt={bits:a.lenbits},yt=k(x,a.lens,0,19,a.lencode,0,a.work,zt),a.lenbits=zt.bits,yt){t.msg="invalid code lengths set",a.mode=ft;break}a.have=0,a.mode=tt;case tt:for(;a.have<a.nlen+a.ndist;){for(;St=a.lencode[_&(1<<a.lenbits)-1],gt=St>>>24,mt=St>>>16&255,wt=65535&St,!(u>=gt);){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(16>wt)_>>>=gt,u-=gt,a.lens[a.have++]=wt;else{if(16===wt){for(Bt=gt+2;Bt>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(_>>>=gt,u-=gt,0===a.have){t.msg="invalid bit length repeat",a.mode=ft;break}xt=a.lens[a.have-1],g=3+(3&_),_>>>=2,u-=2}else if(17===wt){for(Bt=gt+3;Bt>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}_>>>=gt,u-=gt,xt=0,g=3+(7&_),_>>>=3,u-=3}else{for(Bt=gt+7;Bt>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}_>>>=gt,u-=gt,xt=0,g=11+(127&_),_>>>=7,u-=7}if(a.have+g>a.nlen+a.ndist){t.msg="invalid bit length repeat",a.mode=ft;break}for(;g--;)a.lens[a.have++]=xt}}if(a.mode===ft)break;if(0===a.lens[256]){t.msg="invalid code -- missing end-of-block",
a.mode=ft;break}if(a.lenbits=9,zt={bits:a.lenbits},yt=k(y,a.lens,0,a.nlen,a.lencode,0,a.work,zt),a.lenbits=zt.bits,yt){t.msg="invalid literal/lengths set",a.mode=ft;break}if(a.distbits=6,a.distcode=a.distdyn,zt={bits:a.distbits},yt=k(z,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,zt),a.distbits=zt.bits,yt){t.msg="invalid distances set",a.mode=ft;break}if(a.mode=et,e===E)break t;case et:a.mode=at;case at:if(l>=6&&h>=258){t.next_out=o,t.avail_out=h,t.next_in=s,t.avail_in=l,a.hold=_,a.bits=u,v(t,b),o=t.next_out,r=t.output,h=t.avail_out,s=t.next_in,n=t.input,l=t.avail_in,_=a.hold,u=a.bits,a.mode===G&&(a.back=-1);break}for(a.back=0;St=a.lencode[_&(1<<a.lenbits)-1],gt=St>>>24,mt=St>>>16&255,wt=65535&St,!(u>=gt);){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(mt&&0===(240&mt)){for(pt=gt,vt=mt,kt=wt;St=a.lencode[kt+((_&(1<<pt+vt)-1)>>pt)],gt=St>>>24,mt=St>>>16&255,wt=65535&St,!(u>=pt+gt);){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}_>>>=pt,u-=pt,a.back+=pt}if(_>>>=gt,u-=gt,a.back+=gt,a.length=wt,0===mt){a.mode=ot;break}if(32&mt){a.back=-1,a.mode=G;break}if(64&mt){t.msg="invalid literal/length code",a.mode=ft;break}a.extra=15&mt,a.mode=it;case it:if(a.extra){for(Bt=a.extra;Bt>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.length+=_&(1<<a.extra)-1,_>>>=a.extra,u-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=nt;case nt:for(;St=a.distcode[_&(1<<a.distbits)-1],gt=St>>>24,mt=St>>>16&255,wt=65535&St,!(u>=gt);){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(0===(240&mt)){for(pt=gt,vt=mt,kt=wt;St=a.distcode[kt+((_&(1<<pt+vt)-1)>>pt)],gt=St>>>24,mt=St>>>16&255,wt=65535&St,!(u>=pt+gt);){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}_>>>=pt,u-=pt,a.back+=pt}if(_>>>=gt,u-=gt,a.back+=gt,64&mt){t.msg="invalid distance code",a.mode=ft;break}a.offset=wt,a.extra=15&mt,a.mode=rt;case rt:if(a.extra){for(Bt=a.extra;Bt>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}a.offset+=_&(1<<a.extra)-1,_>>>=a.extra,u-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){t.msg="invalid distance too far back",a.mode=ft;break}a.mode=st;case st:if(0===h)break t;if(g=b-h,a.offset>g){if(g=a.offset-g,g>a.whave&&a.sane){t.msg="invalid distance too far back",a.mode=ft;break}g>a.wnext?(g-=a.wnext,ct=a.wsize-g):ct=a.wnext-g,g>a.length&&(g=a.length),bt=a.window}else bt=r,ct=o-a.offset,g=a.length;g>h&&(g=h),h-=g,a.length-=g;do r[o++]=bt[ct++];while(--g);0===a.length&&(a.mode=at);break;case ot:if(0===h)break t;r[o++]=a.length,h--,a.mode=at;break;case lt:if(a.wrap){for(;32>u;){if(0===l)break t;l--,_|=n[s++]<<u,u+=8}if(b-=h,t.total_out+=b,a.total+=b,b&&(t.adler=a.check=a.flags?p(a.check,r,b,o-b):w(a.check,r,b,o-b)),b=h,(a.flags?_:i(_))!==a.check){t.msg="incorrect data check",a.mode=ft;break}_=0,u=0}a.mode=ht;case ht:if(a.wrap&&a.flags){for(;32>u;){if(0===l)break t;l--,_+=n[s++]<<u,u+=8}if(_!==(4294967295&a.total)){t.msg="incorrect length check",a.mode=ft;break}_=0,u=0}a.mode=dt;case dt:yt=Z;break t;case ft:yt=N;break t;case _t:return O;case ut:default:return C}return t.next_out=o,t.avail_out=h,t.next_in=s,t.avail_in=l,a.hold=_,a.bits=u,(a.wsize||b!==t.avail_out&&a.mode<ft&&(a.mode<lt||e!==B))&&f(t,t.output,t.next_out,b-t.avail_out)?(a.mode=_t,O):(c-=t.avail_in,b-=t.avail_out,t.total_in+=c,t.total_out+=b,a.total+=b,a.wrap&&b&&(t.adler=a.check=a.flags?p(a.check,r,b,t.next_out-b):w(a.check,r,b,t.next_out-b)),t.data_type=a.bits+(a.last?64:0)+(a.mode===G?128:0)+(a.mode===et||a.mode===J?256:0),(0===c&&0===b||e===B)&&yt===A&&(yt=I),yt)}function u(t){if(!t||!t.state)return C;var e=t.state;return e.window&&(e.window=null),t.state=null,A}function c(t,e){var a;return t&&t.state?(a=t.state,0===(2&a.wrap)?C:(a.head=e,e.done=!1,A)):C}var b,g,m=t("../utils/common"),w=t("./adler32"),p=t("./crc32"),v=t("./inffast"),k=t("./inftrees"),x=0,y=1,z=2,B=4,S=5,E=6,A=0,Z=1,R=2,C=-2,N=-3,O=-4,I=-5,U=8,F=1,T=2,D=3,L=4,H=5,j=6,K=7,M=8,P=9,Y=10,q=11,G=12,X=13,W=14,J=15,Q=16,V=17,$=18,tt=19,et=20,at=21,it=22,nt=23,rt=24,st=25,ot=26,lt=27,ht=28,dt=29,ft=30,_t=31,ut=32,ct=852,bt=592,gt=15,mt=gt,wt=!0;a.inflateReset=s,a.inflateReset2=o,a.inflateResetKeep=r,a.inflateInit=h,a.inflateInit2=l,a.inflate=_,a.inflateEnd=u,a.inflateGetHeader=c,a.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":3,"./adler32":5,"./crc32":7,"./inffast":10,"./inftrees":12}],12:[function(t,e,a){"use strict";var i=t("../utils/common"),n=15,r=852,s=592,o=0,l=1,h=2,d=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],f=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],_=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],u=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,a,c,b,g,m,w){var p,v,k,x,y,z,B,S,E,A=w.bits,Z=0,R=0,C=0,N=0,O=0,I=0,U=0,F=0,T=0,D=0,L=null,H=0,j=new i.Buf16(n+1),K=new i.Buf16(n+1),M=null,P=0;for(Z=0;n>=Z;Z++)j[Z]=0;for(R=0;c>R;R++)j[e[a+R]]++;for(O=A,N=n;N>=1&&0===j[N];N--);if(O>N&&(O=N),0===N)return b[g++]=20971520,b[g++]=20971520,w.bits=1,0;for(C=1;N>C&&0===j[C];C++);for(C>O&&(O=C),F=1,Z=1;n>=Z;Z++)if(F<<=1,F-=j[Z],0>F)return-1;if(F>0&&(t===o||1!==N))return-1;for(K[1]=0,Z=1;n>Z;Z++)K[Z+1]=K[Z]+j[Z];for(R=0;c>R;R++)0!==e[a+R]&&(m[K[e[a+R]]++]=R);if(t===o?(L=M=m,z=19):t===l?(L=d,H-=257,M=f,P-=257,z=256):(L=_,M=u,z=-1),D=0,R=0,Z=C,y=g,I=O,U=0,k=-1,T=1<<O,x=T-1,t===l&&T>r||t===h&&T>s)return 1;for(var Y=0;;){Y++,B=Z-U,m[R]<z?(S=0,E=m[R]):m[R]>z?(S=M[P+m[R]],E=L[H+m[R]]):(S=96,E=0),p=1<<Z-U,v=1<<I,C=v;do v-=p,b[y+(D>>U)+v]=B<<24|S<<16|E|0;while(0!==v);for(p=1<<Z-1;D&p;)p>>=1;if(0!==p?(D&=p-1,D+=p):D=0,R++,0===--j[Z]){if(Z===N)break;Z=e[a+m[R]]}if(Z>O&&(D&x)!==k){for(0===U&&(U=O),y+=C,I=Z-U,F=1<<I;N>I+U&&(F-=j[I+U],!(0>=F));)I++,F<<=1;if(T+=1<<I,t===l&&T>r||t===h&&T>s)return 1;k=D&x,b[k]=O<<24|I<<16|y-g|0}}return 0!==D&&(b[y+D]=Z-U<<24|64<<16|0),w.bits=O,0}},{"../utils/common":3}],13:[function(t,e,a){"use strict";e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],14:[function(t,e,a){"use strict";function i(t){for(var e=t.length;--e>=0;)t[e]=0}function n(t){return 256>t?st[t]:st[256+(t>>>7)]}function r(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255}function s(t,e,a){t.bi_valid>G-a?(t.bi_buf|=e<<t.bi_valid&65535,r(t,t.bi_buf),t.bi_buf=e>>G-t.bi_valid,t.bi_valid+=a-G):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a)}function o(t,e,a){s(t,a[2*e],a[2*e+1])}function l(t,e){var a=0;do a|=1&t,t>>>=1,a<<=1;while(--e>0);return a>>>1}function h(t){16===t.bi_valid?(r(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}function d(t,e){var a,i,n,r,s,o,l=e.dyn_tree,h=e.max_code,d=e.stat_desc.static_tree,f=e.stat_desc.has_stree,_=e.stat_desc.extra_bits,u=e.stat_desc.extra_base,c=e.stat_desc.max_length,b=0;for(r=0;q>=r;r++)t.bl_count[r]=0;for(l[2*t.heap[t.heap_max]+1]=0,a=t.heap_max+1;Y>a;a++)i=t.heap[a],r=l[2*l[2*i+1]+1]+1,r>c&&(r=c,b++),l[2*i+1]=r,i>h||(t.bl_count[r]++,s=0,i>=u&&(s=_[i-u]),o=l[2*i],t.opt_len+=o*(r+s),f&&(t.static_len+=o*(d[2*i+1]+s)));if(0!==b){do{for(r=c-1;0===t.bl_count[r];)r--;t.bl_count[r]--,t.bl_count[r+1]+=2,t.bl_count[c]--,b-=2}while(b>0);for(r=c;0!==r;r--)for(i=t.bl_count[r];0!==i;)n=t.heap[--a],n>h||(l[2*n+1]!==r&&(t.opt_len+=(r-l[2*n+1])*l[2*n],l[2*n+1]=r),i--)}}function f(t,e,a){var i,n,r=new Array(q+1),s=0;for(i=1;q>=i;i++)r[i]=s=s+a[i-1]<<1;for(n=0;e>=n;n++){var o=t[2*n+1];0!==o&&(t[2*n]=l(r[o]++,o))}}function _(){var t,e,a,i,n,r=new Array(q+1);for(a=0,i=0;H-1>i;i++)for(lt[i]=a,t=0;t<1<<$[i];t++)ot[a++]=i;for(ot[a-1]=i,n=0,i=0;16>i;i++)for(ht[i]=n,t=0;t<1<<tt[i];t++)st[n++]=i;for(n>>=7;M>i;i++)for(ht[i]=n<<7,t=0;t<1<<tt[i]-7;t++)st[256+n++]=i;for(e=0;q>=e;e++)r[e]=0;for(t=0;143>=t;)nt[2*t+1]=8,t++,r[8]++;for(;255>=t;)nt[2*t+1]=9,t++,r[9]++;for(;279>=t;)nt[2*t+1]=7,t++,r[7]++;for(;287>=t;)nt[2*t+1]=8,t++,r[8]++;for(f(nt,K+1,r),t=0;M>t;t++)rt[2*t+1]=5,rt[2*t]=l(t,5);dt=new ut(nt,$,j+1,K,q),ft=new ut(rt,tt,0,M,q),_t=new ut(new Array(0),et,0,P,X)}function u(t){var e;for(e=0;K>e;e++)t.dyn_ltree[2*e]=0;for(e=0;M>e;e++)t.dyn_dtree[2*e]=0;for(e=0;P>e;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*W]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0}function c(t){t.bi_valid>8?r(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0}function b(t,e,a,i){c(t),i&&(r(t,a),r(t,~a)),R.arraySet(t.pending_buf,t.window,e,a,t.pending),t.pending+=a}function g(t,e,a,i){var n=2*e,r=2*a;return t[n]<t[r]||t[n]===t[r]&&i[e]<=i[a]}function m(t,e,a){for(var i=t.heap[a],n=a<<1;n<=t.heap_len&&(n<t.heap_len&&g(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!g(e,i,t.heap[n],t.depth));)t.heap[a]=t.heap[n],a=n,n<<=1;t.heap[a]=i}function w(t,e,a){var i,r,l,h,d=0;if(0!==t.last_lit)do i=t.pending_buf[t.d_buf+2*d]<<8|t.pending_buf[t.d_buf+2*d+1],r=t.pending_buf[t.l_buf+d],d++,0===i?o(t,r,e):(l=ot[r],o(t,l+j+1,e),h=$[l],0!==h&&(r-=lt[l],s(t,r,h)),i--,l=n(i),o(t,l,a),h=tt[l],0!==h&&(i-=ht[l],s(t,i,h)));while(d<t.last_lit);o(t,W,e)}function p(t,e){var a,i,n,r=e.dyn_tree,s=e.stat_desc.static_tree,o=e.stat_desc.has_stree,l=e.stat_desc.elems,h=-1;for(t.heap_len=0,t.heap_max=Y,a=0;l>a;a++)0!==r[2*a]?(t.heap[++t.heap_len]=h=a,t.depth[a]=0):r[2*a+1]=0;for(;t.heap_len<2;)n=t.heap[++t.heap_len]=2>h?++h:0,r[2*n]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=s[2*n+1]);for(e.max_code=h,a=t.heap_len>>1;a>=1;a--)m(t,r,a);n=l;do a=t.heap[1],t.heap[1]=t.heap[t.heap_len--],m(t,r,1),i=t.heap[1],t.heap[--t.heap_max]=a,t.heap[--t.heap_max]=i,r[2*n]=r[2*a]+r[2*i],t.depth[n]=(t.depth[a]>=t.depth[i]?t.depth[a]:t.depth[i])+1,r[2*a+1]=r[2*i+1]=n,t.heap[1]=n++,m(t,r,1);while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],d(t,e),f(r,h,t.bl_count)}function v(t,e,a){var i,n,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),e[2*(a+1)+1]=65535,i=0;a>=i;i++)n=s,s=e[2*(i+1)+1],++o<l&&n===s||(h>o?t.bl_tree[2*n]+=o:0!==n?(n!==r&&t.bl_tree[2*n]++,t.bl_tree[2*J]++):10>=o?t.bl_tree[2*Q]++:t.bl_tree[2*V]++,o=0,r=n,0===s?(l=138,h=3):n===s?(l=6,h=3):(l=7,h=4))}function k(t,e,a){var i,n,r=-1,l=e[1],h=0,d=7,f=4;for(0===l&&(d=138,f=3),i=0;a>=i;i++)if(n=l,l=e[2*(i+1)+1],!(++h<d&&n===l)){if(f>h){do o(t,n,t.bl_tree);while(0!==--h)}else 0!==n?(n!==r&&(o(t,n,t.bl_tree),h--),o(t,J,t.bl_tree),s(t,h-3,2)):10>=h?(o(t,Q,t.bl_tree),s(t,h-3,3)):(o(t,V,t.bl_tree),s(t,h-11,7));h=0,r=n,0===l?(d=138,f=3):n===l?(d=6,f=3):(d=7,f=4)}}function x(t){var e;for(v(t,t.dyn_ltree,t.l_desc.max_code),v(t,t.dyn_dtree,t.d_desc.max_code),p(t,t.bl_desc),e=P-1;e>=3&&0===t.bl_tree[2*at[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}function y(t,e,a,i){var n;for(s(t,e-257,5),s(t,a-1,5),s(t,i-4,4),n=0;i>n;n++)s(t,t.bl_tree[2*at[n]+1],3);k(t,t.dyn_ltree,e-1),k(t,t.dyn_dtree,a-1)}function z(t){var e,a=4093624447;for(e=0;31>=e;e++,a>>>=1)if(1&a&&0!==t.dyn_ltree[2*e])return N;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return O;for(e=32;j>e;e++)if(0!==t.dyn_ltree[2*e])return O;return N}function B(t){bt||(_(),bt=!0),t.l_desc=new ct(t.dyn_ltree,dt),t.d_desc=new ct(t.dyn_dtree,ft),t.bl_desc=new ct(t.bl_tree,_t),t.bi_buf=0,t.bi_valid=0,u(t)}function S(t,e,a,i){s(t,(U<<1)+(i?1:0),3),b(t,e,a,!0)}function E(t){s(t,F<<1,3),o(t,W,nt),h(t)}function A(t,e,a,i){var n,r,o=0;t.level>0?(t.strm.data_type===I&&(t.strm.data_type=z(t)),p(t,t.l_desc),p(t,t.d_desc),o=x(t),n=t.opt_len+3+7>>>3,r=t.static_len+3+7>>>3,n>=r&&(n=r)):n=r=a+5,n>=a+4&&-1!==e?S(t,e,a,i):t.strategy===C||r===n?(s(t,(F<<1)+(i?1:0),3),w(t,nt,rt)):(s(t,(T<<1)+(i?1:0),3),y(t,t.l_desc.max_code+1,t.d_desc.max_code+1,o+1),w(t,t.dyn_ltree,t.dyn_dtree)),u(t),i&&c(t)}function Z(t,e,a){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&a,t.last_lit++,0===e?t.dyn_ltree[2*a]++:(t.matches++,e--,t.dyn_ltree[2*(ot[a]+j+1)]++,t.dyn_dtree[2*n(e)]++),t.last_lit===t.lit_bufsize-1}var R=t("../utils/common"),C=4,N=0,O=1,I=2,U=0,F=1,T=2,D=3,L=258,H=29,j=256,K=j+1+H,M=30,P=19,Y=2*K+1,q=15,G=16,X=7,W=256,J=16,Q=17,V=18,$=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],tt=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],et=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],at=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],it=512,nt=new Array(2*(K+2));i(nt);var rt=new Array(2*M);i(rt);var st=new Array(it);i(st);var ot=new Array(L-D+1);i(ot);var lt=new Array(H);i(lt);var ht=new Array(M);i(ht);var dt,ft,_t,ut=function(t,e,a,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=i,this.max_length=n,this.has_stree=t&&t.length},ct=function(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e},bt=!1;a._tr_init=B,a._tr_stored_block=S,a._tr_flush_block=A,a._tr_tally=Z,a._tr_align=E},{"../utils/common":3}],15:[function(t,e,a){"use strict";function i(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}e.exports=i},{}],"/":[function(t,e,a){"use strict";var i=t("./lib/utils/common").assign,n=t("./lib/deflate"),r=t("./lib/inflate"),s=t("./lib/zlib/constants"),o={};i(o,n,r,s),e.exports=o},{"./lib/deflate":1,"./lib/inflate":2,"./lib/utils/common":3,"./lib/zlib/constants":6}]},{},[])("/")});
// ProgressBar.js 1.0.1
// https://kimmobrunfeldt.github.io/progressbar.js
// License: MIT

!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.ProgressBar=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(b,c,d){(function(){var b=this||Function("return this")(),e=function(){"use strict";function e(){}function f(a,b){var c;for(c in a)Object.hasOwnProperty.call(a,c)&&b(c)}function g(a,b){return f(b,function(c){a[c]=b[c]}),a}function h(a,b){f(b,function(c){"undefined"==typeof a[c]&&(a[c]=b[c])})}function i(a,b,c,d,e,f,g){var h,i,k,l=f>a?0:(a-f)/e;for(h in b)b.hasOwnProperty(h)&&(i=g[h],k="function"==typeof i?i:o[i],b[h]=j(c[h],d[h],k,l));return b}function j(a,b,c,d){return a+(b-a)*c(d)}function k(a,b){var c=n.prototype.filter,d=a._filterArgs;f(c,function(e){"undefined"!=typeof c[e][b]&&c[e][b].apply(a,d)})}function l(a,b,c,d,e,f,g,h,j,l,m){v=b+c+d,w=Math.min(m||u(),v),x=w>=v,y=d-(v-w),a.isPlaying()&&(x?(j(g,a._attachment,y),a.stop(!0)):(a._scheduleId=l(a._timeoutHandler,s),k(a,"beforeTween"),b+c>w?i(1,e,f,g,1,1,h):i(w,e,f,g,d,b+c,h),k(a,"afterTween"),j(e,a._attachment,y)))}function m(a,b){var c={},d=typeof b;return"string"===d||"function"===d?f(a,function(a){c[a]=b}):f(a,function(a){c[a]||(c[a]=b[a]||q)}),c}function n(a,b){this._currentState=a||{},this._configured=!1,this._scheduleFunction=p,"undefined"!=typeof b&&this.setConfig(b)}var o,p,q="linear",r=500,s=1e3/60,t=Date.now?Date.now:function(){return+new Date},u="undefined"!=typeof SHIFTY_DEBUG_NOW?SHIFTY_DEBUG_NOW:t;p="undefined"!=typeof window?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||window.mozCancelRequestAnimationFrame&&window.mozRequestAnimationFrame||setTimeout:setTimeout;var v,w,x,y;return n.prototype.tween=function(a){return this._isTweening?this:(void 0===a&&this._configured||this.setConfig(a),this._timestamp=u(),this._start(this.get(),this._attachment),this.resume())},n.prototype.setConfig=function(a){a=a||{},this._configured=!0,this._attachment=a.attachment,this._pausedAtTime=null,this._scheduleId=null,this._delay=a.delay||0,this._start=a.start||e,this._step=a.step||e,this._finish=a.finish||e,this._duration=a.duration||r,this._currentState=g({},a.from)||this.get(),this._originalState=this.get(),this._targetState=g({},a.to)||this.get();var b=this;this._timeoutHandler=function(){l(b,b._timestamp,b._delay,b._duration,b._currentState,b._originalState,b._targetState,b._easing,b._step,b._scheduleFunction)};var c=this._currentState,d=this._targetState;return h(d,c),this._easing=m(c,a.easing||q),this._filterArgs=[c,this._originalState,d,this._easing],k(this,"tweenCreated"),this},n.prototype.get=function(){return g({},this._currentState)},n.prototype.set=function(a){this._currentState=a},n.prototype.pause=function(){return this._pausedAtTime=u(),this._isPaused=!0,this},n.prototype.resume=function(){return this._isPaused&&(this._timestamp+=u()-this._pausedAtTime),this._isPaused=!1,this._isTweening=!0,this._timeoutHandler(),this},n.prototype.seek=function(a){a=Math.max(a,0);var b=u();return this._timestamp+a===0?this:(this._timestamp=b-a,this.isPlaying()||(this._isTweening=!0,this._isPaused=!1,l(this,this._timestamp,this._delay,this._duration,this._currentState,this._originalState,this._targetState,this._easing,this._step,this._scheduleFunction,b),this.pause()),this)},n.prototype.stop=function(a){return this._isTweening=!1,this._isPaused=!1,this._timeoutHandler=e,(b.cancelAnimationFrame||b.webkitCancelAnimationFrame||b.oCancelAnimationFrame||b.msCancelAnimationFrame||b.mozCancelRequestAnimationFrame||b.clearTimeout)(this._scheduleId),a&&(k(this,"beforeTween"),i(1,this._currentState,this._originalState,this._targetState,1,0,this._easing),k(this,"afterTween"),k(this,"afterTweenEnd"),this._finish.call(this,this._currentState,this._attachment)),this},n.prototype.isPlaying=function(){return this._isTweening&&!this._isPaused},n.prototype.setScheduleFunction=function(a){this._scheduleFunction=a},n.prototype.dispose=function(){var a;for(a in this)this.hasOwnProperty(a)&&delete this[a]},n.prototype.filter={},n.prototype.formula={linear:function(a){return a}},o=n.prototype.formula,g(n,{now:u,each:f,tweenProps:i,tweenProp:j,applyFilter:k,shallowCopy:g,defaults:h,composeEasingObject:m}),"function"==typeof SHIFTY_DEBUG_NOW&&(b.timeoutHandler=l),"object"==typeof d?c.exports=n:"function"==typeof a&&a.amd?a(function(){return n}):"undefined"==typeof b.Tweenable&&(b.Tweenable=n),n}();!function(){e.shallowCopy(e.prototype.formula,{easeInQuad:function(a){return Math.pow(a,2)},easeOutQuad:function(a){return-(Math.pow(a-1,2)-1)},easeInOutQuad:function(a){return(a/=.5)<1?.5*Math.pow(a,2):-.5*((a-=2)*a-2)},easeInCubic:function(a){return Math.pow(a,3)},easeOutCubic:function(a){return Math.pow(a-1,3)+1},easeInOutCubic:function(a){return(a/=.5)<1?.5*Math.pow(a,3):.5*(Math.pow(a-2,3)+2)},easeInQuart:function(a){return Math.pow(a,4)},easeOutQuart:function(a){return-(Math.pow(a-1,4)-1)},easeInOutQuart:function(a){return(a/=.5)<1?.5*Math.pow(a,4):-.5*((a-=2)*Math.pow(a,3)-2)},easeInQuint:function(a){return Math.pow(a,5)},easeOutQuint:function(a){return Math.pow(a-1,5)+1},easeInOutQuint:function(a){return(a/=.5)<1?.5*Math.pow(a,5):.5*(Math.pow(a-2,5)+2)},easeInSine:function(a){return-Math.cos(a*(Math.PI/2))+1},easeOutSine:function(a){return Math.sin(a*(Math.PI/2))},easeInOutSine:function(a){return-.5*(Math.cos(Math.PI*a)-1)},easeInExpo:function(a){return 0===a?0:Math.pow(2,10*(a-1))},easeOutExpo:function(a){return 1===a?1:-Math.pow(2,-10*a)+1},easeInOutExpo:function(a){return 0===a?0:1===a?1:(a/=.5)<1?.5*Math.pow(2,10*(a-1)):.5*(-Math.pow(2,-10*--a)+2)},easeInCirc:function(a){return-(Math.sqrt(1-a*a)-1)},easeOutCirc:function(a){return Math.sqrt(1-Math.pow(a-1,2))},easeInOutCirc:function(a){return(a/=.5)<1?-.5*(Math.sqrt(1-a*a)-1):.5*(Math.sqrt(1-(a-=2)*a)+1)},easeOutBounce:function(a){return 1/2.75>a?7.5625*a*a:2/2.75>a?7.5625*(a-=1.5/2.75)*a+.75:2.5/2.75>a?7.5625*(a-=2.25/2.75)*a+.9375:7.5625*(a-=2.625/2.75)*a+.984375},easeInBack:function(a){var b=1.70158;return a*a*((b+1)*a-b)},easeOutBack:function(a){var b=1.70158;return(a-=1)*a*((b+1)*a+b)+1},easeInOutBack:function(a){var b=1.70158;return(a/=.5)<1?.5*(a*a*(((b*=1.525)+1)*a-b)):.5*((a-=2)*a*(((b*=1.525)+1)*a+b)+2)},elastic:function(a){return-1*Math.pow(4,-8*a)*Math.sin((6*a-1)*(2*Math.PI)/2)+1},swingFromTo:function(a){var b=1.70158;return(a/=.5)<1?.5*(a*a*(((b*=1.525)+1)*a-b)):.5*((a-=2)*a*(((b*=1.525)+1)*a+b)+2)},swingFrom:function(a){var b=1.70158;return a*a*((b+1)*a-b)},swingTo:function(a){var b=1.70158;return(a-=1)*a*((b+1)*a+b)+1},bounce:function(a){return 1/2.75>a?7.5625*a*a:2/2.75>a?7.5625*(a-=1.5/2.75)*a+.75:2.5/2.75>a?7.5625*(a-=2.25/2.75)*a+.9375:7.5625*(a-=2.625/2.75)*a+.984375},bouncePast:function(a){return 1/2.75>a?7.5625*a*a:2/2.75>a?2-(7.5625*(a-=1.5/2.75)*a+.75):2.5/2.75>a?2-(7.5625*(a-=2.25/2.75)*a+.9375):2-(7.5625*(a-=2.625/2.75)*a+.984375)},easeFromTo:function(a){return(a/=.5)<1?.5*Math.pow(a,4):-.5*((a-=2)*Math.pow(a,3)-2)},easeFrom:function(a){return Math.pow(a,4)},easeTo:function(a){return Math.pow(a,.25)}})}(),function(){function a(a,b,c,d,e,f){function g(a){return((n*a+o)*a+p)*a}function h(a){return((q*a+r)*a+s)*a}function i(a){return(3*n*a+2*o)*a+p}function j(a){return 1/(200*a)}function k(a,b){return h(m(a,b))}function l(a){return a>=0?a:0-a}function m(a,b){var c,d,e,f,h,j;for(e=a,j=0;8>j;j++){if(f=g(e)-a,l(f)<b)return e;if(h=i(e),l(h)<1e-6)break;e-=f/h}if(c=0,d=1,e=a,c>e)return c;if(e>d)return d;for(;d>c;){if(f=g(e),l(f-a)<b)return e;a>f?c=e:d=e,e=.5*(d-c)+c}return e}var n=0,o=0,p=0,q=0,r=0,s=0;return p=3*b,o=3*(d-b)-p,n=1-p-o,s=3*c,r=3*(e-c)-s,q=1-s-r,k(a,j(f))}function b(b,c,d,e){return function(f){return a(f,b,c,d,e,1)}}e.setBezierFunction=function(a,c,d,f,g){var h=b(c,d,f,g);return h.displayName=a,h.x1=c,h.y1=d,h.x2=f,h.y2=g,e.prototype.formula[a]=h},e.unsetBezierFunction=function(a){delete e.prototype.formula[a]}}(),function(){function a(a,b,c,d,f,g){return e.tweenProps(d,b,a,c,1,g,f)}var b=new e;b._filterArgs=[],e.interpolate=function(c,d,f,g,h){var i=e.shallowCopy({},c),j=h||0,k=e.composeEasingObject(c,g||"linear");b.set({});var l=b._filterArgs;l.length=0,l[0]=i,l[1]=c,l[2]=d,l[3]=k,e.applyFilter(b,"tweenCreated"),e.applyFilter(b,"beforeTween");var m=a(c,i,d,f,k,j);return e.applyFilter(b,"afterTween"),m}}(),function(a){function b(a,b){var c,d=[],e=a.length;for(c=0;e>c;c++)d.push("_"+b+"_"+c);return d}function c(a){var b=a.match(v);return b?(1===b.length||a[0].match(u))&&b.unshift(""):b=["",""],b.join(A)}function d(b){a.each(b,function(a){var c=b[a];"string"==typeof c&&c.match(z)&&(b[a]=e(c))})}function e(a){return i(z,a,f)}function f(a){var b=g(a);return"rgb("+b[0]+","+b[1]+","+b[2]+")"}function g(a){return a=a.replace(/#/,""),3===a.length&&(a=a.split(""),a=a[0]+a[0]+a[1]+a[1]+a[2]+a[2]),B[0]=h(a.substr(0,2)),B[1]=h(a.substr(2,2)),B[2]=h(a.substr(4,2)),B}function h(a){return parseInt(a,16)}function i(a,b,c){var d=b.match(a),e=b.replace(a,A);if(d)for(var f,g=d.length,h=0;g>h;h++)f=d.shift(),e=e.replace(A,c(f));return e}function j(a){return i(x,a,k)}function k(a){for(var b=a.match(w),c=b.length,d=a.match(y)[0],e=0;c>e;e++)d+=parseInt(b[e],10)+",";return d=d.slice(0,-1)+")"}function l(d){var e={};return a.each(d,function(a){var f=d[a];if("string"==typeof f){var g=r(f);e[a]={formatString:c(f),chunkNames:b(g,a)}}}),e}function m(b,c){a.each(c,function(a){for(var d=b[a],e=r(d),f=e.length,g=0;f>g;g++)b[c[a].chunkNames[g]]=+e[g];delete b[a]})}function n(b,c){a.each(c,function(a){var d=b[a],e=o(b,c[a].chunkNames),f=p(e,c[a].chunkNames);d=q(c[a].formatString,f),b[a]=j(d)})}function o(a,b){for(var c,d={},e=b.length,f=0;e>f;f++)c=b[f],d[c]=a[c],delete a[c];return d}function p(a,b){C.length=0;for(var c=b.length,d=0;c>d;d++)C.push(a[b[d]]);return C}function q(a,b){for(var c=a,d=b.length,e=0;d>e;e++)c=c.replace(A,+b[e].toFixed(4));return c}function r(a){return a.match(w)}function s(b,c){a.each(c,function(a){var d,e=c[a],f=e.chunkNames,g=f.length,h=b[a];if("string"==typeof h){var i=h.split(" "),j=i[i.length-1];for(d=0;g>d;d++)b[f[d]]=i[d]||j}else for(d=0;g>d;d++)b[f[d]]=h;delete b[a]})}function t(b,c){a.each(c,function(a){var d=c[a],e=d.chunkNames,f=e.length,g=b[e[0]],h=typeof g;if("string"===h){for(var i="",j=0;f>j;j++)i+=" "+b[e[j]],delete b[e[j]];b[a]=i.substr(1)}else b[a]=g})}var u=/(\d|\-|\.)/,v=/([^\-0-9\.]+)/g,w=/[0-9.\-]+/g,x=new RegExp("rgb\\("+w.source+/,\s*/.source+w.source+/,\s*/.source+w.source+"\\)","g"),y=/^.*\(/,z=/#([0-9]|[a-f]){3,6}/gi,A="VAL",B=[],C=[];a.prototype.filter.token={tweenCreated:function(a,b,c,e){d(a),d(b),d(c),this._tokenData=l(a)},beforeTween:function(a,b,c,d){s(d,this._tokenData),m(a,this._tokenData),m(b,this._tokenData),m(c,this._tokenData)},afterTween:function(a,b,c,d){n(a,this._tokenData),n(b,this._tokenData),n(c,this._tokenData),t(d,this._tokenData)}}}(e)}).call(null)},{}],2:[function(a,b,c){var d=a("./shape"),e=a("./utils"),f=function(a,b){this._pathTemplate="M 50,50 m 0,-{radius} a {radius},{radius} 0 1 1 0,{2radius} a {radius},{radius} 0 1 1 0,-{2radius}",this.containerAspectRatio=1,d.apply(this,arguments)};f.prototype=new d,f.prototype.constructor=f,f.prototype._pathString=function(a){var b=a.strokeWidth;a.trailWidth&&a.trailWidth>a.strokeWidth&&(b=a.trailWidth);var c=50-b/2;return e.render(this._pathTemplate,{radius:c,"2radius":2*c})},f.prototype._trailString=function(a){return this._pathString(a)},b.exports=f},{"./shape":7,"./utils":8}],3:[function(a,b,c){var d=a("./shape"),e=a("./utils"),f=function(a,b){this._pathTemplate="M 0,{center} L 100,{center}",d.apply(this,arguments)};f.prototype=new d,f.prototype.constructor=f,f.prototype._initializeSvg=function(a,b){a.setAttribute("viewBox","0 0 100 "+b.strokeWidth),a.setAttribute("preserveAspectRatio","none")},f.prototype._pathString=function(a){return e.render(this._pathTemplate,{center:a.strokeWidth/2})},f.prototype._trailString=function(a){return this._pathString(a)},b.exports=f},{"./shape":7,"./utils":8}],4:[function(a,b,c){b.exports={Line:a("./line"),Circle:a("./circle"),SemiCircle:a("./semicircle"),Path:a("./path"),Shape:a("./shape"),utils:a("./utils")}},{"./circle":2,"./line":3,"./path":5,"./semicircle":6,"./shape":7,"./utils":8}],5:[function(a,b,c){var d=a("shifty"),e=a("./utils"),f={easeIn:"easeInCubic",easeOut:"easeOutCubic",easeInOut:"easeInOutCubic"},g=function h(a,b){if(!(this instanceof h))throw new Error("Constructor was called without new keyword");b=e.extend({duration:800,easing:"linear",from:{},to:{},step:function(){}},b);var c;c=e.isString(a)?document.querySelector(a):a,this.path=c,this._opts=b,this._tweenable=null;var d=this.path.getTotalLength();this.path.style.strokeDasharray=d+" "+d,this.set(0)};g.prototype.value=function(){var a=this._getComputedDashOffset(),b=this.path.getTotalLength(),c=1-a/b;return parseFloat(c.toFixed(6),10)},g.prototype.set=function(a){this.stop(),this.path.style.strokeDashoffset=this._progressToOffset(a);var b=this._opts.step;if(e.isFunction(b)){var c=this._easing(this._opts.easing),d=this._calculateTo(a,c),f=this._opts.shape||this;b(d,f,this._opts.attachment)}},g.prototype.stop=function(){this._stopTween(),this.path.style.strokeDashoffset=this._getComputedDashOffset()},g.prototype.animate=function(a,b,c){b=b||{},e.isFunction(b)&&(c=b,b={});var f=e.extend({},b),g=e.extend({},this._opts);b=e.extend(g,b);var h=this._easing(b.easing),i=this._resolveFromAndTo(a,h,f);this.stop(),this.path.getBoundingClientRect();var j=this._getComputedDashOffset(),k=this._progressToOffset(a),l=this;this._tweenable=new d,this._tweenable.tween({from:e.extend({offset:j},i.from),to:e.extend({offset:k},i.to),duration:b.duration,easing:h,step:function(a){l.path.style.strokeDashoffset=a.offset;var c=b.shape||l;b.step(a,c,b.attachment)},finish:function(a){e.isFunction(c)&&c()}})},g.prototype._getComputedDashOffset=function(){var a=window.getComputedStyle(this.path,null);return parseFloat(a.getPropertyValue("stroke-dashoffset"),10)},g.prototype._progressToOffset=function(a){var b=this.path.getTotalLength();return b-a*b},g.prototype._resolveFromAndTo=function(a,b,c){return c.from&&c.to?{from:c.from,to:c.to}:{from:this._calculateFrom(b),to:this._calculateTo(a,b)}},g.prototype._calculateFrom=function(a){return d.interpolate(this._opts.from,this._opts.to,this.value(),a)},g.prototype._calculateTo=function(a,b){return d.interpolate(this._opts.from,this._opts.to,a,b)},g.prototype._stopTween=function(){null!==this._tweenable&&(this._tweenable.stop(),this._tweenable=null)},g.prototype._easing=function(a){return f.hasOwnProperty(a)?f[a]:a},b.exports=g},{"./utils":8,shifty:1}],6:[function(a,b,c){var d=a("./shape"),e=a("./circle"),f=a("./utils"),g=function(a,b){this._pathTemplate="M 50,50 m -{radius},0 a {radius},{radius} 0 1 1 {2radius},0",this.containerAspectRatio=2,d.apply(this,arguments)};g.prototype=new d,g.prototype.constructor=g,g.prototype._initializeSvg=function(a,b){a.setAttribute("viewBox","0 0 100 50")},g.prototype._initializeTextContainer=function(a,b,c){a.text.style&&(c.style.top="auto",c.style.bottom="0",a.text.alignToBottom?f.setStyle(c,"transform","translate(-50%, 0)"):f.setStyle(c,"transform","translate(-50%, 50%)"))},g.prototype._pathString=e.prototype._pathString,g.prototype._trailString=e.prototype._trailString,b.exports=g},{"./circle":2,"./shape":7,"./utils":8}],7:[function(a,b,c){var d=a("./path"),e=a("./utils"),f="Object is destroyed",g=function h(a,b){if(!(this instanceof h))throw new Error("Constructor was called without new keyword");if(0!==arguments.length){this._opts=e.extend({color:"#555",strokeWidth:1,trailColor:null,trailWidth:null,fill:null,text:{style:{color:null,position:"absolute",left:"50%",top:"50%",padding:0,margin:0,transform:{prefix:!0,value:"translate(-50%, -50%)"}},autoStyleContainer:!0,alignToBottom:!0,value:null,className:"progressbar-text"},svgStyle:{display:"block",width:"100%"},warnings:!1},b,!0),e.isObject(b)&&void 0!==b.svgStyle&&(this._opts.svgStyle=b.svgStyle),e.isObject(b)&&e.isObject(b.text)&&void 0!==b.text.style&&(this._opts.text.style=b.text.style);var c,f=this._createSvgView(this._opts);if(c=e.isString(a)?document.querySelector(a):a,!c)throw new Error("Container does not exist: "+a);this._container=c,this._container.appendChild(f.svg),this._opts.warnings&&this._warnContainerAspectRatio(this._container),this._opts.svgStyle&&e.setStyles(f.svg,this._opts.svgStyle),this.svg=f.svg,this.path=f.path,this.trail=f.trail,this.text=null;var g=e.extend({attachment:void 0,shape:this},this._opts);this._progressPath=new d(f.path,g),e.isObject(this._opts.text)&&null!==this._opts.text.value&&this.setText(this._opts.text.value)}};g.prototype.animate=function(a,b,c){if(null===this._progressPath)throw new Error(f);this._progressPath.animate(a,b,c)},g.prototype.stop=function(){if(null===this._progressPath)throw new Error(f);void 0!==this._progressPath&&this._progressPath.stop()},g.prototype.destroy=function(){if(null===this._progressPath)throw new Error(f);this.stop(),this.svg.parentNode.removeChild(this.svg),this.svg=null,this.path=null,this.trail=null,this._progressPath=null,null!==this.text&&(this.text.parentNode.removeChild(this.text),this.text=null)},g.prototype.set=function(a){if(null===this._progressPath)throw new Error(f);this._progressPath.set(a)},g.prototype.value=function(){if(null===this._progressPath)throw new Error(f);return void 0===this._progressPath?0:this._progressPath.value()},g.prototype.setText=function(a){if(null===this._progressPath)throw new Error(f);null===this.text&&(this.text=this._createTextContainer(this._opts,this._container),this._container.appendChild(this.text)),e.isObject(a)?(e.removeChildren(this.text),this.text.appendChild(a)):this.text.innerHTML=a},g.prototype._createSvgView=function(a){var b=document.createElementNS("http://www.w3.org/2000/svg","svg");this._initializeSvg(b,a);var c=null;(a.trailColor||a.trailWidth)&&(c=this._createTrail(a),b.appendChild(c));var d=this._createPath(a);return b.appendChild(d),{svg:b,path:d,trail:c}},g.prototype._initializeSvg=function(a,b){a.setAttribute("viewBox","0 0 100 100")},g.prototype._createPath=function(a){var b=this._pathString(a);return this._createPathElement(b,a)},g.prototype._createTrail=function(a){var b=this._trailString(a),c=e.extend({},a);return c.trailColor||(c.trailColor="#eee"),c.trailWidth||(c.trailWidth=c.strokeWidth),c.color=c.trailColor,c.strokeWidth=c.trailWidth,c.fill=null,this._createPathElement(b,c)},g.prototype._createPathElement=function(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg","path");return c.setAttribute("d",a),c.setAttribute("stroke",b.color),c.setAttribute("stroke-width",b.strokeWidth),b.fill?c.setAttribute("fill",b.fill):c.setAttribute("fill-opacity","0"),c},g.prototype._createTextContainer=function(a,b){var c=document.createElement("div");c.className=a.text.className;var d=a.text.style;return d&&(a.text.autoStyleContainer&&(b.style.position="relative"),e.setStyles(c,d),d.color||(c.style.color=a.color)),this._initializeTextContainer(a,b,c),c},g.prototype._initializeTextContainer=function(a,b,c){},g.prototype._pathString=function(a){throw new Error("Override this function for each progress bar")},g.prototype._trailString=function(a){throw new Error("Override this function for each progress bar")},g.prototype._warnContainerAspectRatio=function(a){if(this.containerAspectRatio){var b=window.getComputedStyle(a,null),c=parseFloat(b.getPropertyValue("width"),10),d=parseFloat(b.getPropertyValue("height"),10);e.floatEquals(this.containerAspectRatio,c/d)||(console.warn("Incorrect aspect ratio of container","#"+a.id,"detected:",b.getPropertyValue("width")+"(width)","/",b.getPropertyValue("height")+"(height)","=",c/d),console.warn("Aspect ratio of should be",this.containerAspectRatio))}},b.exports=g},{"./path":5,"./utils":8}],8:[function(a,b,c){function d(a,b,c){a=a||{},b=b||{},c=c||!1;for(var e in b)if(b.hasOwnProperty(e)){var f=a[e],g=b[e];c&&l(f)&&l(g)?a[e]=d(f,g,c):a[e]=g}return a}function e(a,b){var c=a;for(var d in b)if(b.hasOwnProperty(d)){var e=b[d],f="\\{"+d+"\\}",g=new RegExp(f,"g");c=c.replace(g,e)}return c}function f(a,b,c){for(var d=a.style,e=0;e<p.length;++e){var f=p[e];d[f+h(b)]=c}d[b]=c}function g(a,b){m(b,function(b,c){null!==b&&void 0!==b&&(l(b)&&b.prefix===!0?f(a,c,b.value):a.style[c]=b)})}function h(a){return a.charAt(0).toUpperCase()+a.slice(1)}function i(a){return"string"==typeof a||a instanceof String}function j(a){return"function"==typeof a}function k(a){return"[object Array]"===Object.prototype.toString.call(a)}function l(a){if(k(a))return!1;var b=typeof a;return"object"===b&&!!a}function m(a,b){for(var c in a)if(a.hasOwnProperty(c)){var d=a[c];b(d,c)}}function n(a,b){return Math.abs(a-b)<q}function o(a){for(;a.firstChild;)a.removeChild(a.firstChild)}var p="Webkit Moz O ms".split(" "),q=.001;b.exports={extend:d,render:e,setStyle:f,setStyles:g,capitalize:h,isString:i,isFunction:j,isObject:l,forEachObject:m,floatEquals:n,removeChildren:o}},{}]},{},[4])(4)});
//# sourceMappingURL=progressbar.min.js.map
/* ===========================================================
 *
 *  Name:          selectordie.min.js
 *  Updated:       2014-10-11
 *  Version:       0.1.8
 *  Created by:    Per V @ Vst.mn
 *  What?:         Minified version of the Select or Die JS
 *
 *  Copyright (c) 2014 Per Vestman
 *  Dual licensed under the MIT and GPL licenses.
 *
 *  Beards, Rock & Loud Guns | Cogs 'n Kegs
 *
 * =========================================================== */

!function(a){"use strict";a.fn.selectOrDie=function(b){var f,g,c={customID:null,customClass:"",placeholder:null,placeholderOption:!1,prefix:null,cycle:!1,stripEmpty:!1,links:!1,linksExternal:!1,size:0,tabIndex:0,onChange:a.noop},d={},e=!1,h={initSoD:function(b){return d=a.extend({},c,b),this.each(function(){if(a(this).parent().hasClass("sod_select"))console.log("Select or Die: It looks like the SoD already exists");else{var u,v,w,b=a(this),c=b.data("custom-id")?b.data("custom-id"):d.customID,e=b.data("custom-class")?b.data("custom-class"):d.customClass,f=b.data("prefix")?b.data("prefix"):d.prefix,g=b.data("placeholder")?b.data("placeholder"):d.placeholder,i=b.data("placeholder-option")?b.data("placeholder-option"):d.placeholderOption,j=b.data("cycle")?b.data("cycle"):d.cycle,k=b.data("links")?b.data("links"):d.links,l=b.data("links-external")?b.data("links-external"):d.linksExternal,m=parseInt(b.data("size"))?b.data("size"):d.size,n=parseInt(b.data("tabindex"))?b.data("tabindex"):d.tabIndex?d.tabIndex:b.attr("tabindex")?b.attr("tabindex"):d.tabIndex,o=b.data("strip-empty")?b.data("strip-empty"):d.stripEmpty,p=b.prop("title")?b.prop("title"):null,q=b.is(":disabled")?" disabled":"",r="",s="",t=0;f&&(r='<span class="sod_prefix">'+f+"</span> "),s+=g&&!f?'<span class="sod_label sod_placeholder">'+g+"</span>":'<span class="sod_label">'+r+"</span>",u=a("<span/>",{id:c,"class":"sod_select "+e+q,title:p,tabindex:n,html:s,"data-cycle":j,"data-links":k,"data-links-external":l,"data-placeholder":g,"data-placeholder-option":i,"data-prefix":f,"data-filter":""}).insertAfter(this),h.isTouch()&&u.addClass("touch"),v=a("<span/>",{"class":"sod_list_wrapper"}).appendTo(u),w=a("<span/>",{"class":"sod_list"}).appendTo(v),a("option, optgroup",b).each(function(b){var c=a(this);o&&!a.trim(c.text())?c.remove():0===b&&i&&!r?h.populateSoD(c,w,u,!0):h.populateSoD(c,w,u,!1)}),m&&(v.show(),a(".sod_option:lt("+m+")",w).each(function(){t+=a(this).outerHeight()}),v.removeAttr("style"),w.css({"max-height":t})),b.appendTo(u),u.on("focusin",h.focusSod).on("click",h.triggerSod).on("click",".sod_option",h.optionClick).on("mousemove",".sod_option",h.optionHover).on("keydown",h.keyboardUse),b.on("change",h.selectChange),a(document).on("click","label[for='"+b.attr("id")+"']",function(a){a.preventDefault(),u.focus()})}})},populateSoD:function(b,c,d,e){var f=d.data("placeholder"),g=d.data("placeholder-option"),h=d.data("prefix"),i=d.find(".sod_label"),j=b.parent(),k=b.text(),l=b.val(),m=b.data("custom-id")?b.data("custom-id"):null,n=b.data("custom-class")?b.data("custom-class"):"",o=b.is(":disabled")?" disabled ":"",p=b.is(":selected")?" selected active ":"",q=b.data("link")?" link ":"",r=b.data("link-external")?" linkexternal":"",s=b.prop("label");b.is("option")?(a("<span/>",{"class":"sod_option "+n+o+p+q+r,id:m,title:k,html:k,"data-value":l}).appendTo(c),e&&!h?(d.data("label",k),d.data("placeholder",k),b.prop("disabled",!0),c.find(".sod_option:last").addClass("is-placeholder disabled"),p&&i.addClass("sod_placeholder")):p&&f&&!g&&!h?d.data("label",f):p&&d.data("label",k),(p&&!f||p&&g||p&&h)&&i.append(k),j.is("optgroup")&&(c.find(".sod_option:last").addClass("groupchild"),j.is(":disabled")&&c.find(".sod_option:last").addClass("disabled"))):a("<span/>",{"class":"sod_option optgroup "+o,title:s,html:s,"data-label":s}).appendTo(c)},focusSod:function(){var b=a(this);b.hasClass("disabled")?h.blurSod(b):(h.blurSod(a(".sod_select.focus").not(b)),b.addClass("focus"),a("html").on("click.sodBlur",function(){h.blurSod(b)}))},triggerSod:function(b){b.stopPropagation();var c=a(this),d=c.find(".sod_list"),e=c.data("placeholder"),f=c.find(".active"),i=c.find(".selected");c.hasClass("disabled")||c.hasClass("open")||c.hasClass("touch")?(clearTimeout(g),c.removeClass("open"),e&&(c.find(".sod_label").get(0).lastChild.nodeValue=f.text())):(c.addClass("open"),e&&!c.data("prefix")&&c.find(".sod_label").addClass("sod_placeholder").html(e),h.listScroll(d,i),h.checkViewport(c,d))},keyboardUse:function(b){var l,m,n,c=a(this),d=c.find(".sod_list"),g=c.find(".sod_option"),i=c.find(".sod_label"),j=c.data("cycle"),k=g.filter(".active");return b.which>36&&b.which<41?(37===b.which||38===b.which?(m=k.prevAll(":not('.disabled, .optgroup')").first(),n=g.not(".disabled, .optgroup").last()):(39===b.which||40===b.which)&&(m=k.nextAll(":not('.disabled, .optgroup')").first(),n=g.not(".disabled, .optgroup").first()),!m.hasClass("sod_option")&&j&&(m=n),(m.hasClass("sod_option")||j)&&(k.removeClass("active"),m.addClass("active"),i.get(0).lastChild.nodeValue=m.text(),h.listScroll(d,m),c.hasClass("open")||(e=!0)),!1):(13===b.which||32===b.which&&c.hasClass("open")&&(" "===c.data("filter")[0]||""===c.data("filter"))?(b.preventDefault(),k.click()):32!==b.which||c.hasClass("open")||" "!==c.data("filter")[0]&&""!==c.data("filter")?27===b.which&&h.blurSod(c):(b.preventDefault(),e=!1,c.click()),0!==b.which&&(clearTimeout(f),c.data("filter",c.data("filter")+String.fromCharCode(b.which)),l=g.filter(function(){return 0===a(this).text().toLowerCase().indexOf(c.data("filter").toLowerCase())}).not(".disabled, .optgroup").first(),l.length&&(k.removeClass("active"),l.addClass("active"),h.listScroll(d,l),i.get(0).lastChild.nodeValue=l.text(),c.hasClass("open")||(e=!0)),f=setTimeout(function(){c.data("filter","")},500)),void 0)},optionHover:function(){var b=a(this);b.hasClass("disabled")||b.hasClass("optgroup")||b.siblings().removeClass("active").end().addClass("active")},optionClick:function(b){b.stopPropagation();var c=a(this),d=c.closest(".sod_select"),e=c.hasClass("disabled"),f=c.hasClass("optgroup"),h=d.find(".sod_option:not('.optgroup')").index(this);d.hasClass("touch")||(e||f||(d.find(".selected, .sod_placeholder").removeClass("selected sod_placeholder"),c.addClass("selected"),d.find("select option")[h].selected=!0,d.find("select").change()),clearTimeout(g),d.removeClass("open"))},selectChange:function(){var b=a(this),c=b.find(":selected"),e=c.text(),f=b.closest(".sod_select");f.find(".sod_label").get(0).lastChild.nodeValue=e,f.data("label",e),d.onChange.call(this),!f.data("links")&&!c.data("link")||c.data("link-external")?(f.data("links-external")||c.data("link-external"))&&window.open(c.val(),"_blank"):window.location.href=c.val()},blurSod:function(b){if(a("body").find(b).length){var c=b.data("label"),d=b.data("placeholder"),f=b.find(".active"),h=b.find(".selected"),i=!1;clearTimeout(g),e&&!f.hasClass("selected")?(f.click(),i=!0):f.hasClass("selected")||(f.removeClass("active"),h.addClass("active")),!i&&d?b.find(".sod_label").get(0).lastChild.nodeValue=h.text():i||(b.find(".sod_label").get(0).lastChild.nodeValue=c),e=!1,b.removeClass("open focus"),b.blur(),a("html").off(".sodBlur")}},checkViewport:function(b,c){var d=b[0].getBoundingClientRect(),e=c.outerHeight();d.bottom+e+10>a(window).height()&&d.top-e>10?b.addClass("above"):b.removeClass("above"),g=setTimeout(function(){h.checkViewport(b,c)},200)},listScroll:function(a,b){var c=a[0].getBoundingClientRect(),d=b[0].getBoundingClientRect();c.top>d.top?a.scrollTop(a.scrollTop()-c.top+d.top):c.bottom<d.bottom&&a.scrollTop(a.scrollTop()-c.bottom+d.bottom)},isTouch:function(){return"ontouchstart"in window||navigator.MaxTouchPoints>0||navigator.msMaxTouchPoints>0}},i={destroy:function(){return this.each(function(){var b=a(this),c=b.parent();c.hasClass("sod_select")?(b.off("change"),c.find("span").remove(),b.unwrap()):console.log("Select or Die: There's no SoD to destroy")})},update:function(){return this.each(function(){var b=a(this),c=b.parent(),d=c.find(".sod_list:first");c.hasClass("sod_select")?(d.empty(),c.find(".sod_label").get(0).lastChild.nodeValue="",b.is(":disabled")&&c.addClass("disabled"),a("option, optgroup",b).each(function(){h.populateSoD(a(this),d,c)})):console.log("Select or Die: There's no SoD to update")})},disable:function(b){return this.each(function(){var c=a(this),d=c.parent();d.hasClass("sod_select")?"undefined"!=typeof b?(d.find(".sod_list:first .sod_option[data-value='"+b+"']").addClass("disabled"),d.find(".sod_list:first .sod_option[data-label='"+b+"']").nextUntil(":not(.groupchild)").addClass("disabled"),a("option[value='"+b+"'], optgroup[label='"+b+"']",this).prop("disabled",!0)):d.hasClass("sod_select")&&(d.addClass("disabled"),c.prop("disabled",!0)):console.log("Select or Die: There's no SoD to disable")})},enable:function(b){return this.each(function(){var c=a(this),d=c.parent();d.hasClass("sod_select")?"undefined"!=typeof b?(d.find(".sod_list:first .sod_option[data-value='"+b+"']").removeClass("disabled"),d.find(".sod_list:first .sod_option[data-label='"+b+"']").nextUntil(":not(.groupchild)").removeClass("disabled"),a("option[value='"+b+"'], optgroup[label='"+b+"']",this).prop("disabled",!1)):d.hasClass("sod_select")&&(d.removeClass("disabled"),c.prop("disabled",!1)):console.log("Select or Die: There's no SoD to enable")})}};return i[b]?i[b].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof b&&b?(a.error('Select or Die: Oh no! No such method "'+b+'" for the SoD instance'),void 0):h.initSoD.apply(this,arguments)}}(jQuery);

/*! tooltipster v4.2.5 */!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("jquery")):b(jQuery)}(this,function(a){function b(a){this.$container,this.constraints=null,this.__$tooltip,this.__init(a)}function c(b,c){var d=!0;return a.each(b,function(a,e){return void 0===c[a]||b[a]!==c[a]?(d=!1,!1):void 0}),d}function d(b){var c=b.attr("id"),d=c?h.window.document.getElementById(c):null;return d?d===b[0]:a.contains(h.window.document.body,b[0])}function e(){if(!g)return!1;var a=g.document.body||g.document.documentElement,b=a.style,c="transition",d=["Moz","Webkit","Khtml","O","ms"];if("string"==typeof b[c])return!0;c=c.charAt(0).toUpperCase()+c.substr(1);for(var e=0;e<d.length;e++)if("string"==typeof b[d[e]+c])return!0;return!1}var f={animation:"fade",animationDuration:350,content:null,contentAsHTML:!1,contentCloning:!1,debug:!0,delay:300,delayTouch:[300,500],functionInit:null,functionBefore:null,functionReady:null,functionAfter:null,functionFormat:null,IEmin:6,interactive:!1,multiple:!1,parent:null,plugins:["sideTip"],repositionOnScroll:!1,restoration:"none",selfDestruction:!0,theme:[],timer:0,trackerInterval:500,trackOrigin:!1,trackTooltip:!1,trigger:"hover",triggerClose:{click:!1,mouseleave:!1,originClick:!1,scroll:!1,tap:!1,touchleave:!1},triggerOpen:{click:!1,mouseenter:!1,tap:!1,touchstart:!1},updateAnimation:"rotate",zIndex:9999999},g="undefined"!=typeof window?window:null,h={hasTouchCapability:!(!g||!("ontouchstart"in g||g.DocumentTouch&&g.document instanceof g.DocumentTouch||g.navigator.maxTouchPoints)),hasTransitions:e(),IE:!1,semVer:"4.2.5",window:g},i=function(){this.__$emitterPrivate=a({}),this.__$emitterPublic=a({}),this.__instancesLatestArr=[],this.__plugins={},this._env=h};i.prototype={__bridge:function(b,c,d){if(!c[d]){var e=function(){};e.prototype=b;var g=new e;g.__init&&g.__init(c),a.each(b,function(a,b){0!=a.indexOf("__")&&(c[a]?f.debug&&console.log("The "+a+" method of the "+d+" plugin conflicts with another plugin or native methods"):(c[a]=function(){return g[a].apply(g,Array.prototype.slice.apply(arguments))},c[a].bridged=g))}),c[d]=g}return this},__setWindow:function(a){return h.window=a,this},_getRuler:function(a){return new b(a)},_off:function(){return this.__$emitterPrivate.off.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_on:function(){return this.__$emitterPrivate.on.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_one:function(){return this.__$emitterPrivate.one.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_plugin:function(b){var c=this;if("string"==typeof b){var d=b,e=null;return d.indexOf(".")>0?e=c.__plugins[d]:a.each(c.__plugins,function(a,b){return b.name.substring(b.name.length-d.length-1)=="."+d?(e=b,!1):void 0}),e}if(b.name.indexOf(".")<0)throw new Error("Plugins must be namespaced");return c.__plugins[b.name]=b,b.core&&c.__bridge(b.core,c,b.name),this},_trigger:function(){var a=Array.prototype.slice.apply(arguments);return"string"==typeof a[0]&&(a[0]={type:a[0]}),this.__$emitterPrivate.trigger.apply(this.__$emitterPrivate,a),this.__$emitterPublic.trigger.apply(this.__$emitterPublic,a),this},instances:function(b){var c=[],d=b||".tooltipstered";return a(d).each(function(){var b=a(this),d=b.data("tooltipster-ns");d&&a.each(d,function(a,d){c.push(b.data(d))})}),c},instancesLatest:function(){return this.__instancesLatestArr},off:function(){return this.__$emitterPublic.off.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},on:function(){return this.__$emitterPublic.on.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},one:function(){return this.__$emitterPublic.one.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},origins:function(b){var c=b?b+" ":"";return a(c+".tooltipstered").toArray()},setDefaults:function(b){return a.extend(f,b),this},triggerHandler:function(){return this.__$emitterPublic.triggerHandler.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this}},a.tooltipster=new i,a.Tooltipster=function(b,c){this.__callbacks={close:[],open:[]},this.__closingTime,this.__Content,this.__contentBcr,this.__destroyed=!1,this.__$emitterPrivate=a({}),this.__$emitterPublic=a({}),this.__enabled=!0,this.__garbageCollector,this.__Geometry,this.__lastPosition,this.__namespace="tooltipster-"+Math.round(1e6*Math.random()),this.__options,this.__$originParents,this.__pointerIsOverOrigin=!1,this.__previousThemes=[],this.__state="closed",this.__timeouts={close:[],open:null},this.__touchEvents=[],this.__tracker=null,this._$origin,this._$tooltip,this.__init(b,c)},a.Tooltipster.prototype={__init:function(b,c){var d=this;if(d._$origin=a(b),d.__options=a.extend(!0,{},f,c),d.__optionsFormat(),!h.IE||h.IE>=d.__options.IEmin){var e=null;if(void 0===d._$origin.data("tooltipster-initialTitle")&&(e=d._$origin.attr("title"),void 0===e&&(e=null),d._$origin.data("tooltipster-initialTitle",e)),null!==d.__options.content)d.__contentSet(d.__options.content);else{var g,i=d._$origin.attr("data-tooltip-content");i&&(g=a(i)),g&&g[0]?d.__contentSet(g.first()):d.__contentSet(e)}d._$origin.removeAttr("title").addClass("tooltipstered"),d.__prepareOrigin(),d.__prepareGC(),a.each(d.__options.plugins,function(a,b){d._plug(b)}),h.hasTouchCapability&&a(h.window.document.body).on("touchmove."+d.__namespace+"-triggerOpen",function(a){d._touchRecordEvent(a)}),d._on("created",function(){d.__prepareTooltip()})._on("repositioned",function(a){d.__lastPosition=a.position})}else d.__options.disabled=!0},__contentInsert:function(){var a=this,b=a._$tooltip.find(".tooltipster-content"),c=a.__Content,d=function(a){c=a};return a._trigger({type:"format",content:a.__Content,format:d}),a.__options.functionFormat&&(c=a.__options.functionFormat.call(a,a,{origin:a._$origin[0]},a.__Content)),"string"!=typeof c||a.__options.contentAsHTML?b.empty().append(c):b.text(c),a},__contentSet:function(b){return b instanceof a&&this.__options.contentCloning&&(b=b.clone(!0)),this.__Content=b,this._trigger({type:"updated",content:b}),this},__destroyError:function(){throw new Error("This tooltip has been destroyed and cannot execute your method call.")},__geometry:function(){var b=this,c=b._$origin,d=b._$origin.is("area");if(d){var e=b._$origin.parent().attr("name");c=a('img[usemap="#'+e+'"]')}var f=c[0].getBoundingClientRect(),g=a(h.window.document),i=a(h.window),j=c,k={available:{document:null,window:null},document:{size:{height:g.height(),width:g.width()}},window:{scroll:{left:h.window.scrollX||h.window.document.documentElement.scrollLeft,top:h.window.scrollY||h.window.document.documentElement.scrollTop},size:{height:i.height(),width:i.width()}},origin:{fixedLineage:!1,offset:{},size:{height:f.bottom-f.top,width:f.right-f.left},usemapImage:d?c[0]:null,windowOffset:{bottom:f.bottom,left:f.left,right:f.right,top:f.top}}};if(d){var l=b._$origin.attr("shape"),m=b._$origin.attr("coords");if(m&&(m=m.split(","),a.map(m,function(a,b){m[b]=parseInt(a)})),"default"!=l)switch(l){case"circle":var n=m[0],o=m[1],p=m[2],q=o-p,r=n-p;k.origin.size.height=2*p,k.origin.size.width=k.origin.size.height,k.origin.windowOffset.left+=r,k.origin.windowOffset.top+=q;break;case"rect":var s=m[0],t=m[1],u=m[2],v=m[3];k.origin.size.height=v-t,k.origin.size.width=u-s,k.origin.windowOffset.left+=s,k.origin.windowOffset.top+=t;break;case"poly":for(var w=0,x=0,y=0,z=0,A="even",B=0;B<m.length;B++){var C=m[B];"even"==A?(C>y&&(y=C,0===B&&(w=y)),w>C&&(w=C),A="odd"):(C>z&&(z=C,1==B&&(x=z)),x>C&&(x=C),A="even")}k.origin.size.height=z-x,k.origin.size.width=y-w,k.origin.windowOffset.left+=w,k.origin.windowOffset.top+=x}}var D=function(a){k.origin.size.height=a.height,k.origin.windowOffset.left=a.left,k.origin.windowOffset.top=a.top,k.origin.size.width=a.width};for(b._trigger({type:"geometry",edit:D,geometry:{height:k.origin.size.height,left:k.origin.windowOffset.left,top:k.origin.windowOffset.top,width:k.origin.size.width}}),k.origin.windowOffset.right=k.origin.windowOffset.left+k.origin.size.width,k.origin.windowOffset.bottom=k.origin.windowOffset.top+k.origin.size.height,k.origin.offset.left=k.origin.windowOffset.left+k.window.scroll.left,k.origin.offset.top=k.origin.windowOffset.top+k.window.scroll.top,k.origin.offset.bottom=k.origin.offset.top+k.origin.size.height,k.origin.offset.right=k.origin.offset.left+k.origin.size.width,k.available.document={bottom:{height:k.document.size.height-k.origin.offset.bottom,width:k.document.size.width},left:{height:k.document.size.height,width:k.origin.offset.left},right:{height:k.document.size.height,width:k.document.size.width-k.origin.offset.right},top:{height:k.origin.offset.top,width:k.document.size.width}},k.available.window={bottom:{height:Math.max(k.window.size.height-Math.max(k.origin.windowOffset.bottom,0),0),width:k.window.size.width},left:{height:k.window.size.height,width:Math.max(k.origin.windowOffset.left,0)},right:{height:k.window.size.height,width:Math.max(k.window.size.width-Math.max(k.origin.windowOffset.right,0),0)},top:{height:Math.max(k.origin.windowOffset.top,0),width:k.window.size.width}};"html"!=j[0].tagName.toLowerCase();){if("fixed"==j.css("position")){k.origin.fixedLineage=!0;break}j=j.parent()}return k},__optionsFormat:function(){return"number"==typeof this.__options.animationDuration&&(this.__options.animationDuration=[this.__options.animationDuration,this.__options.animationDuration]),"number"==typeof this.__options.delay&&(this.__options.delay=[this.__options.delay,this.__options.delay]),"number"==typeof this.__options.delayTouch&&(this.__options.delayTouch=[this.__options.delayTouch,this.__options.delayTouch]),"string"==typeof this.__options.theme&&(this.__options.theme=[this.__options.theme]),null===this.__options.parent?this.__options.parent=a(h.window.document.body):"string"==typeof this.__options.parent&&(this.__options.parent=a(this.__options.parent)),"hover"==this.__options.trigger?(this.__options.triggerOpen={mouseenter:!0,touchstart:!0},this.__options.triggerClose={mouseleave:!0,originClick:!0,touchleave:!0}):"click"==this.__options.trigger&&(this.__options.triggerOpen={click:!0,tap:!0},this.__options.triggerClose={click:!0,tap:!0}),this._trigger("options"),this},__prepareGC:function(){var b=this;return b.__options.selfDestruction?b.__garbageCollector=setInterval(function(){var c=(new Date).getTime();b.__touchEvents=a.grep(b.__touchEvents,function(a,b){return c-a.time>6e4}),d(b._$origin)||b.close(function(){b.destroy()})},2e4):clearInterval(b.__garbageCollector),b},__prepareOrigin:function(){var a=this;if(a._$origin.off("."+a.__namespace+"-triggerOpen"),h.hasTouchCapability&&a._$origin.on("touchstart."+a.__namespace+"-triggerOpen touchend."+a.__namespace+"-triggerOpen touchcancel."+a.__namespace+"-triggerOpen",function(b){a._touchRecordEvent(b)}),a.__options.triggerOpen.click||a.__options.triggerOpen.tap&&h.hasTouchCapability){var b="";a.__options.triggerOpen.click&&(b+="click."+a.__namespace+"-triggerOpen "),a.__options.triggerOpen.tap&&h.hasTouchCapability&&(b+="touchend."+a.__namespace+"-triggerOpen"),a._$origin.on(b,function(b){a._touchIsMeaningfulEvent(b)&&a._open(b)})}if(a.__options.triggerOpen.mouseenter||a.__options.triggerOpen.touchstart&&h.hasTouchCapability){var b="";a.__options.triggerOpen.mouseenter&&(b+="mouseenter."+a.__namespace+"-triggerOpen "),a.__options.triggerOpen.touchstart&&h.hasTouchCapability&&(b+="touchstart."+a.__namespace+"-triggerOpen"),a._$origin.on(b,function(b){!a._touchIsTouchEvent(b)&&a._touchIsEmulatedEvent(b)||(a.__pointerIsOverOrigin=!0,a._openShortly(b))})}if(a.__options.triggerClose.mouseleave||a.__options.triggerClose.touchleave&&h.hasTouchCapability){var b="";a.__options.triggerClose.mouseleave&&(b+="mouseleave."+a.__namespace+"-triggerOpen "),a.__options.triggerClose.touchleave&&h.hasTouchCapability&&(b+="touchend."+a.__namespace+"-triggerOpen touchcancel."+a.__namespace+"-triggerOpen"),a._$origin.on(b,function(b){a._touchIsMeaningfulEvent(b)&&(a.__pointerIsOverOrigin=!1)})}return a},__prepareTooltip:function(){var b=this,c=b.__options.interactive?"auto":"";return b._$tooltip.attr("id",b.__namespace).css({"pointer-events":c,zIndex:b.__options.zIndex}),a.each(b.__previousThemes,function(a,c){b._$tooltip.removeClass(c)}),a.each(b.__options.theme,function(a,c){b._$tooltip.addClass(c)}),b.__previousThemes=a.merge([],b.__options.theme),b},__scrollHandler:function(b){var c=this;if(c.__options.triggerClose.scroll)c._close(b);else if(d(c._$origin)&&d(c._$tooltip)){var e=null;if(b.target===h.window.document)c.__Geometry.origin.fixedLineage||c.__options.repositionOnScroll&&c.reposition(b);else{e=c.__geometry();var f=!1;if("fixed"!=c._$origin.css("position")&&c.__$originParents.each(function(b,c){var d=a(c),g=d.css("overflow-x"),h=d.css("overflow-y");if("visible"!=g||"visible"!=h){var i=c.getBoundingClientRect();if("visible"!=g&&(e.origin.windowOffset.left<i.left||e.origin.windowOffset.right>i.right))return f=!0,!1;if("visible"!=h&&(e.origin.windowOffset.top<i.top||e.origin.windowOffset.bottom>i.bottom))return f=!0,!1}return"fixed"==d.css("position")?!1:void 0}),f)c._$tooltip.css("visibility","hidden");else if(c._$tooltip.css("visibility","visible"),c.__options.repositionOnScroll)c.reposition(b);else{var g=e.origin.offset.left-c.__Geometry.origin.offset.left,i=e.origin.offset.top-c.__Geometry.origin.offset.top;c._$tooltip.css({left:c.__lastPosition.coord.left+g,top:c.__lastPosition.coord.top+i})}}c._trigger({type:"scroll",event:b,geo:e})}return c},__stateSet:function(a){return this.__state=a,this._trigger({type:"state",state:a}),this},__timeoutsClear:function(){return clearTimeout(this.__timeouts.open),this.__timeouts.open=null,a.each(this.__timeouts.close,function(a,b){clearTimeout(b)}),this.__timeouts.close=[],this},__trackerStart:function(){var a=this,b=a._$tooltip.find(".tooltipster-content");return a.__options.trackTooltip&&(a.__contentBcr=b[0].getBoundingClientRect()),a.__tracker=setInterval(function(){if(d(a._$origin)&&d(a._$tooltip)){if(a.__options.trackOrigin){var e=a.__geometry(),f=!1;c(e.origin.size,a.__Geometry.origin.size)&&(a.__Geometry.origin.fixedLineage?c(e.origin.windowOffset,a.__Geometry.origin.windowOffset)&&(f=!0):c(e.origin.offset,a.__Geometry.origin.offset)&&(f=!0)),f||(a.__options.triggerClose.mouseleave?a._close():a.reposition())}if(a.__options.trackTooltip){var g=b[0].getBoundingClientRect();g.height===a.__contentBcr.height&&g.width===a.__contentBcr.width||(a.reposition(),a.__contentBcr=g)}}else a._close()},a.__options.trackerInterval),a},_close:function(b,c,d){var e=this,f=!0;if(e._trigger({type:"close",event:b,stop:function(){f=!1}}),f||d){c&&e.__callbacks.close.push(c),e.__callbacks.open=[],e.__timeoutsClear();var g=function(){a.each(e.__callbacks.close,function(a,c){c.call(e,e,{event:b,origin:e._$origin[0]})}),e.__callbacks.close=[]};if("closed"!=e.__state){var i=!0,j=new Date,k=j.getTime(),l=k+e.__options.animationDuration[1];if("disappearing"==e.__state&&l>e.__closingTime&&e.__options.animationDuration[1]>0&&(i=!1),i){e.__closingTime=l,"disappearing"!=e.__state&&e.__stateSet("disappearing");var m=function(){clearInterval(e.__tracker),e._trigger({type:"closing",event:b}),e._$tooltip.off("."+e.__namespace+"-triggerClose").removeClass("tooltipster-dying"),a(h.window).off("."+e.__namespace+"-triggerClose"),e.__$originParents.each(function(b,c){a(c).off("scroll."+e.__namespace+"-triggerClose")}),e.__$originParents=null,a(h.window.document.body).off("."+e.__namespace+"-triggerClose"),e._$origin.off("."+e.__namespace+"-triggerClose"),e._off("dismissable"),e.__stateSet("closed"),e._trigger({type:"after",event:b}),e.__options.functionAfter&&e.__options.functionAfter.call(e,e,{event:b,origin:e._$origin[0]}),g()};h.hasTransitions?(e._$tooltip.css({"-moz-animation-duration":e.__options.animationDuration[1]+"ms","-ms-animation-duration":e.__options.animationDuration[1]+"ms","-o-animation-duration":e.__options.animationDuration[1]+"ms","-webkit-animation-duration":e.__options.animationDuration[1]+"ms","animation-duration":e.__options.animationDuration[1]+"ms","transition-duration":e.__options.animationDuration[1]+"ms"}),e._$tooltip.clearQueue().removeClass("tooltipster-show").addClass("tooltipster-dying"),e.__options.animationDuration[1]>0&&e._$tooltip.delay(e.__options.animationDuration[1]),e._$tooltip.queue(m)):e._$tooltip.stop().fadeOut(e.__options.animationDuration[1],m)}}else g()}return e},_off:function(){return this.__$emitterPrivate.off.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_on:function(){return this.__$emitterPrivate.on.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_one:function(){return this.__$emitterPrivate.one.apply(this.__$emitterPrivate,Array.prototype.slice.apply(arguments)),this},_open:function(b,c){var e=this;if(!e.__destroying&&d(e._$origin)&&e.__enabled){var f=!0;if("closed"==e.__state&&(e._trigger({type:"before",event:b,stop:function(){f=!1}}),f&&e.__options.functionBefore&&(f=e.__options.functionBefore.call(e,e,{event:b,origin:e._$origin[0]}))),f!==!1&&null!==e.__Content){c&&e.__callbacks.open.push(c),e.__callbacks.close=[],e.__timeoutsClear();var g,i=function(){"stable"!=e.__state&&e.__stateSet("stable"),a.each(e.__callbacks.open,function(a,b){b.call(e,e,{origin:e._$origin[0],tooltip:e._$tooltip[0]})}),e.__callbacks.open=[]};if("closed"!==e.__state)g=0,"disappearing"===e.__state?(e.__stateSet("appearing"),h.hasTransitions?(e._$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-show"),e.__options.animationDuration[0]>0&&e._$tooltip.delay(e.__options.animationDuration[0]),e._$tooltip.queue(i)):e._$tooltip.stop().fadeIn(i)):"stable"==e.__state&&i();else{if(e.__stateSet("appearing"),g=e.__options.animationDuration[0],e.__contentInsert(),e.reposition(b,!0),h.hasTransitions?(e._$tooltip.addClass("tooltipster-"+e.__options.animation).addClass("tooltipster-initial").css({"-moz-animation-duration":e.__options.animationDuration[0]+"ms","-ms-animation-duration":e.__options.animationDuration[0]+"ms","-o-animation-duration":e.__options.animationDuration[0]+"ms","-webkit-animation-duration":e.__options.animationDuration[0]+"ms","animation-duration":e.__options.animationDuration[0]+"ms","transition-duration":e.__options.animationDuration[0]+"ms"}),setTimeout(function(){"closed"!=e.__state&&(e._$tooltip.addClass("tooltipster-show").removeClass("tooltipster-initial"),e.__options.animationDuration[0]>0&&e._$tooltip.delay(e.__options.animationDuration[0]),e._$tooltip.queue(i))},0)):e._$tooltip.css("display","none").fadeIn(e.__options.animationDuration[0],i),e.__trackerStart(),a(h.window).on("resize."+e.__namespace+"-triggerClose",function(b){var c=a(document.activeElement);(c.is("input")||c.is("textarea"))&&a.contains(e._$tooltip[0],c[0])||e.reposition(b)}).on("scroll."+e.__namespace+"-triggerClose",function(a){e.__scrollHandler(a)}),e.__$originParents=e._$origin.parents(),e.__$originParents.each(function(b,c){a(c).on("scroll."+e.__namespace+"-triggerClose",function(a){e.__scrollHandler(a)})}),e.__options.triggerClose.mouseleave||e.__options.triggerClose.touchleave&&h.hasTouchCapability){e._on("dismissable",function(a){a.dismissable?a.delay?(m=setTimeout(function(){e._close(a.event)},a.delay),e.__timeouts.close.push(m)):e._close(a):clearTimeout(m)});var j=e._$origin,k="",l="",m=null;e.__options.interactive&&(j=j.add(e._$tooltip)),e.__options.triggerClose.mouseleave&&(k+="mouseenter."+e.__namespace+"-triggerClose ",l+="mouseleave."+e.__namespace+"-triggerClose "),e.__options.triggerClose.touchleave&&h.hasTouchCapability&&(k+="touchstart."+e.__namespace+"-triggerClose",l+="touchend."+e.__namespace+"-triggerClose touchcancel."+e.__namespace+"-triggerClose"),j.on(l,function(a){if(e._touchIsTouchEvent(a)||!e._touchIsEmulatedEvent(a)){var b="mouseleave"==a.type?e.__options.delay:e.__options.delayTouch;e._trigger({delay:b[1],dismissable:!0,event:a,type:"dismissable"})}}).on(k,function(a){!e._touchIsTouchEvent(a)&&e._touchIsEmulatedEvent(a)||e._trigger({dismissable:!1,event:a,type:"dismissable"})})}e.__options.triggerClose.originClick&&e._$origin.on("click."+e.__namespace+"-triggerClose",function(a){e._touchIsTouchEvent(a)||e._touchIsEmulatedEvent(a)||e._close(a)}),(e.__options.triggerClose.click||e.__options.triggerClose.tap&&h.hasTouchCapability)&&setTimeout(function(){if("closed"!=e.__state){var b="",c=a(h.window.document.body);e.__options.triggerClose.click&&(b+="click."+e.__namespace+"-triggerClose "),e.__options.triggerClose.tap&&h.hasTouchCapability&&(b+="touchend."+e.__namespace+"-triggerClose"),c.on(b,function(b){e._touchIsMeaningfulEvent(b)&&(e._touchRecordEvent(b),e.__options.interactive&&a.contains(e._$tooltip[0],b.target)||e._close(b))}),e.__options.triggerClose.tap&&h.hasTouchCapability&&c.on("touchstart."+e.__namespace+"-triggerClose",function(a){e._touchRecordEvent(a)})}},0),e._trigger("ready"),e.__options.functionReady&&e.__options.functionReady.call(e,e,{origin:e._$origin[0],tooltip:e._$tooltip[0]})}if(e.__options.timer>0){var m=setTimeout(function(){e._close()},e.__options.timer+g);e.__timeouts.close.push(m)}}}return e},_openShortly:function(a){var b=this,c=!0;if("stable"!=b.__state&&"appearing"!=b.__state&&!b.__timeouts.open&&(b._trigger({type:"start",event:a,stop:function(){c=!1}}),c)){var d=0==a.type.indexOf("touch")?b.__options.delayTouch:b.__options.delay;d[0]?b.__timeouts.open=setTimeout(function(){b.__timeouts.open=null,b.__pointerIsOverOrigin&&b._touchIsMeaningfulEvent(a)?(b._trigger("startend"),b._open(a)):b._trigger("startcancel")},d[0]):(b._trigger("startend"),b._open(a))}return b},_optionsExtract:function(b,c){var d=this,e=a.extend(!0,{},c),f=d.__options[b];return f||(f={},a.each(c,function(a,b){var c=d.__options[a];void 0!==c&&(f[a]=c)})),a.each(e,function(b,c){void 0!==f[b]&&("object"!=typeof c||c instanceof Array||null==c||"object"!=typeof f[b]||f[b]instanceof Array||null==f[b]?e[b]=f[b]:a.extend(e[b],f[b]))}),e},_plug:function(b){var c=a.tooltipster._plugin(b);if(!c)throw new Error('The "'+b+'" plugin is not defined');return c.instance&&a.tooltipster.__bridge(c.instance,this,c.name),this},_touchIsEmulatedEvent:function(a){for(var b=!1,c=(new Date).getTime(),d=this.__touchEvents.length-1;d>=0;d--){var e=this.__touchEvents[d];if(!(c-e.time<500))break;e.target===a.target&&(b=!0)}return b},_touchIsMeaningfulEvent:function(a){return this._touchIsTouchEvent(a)&&!this._touchSwiped(a.target)||!this._touchIsTouchEvent(a)&&!this._touchIsEmulatedEvent(a)},_touchIsTouchEvent:function(a){return 0==a.type.indexOf("touch")},_touchRecordEvent:function(a){return this._touchIsTouchEvent(a)&&(a.time=(new Date).getTime(),this.__touchEvents.push(a)),this},_touchSwiped:function(a){for(var b=!1,c=this.__touchEvents.length-1;c>=0;c--){var d=this.__touchEvents[c];if("touchmove"==d.type){b=!0;break}if("touchstart"==d.type&&a===d.target)break}return b},_trigger:function(){var b=Array.prototype.slice.apply(arguments);return"string"==typeof b[0]&&(b[0]={type:b[0]}),b[0].instance=this,b[0].origin=this._$origin?this._$origin[0]:null,b[0].tooltip=this._$tooltip?this._$tooltip[0]:null,this.__$emitterPrivate.trigger.apply(this.__$emitterPrivate,b),a.tooltipster._trigger.apply(a.tooltipster,b),this.__$emitterPublic.trigger.apply(this.__$emitterPublic,b),this},_unplug:function(b){var c=this;if(c[b]){var d=a.tooltipster._plugin(b);d.instance&&a.each(d.instance,function(a,d){c[a]&&c[a].bridged===c[b]&&delete c[a]}),c[b].__destroy&&c[b].__destroy(),delete c[b]}return c},close:function(a){return this.__destroyed?this.__destroyError():this._close(null,a),this},content:function(a){var b=this;if(void 0===a)return b.__Content;if(b.__destroyed)b.__destroyError();else if(b.__contentSet(a),null!==b.__Content){if("closed"!==b.__state&&(b.__contentInsert(),b.reposition(),b.__options.updateAnimation))if(h.hasTransitions){var c=b.__options.updateAnimation;b._$tooltip.addClass("tooltipster-update-"+c),setTimeout(function(){"closed"!=b.__state&&b._$tooltip.removeClass("tooltipster-update-"+c)},1e3)}else b._$tooltip.fadeTo(200,.5,function(){"closed"!=b.__state&&b._$tooltip.fadeTo(200,1)})}else b._close();return b},destroy:function(){var b=this;if(b.__destroyed)b.__destroyError();else{"closed"!=b.__state?b.option("animationDuration",0)._close(null,null,!0):b.__timeoutsClear(),b._trigger("destroy"),b.__destroyed=!0,b._$origin.removeData(b.__namespace).off("."+b.__namespace+"-triggerOpen"),a(h.window.document.body).off("."+b.__namespace+"-triggerOpen");var c=b._$origin.data("tooltipster-ns");if(c)if(1===c.length){var d=null;"previous"==b.__options.restoration?d=b._$origin.data("tooltipster-initialTitle"):"current"==b.__options.restoration&&(d="string"==typeof b.__Content?b.__Content:a("<div></div>").append(b.__Content).html()),d&&b._$origin.attr("title",d),b._$origin.removeClass("tooltipstered"),b._$origin.removeData("tooltipster-ns").removeData("tooltipster-initialTitle")}else c=a.grep(c,function(a,c){return a!==b.__namespace}),b._$origin.data("tooltipster-ns",c);b._trigger("destroyed"),b._off(),b.off(),b.__Content=null,b.__$emitterPrivate=null,b.__$emitterPublic=null,b.__options.parent=null,b._$origin=null,b._$tooltip=null,a.tooltipster.__instancesLatestArr=a.grep(a.tooltipster.__instancesLatestArr,function(a,c){return b!==a}),clearInterval(b.__garbageCollector)}return b},disable:function(){return this.__destroyed?(this.__destroyError(),this):(this._close(),this.__enabled=!1,this)},elementOrigin:function(){return this.__destroyed?void this.__destroyError():this._$origin[0]},elementTooltip:function(){return this._$tooltip?this._$tooltip[0]:null},enable:function(){return this.__enabled=!0,this},hide:function(a){return this.close(a)},instance:function(){return this},off:function(){return this.__destroyed||this.__$emitterPublic.off.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},on:function(){return this.__destroyed?this.__destroyError():this.__$emitterPublic.on.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},one:function(){return this.__destroyed?this.__destroyError():this.__$emitterPublic.one.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this},open:function(a){return this.__destroyed?this.__destroyError():this._open(null,a),this},option:function(b,c){return void 0===c?this.__options[b]:(this.__destroyed?this.__destroyError():(this.__options[b]=c,this.__optionsFormat(),a.inArray(b,["trigger","triggerClose","triggerOpen"])>=0&&this.__prepareOrigin(),"selfDestruction"===b&&this.__prepareGC()),this)},reposition:function(a,b){var c=this;return c.__destroyed?c.__destroyError():"closed"!=c.__state&&d(c._$origin)&&(b||d(c._$tooltip))&&(b||c._$tooltip.detach(),c.__Geometry=c.__geometry(),c._trigger({type:"reposition",event:a,helper:{geo:c.__Geometry}})),c},show:function(a){return this.open(a)},status:function(){return{destroyed:this.__destroyed,enabled:this.__enabled,open:"closed"!==this.__state,state:this.__state}},triggerHandler:function(){return this.__destroyed?this.__destroyError():this.__$emitterPublic.triggerHandler.apply(this.__$emitterPublic,Array.prototype.slice.apply(arguments)),this}},a.fn.tooltipster=function(){var b=Array.prototype.slice.apply(arguments),c="You are using a single HTML element as content for several tooltips. You probably want to set the contentCloning option to TRUE.";if(0===this.length)return this;if("string"==typeof b[0]){var d="#*$~&";return this.each(function(){var e=a(this).data("tooltipster-ns"),f=e?a(this).data(e[0]):null;if(!f)throw new Error("You called Tooltipster's \""+b[0]+'" method on an uninitialized element');if("function"!=typeof f[b[0]])throw new Error('Unknown method "'+b[0]+'"');this.length>1&&"content"==b[0]&&(b[1]instanceof a||"object"==typeof b[1]&&null!=b[1]&&b[1].tagName)&&!f.__options.contentCloning&&f.__options.debug&&console.log(c);var g=f[b[0]](b[1],b[2]);return g!==f||"instance"===b[0]?(d=g,!1):void 0}),"#*$~&"!==d?d:this}a.tooltipster.__instancesLatestArr=[];var e=b[0]&&void 0!==b[0].multiple,g=e&&b[0].multiple||!e&&f.multiple,h=b[0]&&void 0!==b[0].content,i=h&&b[0].content||!h&&f.content,j=b[0]&&void 0!==b[0].contentCloning,k=j&&b[0].contentCloning||!j&&f.contentCloning,l=b[0]&&void 0!==b[0].debug,m=l&&b[0].debug||!l&&f.debug;return this.length>1&&(i instanceof a||"object"==typeof i&&null!=i&&i.tagName)&&!k&&m&&console.log(c),this.each(function(){var c=!1,d=a(this),e=d.data("tooltipster-ns"),f=null;e?g?c=!0:m&&(console.log("Tooltipster: one or more tooltips are already attached to the element below. Ignoring."),console.log(this)):c=!0,c&&(f=new a.Tooltipster(this,b[0]),e||(e=[]),e.push(f.__namespace),d.data("tooltipster-ns",e),d.data(f.__namespace,f),f.__options.functionInit&&f.__options.functionInit.call(f,f,{origin:this}),f._trigger("init")),a.tooltipster.__instancesLatestArr.push(f)}),this},b.prototype={__init:function(b){this.__$tooltip=b,this.__$tooltip.css({left:0,overflow:"hidden",position:"absolute",top:0}).find(".tooltipster-content").css("overflow","auto"),this.$container=a('<div class="tooltipster-ruler"></div>').append(this.__$tooltip).appendTo(h.window.document.body)},__forceRedraw:function(){var a=this.__$tooltip.parent();this.__$tooltip.detach(),this.__$tooltip.appendTo(a)},constrain:function(a,b){return this.constraints={width:a,height:b},this.__$tooltip.css({display:"block",height:"",overflow:"auto",width:a}),this},destroy:function(){this.__$tooltip.detach().find(".tooltipster-content").css({display:"",overflow:""}),this.$container.remove()},free:function(){return this.constraints=null,this.__$tooltip.css({display:"",height:"",overflow:"visible",width:""}),this},measure:function(){this.__forceRedraw();var a=this.__$tooltip[0].getBoundingClientRect(),b={size:{height:a.height||a.bottom-a.top,width:a.width||a.right-a.left}};if(this.constraints){var c=this.__$tooltip.find(".tooltipster-content"),d=this.__$tooltip.outerHeight(),e=c[0].getBoundingClientRect(),f={height:d<=this.constraints.height,width:a.width<=this.constraints.width&&e.width>=c[0].scrollWidth-1};b.fits=f.height&&f.width}return h.IE&&h.IE<=11&&b.size.width!==h.window.document.documentElement.clientWidth&&(b.size.width=Math.ceil(b.size.width)+1),b}};var j=navigator.userAgent.toLowerCase();-1!=j.indexOf("msie")?h.IE=parseInt(j.split("msie")[1]):-1!==j.toLowerCase().indexOf("trident")&&-1!==j.indexOf(" rv:11")?h.IE=11:-1!=j.toLowerCase().indexOf("edge/")&&(h.IE=parseInt(j.toLowerCase().split("edge/")[1]));var k="tooltipster.sideTip";return a.tooltipster._plugin({name:k,instance:{__defaults:function(){return{arrow:!0,distance:6,functionPosition:null,maxWidth:null,minIntersection:16,minWidth:0,position:null,side:"top",viewportAware:!0}},__init:function(a){var b=this;b.__instance=a,b.__namespace="tooltipster-sideTip-"+Math.round(1e6*Math.random()),b.__previousState="closed",b.__options,b.__optionsFormat(),b.__instance._on("state."+b.__namespace,function(a){"closed"==a.state?b.__close():"appearing"==a.state&&"closed"==b.__previousState&&b.__create(),b.__previousState=a.state}),b.__instance._on("options."+b.__namespace,function(){b.__optionsFormat()}),b.__instance._on("reposition."+b.__namespace,function(a){b.__reposition(a.event,a.helper)})},__close:function(){this.__instance.content()instanceof a&&this.__instance.content().detach(),this.__instance._$tooltip.remove(),this.__instance._$tooltip=null},__create:function(){var b=a('<div class="tooltipster-base tooltipster-sidetip"><div class="tooltipster-box"><div class="tooltipster-content"></div></div><div class="tooltipster-arrow"><div class="tooltipster-arrow-uncropped"><div class="tooltipster-arrow-border"></div><div class="tooltipster-arrow-background"></div></div></div></div>');this.__options.arrow||b.find(".tooltipster-box").css("margin",0).end().find(".tooltipster-arrow").hide(),this.__options.minWidth&&b.css("min-width",this.__options.minWidth+"px"),this.__options.maxWidth&&b.css("max-width",this.__options.maxWidth+"px"),
this.__instance._$tooltip=b,this.__instance._trigger("created")},__destroy:function(){this.__instance._off("."+self.__namespace)},__optionsFormat:function(){var b=this;if(b.__options=b.__instance._optionsExtract(k,b.__defaults()),b.__options.position&&(b.__options.side=b.__options.position),"object"!=typeof b.__options.distance&&(b.__options.distance=[b.__options.distance]),b.__options.distance.length<4&&(void 0===b.__options.distance[1]&&(b.__options.distance[1]=b.__options.distance[0]),void 0===b.__options.distance[2]&&(b.__options.distance[2]=b.__options.distance[0]),void 0===b.__options.distance[3]&&(b.__options.distance[3]=b.__options.distance[1]),b.__options.distance={top:b.__options.distance[0],right:b.__options.distance[1],bottom:b.__options.distance[2],left:b.__options.distance[3]}),"string"==typeof b.__options.side){var c={top:"bottom",right:"left",bottom:"top",left:"right"};b.__options.side=[b.__options.side,c[b.__options.side]],"left"==b.__options.side[0]||"right"==b.__options.side[0]?b.__options.side.push("top","bottom"):b.__options.side.push("right","left")}6===a.tooltipster._env.IE&&b.__options.arrow!==!0&&(b.__options.arrow=!1)},__reposition:function(b,c){var d,e=this,f=e.__targetFind(c),g=[];e.__instance._$tooltip.detach();var h=e.__instance._$tooltip.clone(),i=a.tooltipster._getRuler(h),j=!1,k=e.__instance.option("animation");switch(k&&h.removeClass("tooltipster-"+k),a.each(["window","document"],function(d,k){var l=null;if(e.__instance._trigger({container:k,helper:c,satisfied:j,takeTest:function(a){l=a},results:g,type:"positionTest"}),1==l||0!=l&&0==j&&("window"!=k||e.__options.viewportAware))for(var d=0;d<e.__options.side.length;d++){var m={horizontal:0,vertical:0},n=e.__options.side[d];"top"==n||"bottom"==n?m.vertical=e.__options.distance[n]:m.horizontal=e.__options.distance[n],e.__sideChange(h,n),a.each(["natural","constrained"],function(a,d){if(l=null,e.__instance._trigger({container:k,event:b,helper:c,mode:d,results:g,satisfied:j,side:n,takeTest:function(a){l=a},type:"positionTest"}),1==l||0!=l&&0==j){var h={container:k,distance:m,fits:null,mode:d,outerSize:null,side:n,size:null,target:f[n],whole:null},o="natural"==d?i.free():i.constrain(c.geo.available[k][n].width-m.horizontal,c.geo.available[k][n].height-m.vertical),p=o.measure();if(h.size=p.size,h.outerSize={height:p.size.height+m.vertical,width:p.size.width+m.horizontal},"natural"==d?c.geo.available[k][n].width>=h.outerSize.width&&c.geo.available[k][n].height>=h.outerSize.height?h.fits=!0:h.fits=!1:h.fits=p.fits,"window"==k&&(h.fits?"top"==n||"bottom"==n?h.whole=c.geo.origin.windowOffset.right>=e.__options.minIntersection&&c.geo.window.size.width-c.geo.origin.windowOffset.left>=e.__options.minIntersection:h.whole=c.geo.origin.windowOffset.bottom>=e.__options.minIntersection&&c.geo.window.size.height-c.geo.origin.windowOffset.top>=e.__options.minIntersection:h.whole=!1),g.push(h),h.whole)j=!0;else if("natural"==h.mode&&(h.fits||h.size.width<=c.geo.available[k][n].width))return!1}})}}),e.__instance._trigger({edit:function(a){g=a},event:b,helper:c,results:g,type:"positionTested"}),g.sort(function(a,b){if(a.whole&&!b.whole)return-1;if(!a.whole&&b.whole)return 1;if(a.whole&&b.whole){var c=e.__options.side.indexOf(a.side),d=e.__options.side.indexOf(b.side);return d>c?-1:c>d?1:"natural"==a.mode?-1:1}if(a.fits&&!b.fits)return-1;if(!a.fits&&b.fits)return 1;if(a.fits&&b.fits){var c=e.__options.side.indexOf(a.side),d=e.__options.side.indexOf(b.side);return d>c?-1:c>d?1:"natural"==a.mode?-1:1}return"document"==a.container&&"bottom"==a.side&&"natural"==a.mode?-1:1}),d=g[0],d.coord={},d.side){case"left":case"right":d.coord.top=Math.floor(d.target-d.size.height/2);break;case"bottom":case"top":d.coord.left=Math.floor(d.target-d.size.width/2)}switch(d.side){case"left":d.coord.left=c.geo.origin.windowOffset.left-d.outerSize.width;break;case"right":d.coord.left=c.geo.origin.windowOffset.right+d.distance.horizontal;break;case"top":d.coord.top=c.geo.origin.windowOffset.top-d.outerSize.height;break;case"bottom":d.coord.top=c.geo.origin.windowOffset.bottom+d.distance.vertical}"window"==d.container?"top"==d.side||"bottom"==d.side?d.coord.left<0?c.geo.origin.windowOffset.right-this.__options.minIntersection>=0?d.coord.left=0:d.coord.left=c.geo.origin.windowOffset.right-this.__options.minIntersection-1:d.coord.left>c.geo.window.size.width-d.size.width&&(c.geo.origin.windowOffset.left+this.__options.minIntersection<=c.geo.window.size.width?d.coord.left=c.geo.window.size.width-d.size.width:d.coord.left=c.geo.origin.windowOffset.left+this.__options.minIntersection+1-d.size.width):d.coord.top<0?c.geo.origin.windowOffset.bottom-this.__options.minIntersection>=0?d.coord.top=0:d.coord.top=c.geo.origin.windowOffset.bottom-this.__options.minIntersection-1:d.coord.top>c.geo.window.size.height-d.size.height&&(c.geo.origin.windowOffset.top+this.__options.minIntersection<=c.geo.window.size.height?d.coord.top=c.geo.window.size.height-d.size.height:d.coord.top=c.geo.origin.windowOffset.top+this.__options.minIntersection+1-d.size.height):(d.coord.left>c.geo.window.size.width-d.size.width&&(d.coord.left=c.geo.window.size.width-d.size.width),d.coord.left<0&&(d.coord.left=0)),e.__sideChange(h,d.side),c.tooltipClone=h[0],c.tooltipParent=e.__instance.option("parent").parent[0],c.mode=d.mode,c.whole=d.whole,c.origin=e.__instance._$origin[0],c.tooltip=e.__instance._$tooltip[0],delete d.container,delete d.fits,delete d.mode,delete d.outerSize,delete d.whole,d.distance=d.distance.horizontal||d.distance.vertical;var l=a.extend(!0,{},d);if(e.__instance._trigger({edit:function(a){d=a},event:b,helper:c,position:l,type:"position"}),e.__options.functionPosition){var m=e.__options.functionPosition.call(e,e.__instance,c,l);m&&(d=m)}i.destroy();var n,o;"top"==d.side||"bottom"==d.side?(n={prop:"left",val:d.target-d.coord.left},o=d.size.width-this.__options.minIntersection):(n={prop:"top",val:d.target-d.coord.top},o=d.size.height-this.__options.minIntersection),n.val<this.__options.minIntersection?n.val=this.__options.minIntersection:n.val>o&&(n.val=o);var p;p=c.geo.origin.fixedLineage?c.geo.origin.windowOffset:{left:c.geo.origin.windowOffset.left+c.geo.window.scroll.left,top:c.geo.origin.windowOffset.top+c.geo.window.scroll.top},d.coord={left:p.left+(d.coord.left-c.geo.origin.windowOffset.left),top:p.top+(d.coord.top-c.geo.origin.windowOffset.top)},e.__sideChange(e.__instance._$tooltip,d.side),c.geo.origin.fixedLineage?e.__instance._$tooltip.css("position","fixed"):e.__instance._$tooltip.css("position",""),e.__instance._$tooltip.css({left:d.coord.left,top:d.coord.top,height:d.size.height,width:d.size.width}).find(".tooltipster-arrow").css({left:"",top:""}).css(n.prop,n.val),e.__instance._$tooltip.appendTo(e.__instance.option("parent")),e.__instance._trigger({type:"repositioned",event:b,position:d})},__sideChange:function(a,b){a.removeClass("tooltipster-bottom").removeClass("tooltipster-left").removeClass("tooltipster-right").removeClass("tooltipster-top").addClass("tooltipster-"+b)},__targetFind:function(a){var b={},c=this.__instance._$origin[0].getClientRects();if(c.length>1){var d=this.__instance._$origin.css("opacity");1==d&&(this.__instance._$origin.css("opacity",.99),c=this.__instance._$origin[0].getClientRects(),this.__instance._$origin.css("opacity",1))}if(c.length<2)b.top=Math.floor(a.geo.origin.windowOffset.left+a.geo.origin.size.width/2),b.bottom=b.top,b.left=Math.floor(a.geo.origin.windowOffset.top+a.geo.origin.size.height/2),b.right=b.left;else{var e=c[0];b.top=Math.floor(e.left+(e.right-e.left)/2),e=c.length>2?c[Math.ceil(c.length/2)-1]:c[0],b.right=Math.floor(e.top+(e.bottom-e.top)/2),e=c[c.length-1],b.bottom=Math.floor(e.left+(e.right-e.left)/2),e=c.length>2?c[Math.ceil((c.length+1)/2)-1]:c[c.length-1],b.left=Math.floor(e.top+(e.bottom-e.top)/2)}return b}}}),a});
//# sourceMappingURL=build.js.map
