var Crazyerics=function(){var a=this;$(document).ready(function(){a._clientdata=a._decompress.json(clientdata);var d=a._clientdata.openonload||{};"system"in d&&"title"in d&&"file"in d&&a._bootstrap(d.system,d.title,d.file);a._buildRecentlyPlayed(a._clientdata.playhistory);$("#searchform select").selectOrDie({customID:"selectordie",customClass:"tooltip",onChange:function(){a.replaceSuggestions($(this).val())}});$("#searchform input").autoComplete({minChars:3,cache:!1,delay:300,source:function(c,d){var b=
$("#searchform select").val();$.getJSON("/search/"+b+"/"+c,function(c){d(a._decompress.json(c))})},renderItem:function(c,d){var b=$('<div class="autocomplete-suggestion" data-title="'+c[0]+'" data-file="'+c[1]+'" data-system="'+c[2]+'" data-searchscore="'+c[3]+'"></div>');b.append(a._getBoxFront(c[2],c[0],50));b.append("<div>"+c[0]+"</div>");return $("<div/>").append(b).html()},onSelect:function(c,d,b){a._bootstrap(b.data("system"),b.data("title"),b.data("file"))}});$("#emulatorwrapperoverlay").on("click",
function(){$("#emulator").focus();$("#emulatorcontrolswrapper").removeClass()}).hover(function(a){a.stopPropagation()},function(a){a.stopPropagation()});$("#emulatorcontrolswrapper").on("mousedown mouseup click",function(a){a.preventDefault();$("#emulator").focus()});$("#emulatorwrapper").hover(function(a){$("#emulatorcontrolswrapper").removeClass()},function(a){$("#emulatorcontrolswrapper").addClass("closed")});$("#gamedetailswrapper").hover(function(a){$("#gamecontrolslist").removeClass()},function(a){$("#gamecontrolslist").addClass("closed")});
$("#emulatorcontrolswrapper li.fullscreen").click(function(){a._simulateEmulatorKeypress(70)});$("#emulatorcontrolswrapper li.savestate").click(function(){a._simulateEmulatorKeypress(49)});$("#emulatorcontrolswrapper li.loadstate").click(function(){a._simulateEmulatorKeypress(52)});$("#emulatorcontrolswrapper li.mute").click(function(){a._simulateEmulatorKeypress(77)});$("#emulatorcontrolswrapper li.decrementslot").click(function(){a._simulateEmulatorKeypress(50)});$("#emulatorcontrolswrapper li.incrementslot").click(function(){a._simulateEmulatorKeypress(51)});
$("#emulatorcontrolswrapper li.fastforward").click(function(){a._simulateEmulatorKeypress(32)});$("#emulatorcontrolswrapper li.pause").click(function(){a._simulateEmulatorKeypress(80)});$("#emulatorcontrolswrapper li.reset").click(function(){a._simulateEmulatorKeypress(72)});$("#emulatorcontrolswrapper li.rewind").click(function(){a._simulateEmulatorKeypress(82,5E3)});a.Sliders.init();a.replaceSuggestions("all");a._toolTips()})};
Crazyerics.prototype.Sliders={_animating:!1,_animationRate:250,init:function(){this._bind()},_bind:function(){var a=this;$("#gamecontrolslist li").on("mousedown mouseup click",function(a){a.preventDefault();$("#emulator").focus()}).on("mouseup",function(d){a.open($(this).attr("class"))})},open:function(a,d){if(!this._animating){var c=this;d=d||!1;this._animating=!0;$("#gamecontrolslist li").each(function(f,b){var e=$("#"+$(this).attr("class"));if($(b).hasClass(a)){var g=function(){setTimeout(function(){c._toggle(b,
e,function(){c._animating=!1})},c._animationRate)};$(e).hasClass("closed")?($(e).removeClass("closed"),g()):d?c._animating=!1:($(e).addClass("closed"),g())}else $(e).hasClass("closed")||($(e).addClass("closed"),c._toggle(b,e))})}},closeall:function(){var a=this;this.open("");setTimeout(function(){a._animating=!1},a._animationRate)},_toggle:function(a,d,c){c=c||null;$(d).animate({width:"toggle",padding:"toggle"},this._animationRate,function(){c&&c()});0==$(a).attr("data-click-state")?($(a).attr("data-click-state",
1),$(a).find("img").animateRotate(0,90,this._animationRate)):($(a).attr("data-click-state",0),$(a).find("img").animateRotate(90,0,this._animationRate))}};Crazyerics.prototype._clientdata=null;Crazyerics.prototype._Module=null;Crazyerics.prototype._FS=null;Crazyerics.prototype._ModuleLoading=!1;Crazyerics.prototype._pauseOverride=!1;Crazyerics.prototype._activeFile=null;Crazyerics.prototype._keypresslocked=!1;Crazyerics.prototype._fileWriteDelay=500;Crazyerics.prototype._tips="Back out of that mistake you made by holding the R key to rewind the game;Press the Space key to fast forward through those boring story scenes;If your browser supports it, you can go fullscreen by pressing the F key;You can save your progress by pressing the 1 key, return to it anytime with the 4 key;We'll store all of your save states as long as you return within two weeks;Pause your game with the P key;Select a system filter to generate a new list of suggested games;To search for more obsurace or forgeign titles, select a system filter first;Take a screenshot with the T key. Missed that moment? Rewind with R and capture again!;Screenshots are deleted when you leave or refresh the page. Download your favorites to keep them!".split(";");
Crazyerics.prototype._fileWriteTimers={};Crazyerics.prototype._playhistory={};Crazyerics.prototype._socket=null;Crazyerics.prototype._macroToShaderMenu=[[112,100],40,40,40,88,88,40,40,40,37,37,37,38,88,88,90,90,38,38,38,112];
Crazyerics.prototype.replaceSuggestions=function(a,d){var c=this;d=d||100;$("#suggestionswrapper").hide();$("#loading").removeClass("close");$.getJSON("/suggest/"+a+"/"+d,function(a){a=c._decompress.json(a);$("#suggestionswrapper li").remove();for(var b=$("#suggestionswrapper ul"),d=0;d<a.length;++d){var g=c._buildGameLink(a[d].system,a[d].title,a[d].file,120);$(b[d%b.length]).append(g.li)}$("#suggestionswrapper").waitForImages().progress(function(a,c,b){$("#loading .loadingtext").text(a+"%");a===
c-1&&($("#suggestionswrapper").slideDown(),$("#loading").addClass("close"))});c._toolTips()})};
Crazyerics.prototype._bootstrap=function(a,d,c,f){var b=this,e=b._compress.gamekey(a,d,c);if(!b._ModuleLoading){b._ModuleLoading=!0;b._pauseOverride=!1;$("#gameloadingname").text(d);$("#gamedetailsboxfront img").addClass("close");$("#gamedetailswrapper").fadeOut();$("#startmessage").slideUp(1E3);$("#emulatorwrapper").slideDown(1E3);$("#gameloadingoverlaycontentimage").empty();var g=b._getBoxFront(a,d,170);g.addClass("tada");g.load(function(){$(this).fadeIn(200)});$("#gameloadingoverlaycontentimage").append(g);
var h=setInterval(function(){$("#tip").fadeOut(500,function(){var a=Crazyerics.prototype._tips[Math.floor(Math.random()*Crazyerics.prototype._tips.length)];$("#gameloadingoverlay").is(":animated")||$("#tip").empty().append("Tip: "+a).fadeIn(500)})},5E3);$("#gamedetailsbackground").animate({height:0},500);$("#gameloadingoverlay").fadeIn(500,function(){b.Sliders.closeall();$("#gameloadingoverlaycontent").show().removeClass();$("#emulatorcontrolswrapper").show();$("#gameloadfailure").hide();b._cleanupEmulator();
$("#emulatorcanvas").append('<canvas tabindex="0" id="emulator"></canvas>');var g=$.Deferred(),m=$.Deferred(),n=$.Deferred();$.when(g,m,n).done(function(g,k,m){if("nes"===a)$("#gameloadingoverlaycontent").hide(),$("#gameloadfailure").empty().append("<h2>Crazyerics cannot play NES games at this time</h2><p>Sorry for the inconvenience! I'm a huge NES fanboy myself and hope to have this up soon.</p>").show(),b._ModuleLoading=!1;else{var l=g[0],n=g[1];g=g[2];k=k[1];m=m.states;b._Module=l;b._FS=n;b.emulatorframe=
g;b._setupKeypressInterceptor(a,d,c);b._buildFileSystem(l,a,c,k,m);l.emulatorFileWritten=function(f,g){b._emulatorFileWriteListener(e,a,d,c,f,g)};l.callMain(l.arguments);var p=function(){b._buildGameContent(a,d,function(){});$("#gameloadingoverlaycontent").addClass("close");$("#gameloadingoverlay").fadeOut(1E3,function(){$("#tips").stop().hide();clearInterval(h);setTimeout(function(){b._ModuleLoading=!1;$("#emulatorcontrolswrapper").addClass("closed");b.Sliders.open("controlsslider")},1E3)});$("#emulator").blur(function(a){b._pauseOverride||
(l.pauseMainLoop(),$("#emulatorwrapperoverlay").fadeIn())}).focus(function(){l.resumeMainLoop();$("#emulatorwrapperoverlay").hide()}).focus()};f?b._asyncLoop(parseInt(f,10),function(a){b._simulateEmulatorKeypress(51,10,function(){a.next()})},function(){b._simulateEmulatorKeypress(52);p()}):p()}});b._loademulator(a,g);b._loadGameData(e,a,d,c,m);b._loadGame(e,a,d,c,n)})}};
Crazyerics.prototype._buildGameContent=function(a,d,c){var f=this._getBoxFront(a,d,170),b=document.createElement("img");b.addEventListener("load",function(){$("#gamedetailsboxfront").empty().append(f);$("#gametitle").empty().hide().append(d);$("#gamedetailsboxfront img").addClass("close");$("#gamedetailsbackground").animate({height:250},1E3,function(){$("#gamedetailswrapper").fadeIn(1E3,function(){$("#gamedetailsboxfront img").removeClass();$("#controlsslider").empty();$.get("/layout/controls/"+a,
function(a){$("#controlsslider").append(a)});c()});$("#gametitle").bigText({textAlign:"left",horizontalAlign:"left"})})},!0);f.load(function(){b.setAttribute("src",f.attr("src"))})};
Crazyerics.prototype._cleanupEmulator=function(){$(document).unbind("fullscreenchange");$(document).unbind("mozfullscreenchange");$(document).unbind("webkitfullscreenchange");$(document).unbind("pointerlockchange");$(document).unbind("mozpointerlockchange");$(document).unbind("webkitpointerlockchange");this._FS&&(this._FS=null);if(this._Module){try{this._Module.exit()}catch(a){}this._Module=null}this.emulatorframe&&(this.emulatorframe.remove(),this.emulatorframe=null);$("#emulator").remove()};
Crazyerics.prototype._simulateEmulatorKeypress=function(a,d,c){var f=this;d=d||10;if(this._Module&&this._Module.RI&&this._Module.RI.eventHandler&&!f._keypresslocked){f._keypresslocked=!0;var b;b=$.Event("keydown");b.keyCode=a;b.which=a;this._Module.RI.eventHandler(b);setTimeout(function(){b=$.Event("keyup");b.keyCode=a;b.which=a;f._Module.RI.eventHandler(b);setTimeout(function(){f._keypresslocked=!1;c&&c()},100)},d);$("#emulator").focus()}};
Crazyerics.prototype._runKeyboardMacro=function(a,d){var c=this;if($.isArray(a)&&0!==a.length){var f=a[0];$.isArray(f)&&(f=f[0]);c._simulateEmulatorKeypress(f,1,function(){c._runKeyboardMacro(a.slice(1),d)})}else d&&d()};
Crazyerics.prototype._setupKeypressInterceptor=function(a,d,c){var f=this;if(this._Module&&this._Module.RI&&this._Module.RI.eventHandler){var b=this._Module.RI.eventHandler;this._Module.RI.eventHandler=function(a){switch(a.type){case "keyup":switch(a.keyCode){case 70:f._Module.requestFullScreen(!0,!0);break;case 67:f.getShader("gb-shader")}}b(a)}}};
Crazyerics.prototype._loademulator=function(a,d){var c=$("<iframe/>",{src:"/load/emulator/"+a,style:"display:none",load:function(){var a=this.contentWindow.FS,b=this.contentWindow.Module;b.monitorRunDependencies=function(e){0===e&&d.resolve(b,a,c)};0===b.totalDependencies&&d.resolve(b,a,c)}});$("body").append(c)};
Crazyerics.prototype._loadGameData=function(a,d,c,f,b){var e=this._clientdata.rompath;this._clientdata.flattenedromfiles?(a=this._compress.json({0:c,1:f}),e+="/"+d+"/"+encodeURIComponent(encodeURIComponent(a))):e+="/"+d+"/"+c+"/"+f;$.get(e,function(a){var c;try{c=pako.inflate(a)}catch(d){b.resolve(d);return}b.resolve(null,c)})};
Crazyerics.prototype._loadGame=function(a,d,c,f,b){var e=this;$.get("/load/game?key="+encodeURIComponent(a),function(g){e._addToPlayHistory(a,d,c,f);b.resolve({states:g.states,files:e._decompress.json(g.files)})})};
Crazyerics.prototype._buildFileSystem=function(a,d,c,f,b){a.FS_createDataFile("/",c,f,!0,!0);a.arguments=["-v","/"+c];a.FS_createFolder("/","etc",!0,!0);this._clientdata.retroarch&&this._clientdata.retroarch[d]&&a.FS_createDataFile("/etc","retroarch.cfg",this._clientdata.retroarch[d],!0,!0);a.FS_createFolder("/","shaders",!0,!0);a.FS_createFolder("/","screenshots",!0,!0);for(var e in b)d=this._decompress.bytearray(b[e]),f="/"+c.replace(RegExp(".[a-z0-9]{1,3}$","gi"),"")+".state"+(0==e?"":e),a.FS_createDataFile("/",
f,d,!0,!0)};Crazyerics.prototype.getShader=function(a,d){var c=this;c._FS&&$.getJSON("/shaders/"+a,function(a){var b=c._FS.readdir("/shaders"),d=2;for(d;d<b.length;++d)try{c._FS.unlink("/shaders/"+file)}catch(g){}for(file in a){b=c._decompress.bytearray(a[file]);try{c._FS.createDataFile("/shaders",file,b,!0,!0)}catch(g){}}})};
Crazyerics.prototype._emulatorFileWritten=function(a,d,c,f,b,e){var g=this,h=b.match(/\.state(\d*)$/);b=b.match(/\.bmp$/);if(h){var k=""===h[1]?0:h[1],h=g._compress.bytearray(e);$.ajax({url:"/states/save?key="+encodeURIComponent(a)+"&slot="+k,data:h,processData:!1,contentType:"text/plain",type:"POST",complete:function(b){b={};b[k]=Date.now();g._addToPlayHistory(a,d,c,f,null,b)}})}b&&($("p.screenshothelper").remove(),h=g._clientdata.retroarch[d].match(/video_aspect_ratio = (\d+\.+\d+)/),h=$.isArray(h)&&
1<h.length?parseFloat(h[1]):1,e=new Uint8Array(e),e=new Blob([e],{type:"image/bmp"}),e=(window.URL||window.webkitURL).createObjectURL(e),b=$("#screenshotsslider div.slidercontainer").width()/3,h=new Image(b,b/h),h.src=e,$(h).addClass("close").load(function(){$(this).removeClass("close")}),$('<a class="screenshotthumb" href="'+e+'" download></a>').append(h).insertAfter("#screenshotsslider p"),g.Sliders.open("screenshotsslider",!0))};
Crazyerics.prototype._emulatorFileWriteListener=function(a,d,c,f,b,e){var g=this;g._fileWriteTimers.hasOwnProperty(b)&&clearTimeout(g._fileWriteTimers[b]);g._fileWriteTimers[b]=setTimeout(function(){delete g._fileWriteTimers[b];g._emulatorFileWritten(a,d,c,f,b,e)},g._fileWriteDelay)};
Crazyerics.prototype._buildRecentlyPlayed=function(a,d){for(var c in a)this._addToPlayHistory(c,a[c].system,a[c].title,a[c].file,a[c].played,a[c].slots);$.isEmptyObject(a)?$("#startfirst").animate({height:"toggle",opacity:"toggle"},500):$("#startplayed").animate({height:"toggle",opacity:"toggle"},500)};
Crazyerics.prototype._addToPlayHistory=function(a,d,c,f,b,e){var g;if(a in this._playhistory){if(this._playhistory[a].played=Date.now(),e)for(g in e)this._addStateToPlayHistory(this._playhistory[a],this._playhistory[a].stateswrapper,g,e[g])}else{var h=this._buildGameLink(d,c,f,120,!0,e);h.li.addClass("close");h.img.load(function(){h.li.removeClass("close")});h.remove.addClass("tooltip").attr("title","Remove this game and all saved states").on("click",function(){h.li.addClass("slideup");$.ajax({url:"/states/delete?key="+
encodeURIComponent(a),type:"DELETE",complete:function(){setTimeout(function(){h.li.remove()},500)}})});var k=$('<div class="statewrapper"></div>');h.li.append(k);this._playhistory[a]={system:d,title:c,file:f,played:b||Date.now(),slots:e||{},stateswrapper:k};if(e)for(g in e)this._addStateToPlayHistory(this._playhistory[a],k,g,e[g]);d=$("#recentplayedwrapper ul");c=d[0];for(f=0;f<d.length;++f)c=$(d[f]).children().length<$(c).children().length?d[f]:c;$(c).append(h.li);$("#recentplayedwrapper").show()}this._toolTips()};
Crazyerics.prototype._addStateToPlayHistory=function(a,d,c,f){var b=this;f=new Date(f);f=$.format.date(f,"E MM/dd/yyyy h:mm:ss a");var e=$('<div data-slot="'+c+'" class="statebutton zoom tooltip" title="Load State Saved '+f+'">'+c+"</div>").on("mousedown",function(){b._pauseOverride=!0}).on("mouseup",function(){b._bootstrap(a.system,a.title,a.file,c);window.scrollTo(0,0)}),g=!1;d.children().each(function(){var a=parseInt($(this).attr("data-slot"),10);c=parseInt(c,10);if(a===c)return e.insertBefore(this),
$(this).remove(),g=!0,!1;if(a>c)return e.insertBefore(this),g=!0,!1});g||d.append(e)};
Crazyerics.prototype._buildGameLink=function(a,d,c,f,b){var e=this;b=b||!1;var g=$('<li class="gamelink"></li>');f=e._getBoxFront(a,d,f);f.addClass("tooltip close");f.attr("title",d);f.load(function(){$(this).removeClass("close").on("mousedown",function(){e._pauseOverride=!0}).on("mouseup",function(){e._bootstrap(a,d,c);window.scrollTo(0,0)})});var h=$('<div class="box zoom"></div>');h.append(f);g.append(h);var k=null;b&&(k=$('<div class="remove"></div>'),h.append(k).on("mouseover",function(){$(k).show()}).on("mouseout",
function(){$(k).hide()}));return{li:g,img:f,remove:k}};Crazyerics.prototype._getBoxFront=function(a,d,c){this._clientdata.flattenedboxfiles&&(d=encodeURIComponent(encodeURIComponent(this._compress.string(d))));return $("<img onerror=\"this.src='"+this._clientdata.assetpath+"/images/blanks/"+a+"_"+c+'.png\'" src="'+this._clientdata.boxpath+"/"+a+"/"+d+"/"+c+'.jpg" />')};Crazyerics.prototype._toolTips=function(){$(".tooltip").tooltipster({theme:"tooltipster-shadow",animation:"grow",delay:100})};
Crazyerics.prototype._generateLink=function(a,d,c){return this._compress.string(encodeURI(a+"/"+d+"/"+c))};Crazyerics.prototype._compress={bytearray:function(a){a=pako.deflate(a,{to:"string"});return btoa(a)},json:function(a){a=JSON.stringify(a);a=pako.deflate(a,{to:"string"});return btoa(a)},string:function(a){a=pako.deflate(a,{to:"string"});return btoa(a)},gamekey:function(a,d,c){return this.json({system:a,title:d,file:c})}};
Crazyerics.prototype._decompress={bytearray:function(a){a=new Uint8Array(atob(a).split("").map(function(a){return a.charCodeAt(0)}));return pako.inflate(a)},json:function(a){a=atob(a);a=pako.inflate(a,{to:"string"});return JSON.parse(a)},string:function(a){a=atob(a);return pako.inflate(a,{to:"string"})}};
$.fn.animateRotate=function(a,d,c,f,b){var e=$.speed(c,f,b),g=e.step;return this.each(function(c,b){e.complete=$.proxy(e.complete,b);e.step=function(a){$.style(b,"transform","rotate("+a+"deg)");if(g)return g.apply(b,arguments)};$({deg:a}).animate({deg:d},e)})};Crazyerics.prototype._asyncLoop=function(a,d,c){var f=0,b=!1,e={next:function(){b||(f<a?(f++,d(e)):(b=!0,c()))},iteration:function(){return f-1},"break":function(){b=!0;c()}};e.next();return e};var crazyerics=new Crazyerics;