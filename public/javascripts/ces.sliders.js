var cesSliders = (function(_config, _Compression, $silderIcons) {

    var _self = this;
    var _sliders = {};
    var _currentOpen = null;
    var _openRequestId = 0;
    var $heightContainer = $('#sliderpanels');
    var _heightAnimationDuration = 240;
    var _heightAnimationId = 0;
    var _heightAnimationRunning = false;
    var _heightAnimationTarget = null;
    var _heightRefreshTimers = [];
    var _transitionEndEvents = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd';
    var _heightMutationObserver = null;

    this.Open = function(name, callback) {

        //the name must exist
        if (!_sliders.hasOwnProperty(name)) {
            return;
        }

        //if currently open, keep the selection stable and refresh the wrapper height
        if (name == _currentOpen) {
            ScheduleHeightRefreshPasses();

            if (callback) {
                callback();
            }

            return;
        }

        var data = _sliders[name];
        var previousData = _currentOpen ? _sliders[_currentOpen] : null;
        var requestId = ++_openRequestId;

        FreezeHeightContainer();

        ClosePanelForSwitch(previousData, requestId, function(result) {

            if (requestId != _openRequestId) {
                return;
            }

            if (result === false) {
                RunCallback(callback, false);
                return;
            }

            OpenPanel(data, name, requestId, callback);
        });

    };

    this.Close = function(name, callback) {
        
        name = name || _currentOpen; //close by request or just close open

        if (!_sliders.hasOwnProperty(name) || _currentOpen == null) {
            RunCallback(callback, false);
            return;
        }

        var data = _sliders[name];
        var requestId = ++_openRequestId;

        FreezeHeightContainer();

        RunModuleHook(data.module, 'OnClose', function(result) {

            if (requestId != _openRequestId) {
                return;
            }

            //if the module's onclose indicates true in result, its ok to move on
            if (result) {
                HidePanelImmediately(data);
                _currentOpen = null;

                AnimateHeightTo(0, function() {
                    RunCallback(callback, true);
                });
            }
            else {
                RunCallback(callback, false);
            }
        });
    };

    //called on emaultion exit
    this.DeactivateAll = function(args) {

        ClearHeightRefreshTimers();

        for (var slider in _sliders) {
            if (_sliders[slider].activated == true) {
                _sliders[slider].activated = false;
                _sliders[slider].icon.addClass('deactivated');
                _sliders[slider].module.Deactivate.apply(null, args);
            }
        }

        CloseAllPanelsImmediately();
        ResetHeightContainer();
    };

    this.Activate = function(name, args) {

        if (_sliders[name] && _sliders[name].module && _sliders[name].module.Activate) {
            _sliders[name].activated = true;
            _sliders[name].icon.removeClass('deactivated');  //reveal icon for clicking
            _sliders[name].module.Activate.apply(null, args);

            if (name == _currentOpen) {
                ScheduleHeightRefreshPasses();
            }
        }
    };

    var OpenPanel = function(data, name, requestId, callback) {

        RunModuleHook(data.module, 'OnOpen', function(result) {

            if (requestId != _openRequestId) {
                return;
            }

            //if the module's OnOpen indictaes success, ok to open
            if (result) {
                ShowPanelImmediately(data);
                _currentOpen = name;

                AnimateHeightTo(MeasurePanelHeight(data.panel), function() {

                    if (requestId != _openRequestId) {
                        return;
                    }

                    if (data.module && data.module.OnOpened) {
                        data.module.OnOpened();
                    }

                    ScheduleHeightRefreshPasses();
                });

                ScheduleHeightRefreshPasses();
                RunCallback(callback, true);
            }
            else {
                RunCallback(callback, false);
            }
        });
    };

    var ClosePanelForSwitch = function(data, requestId, callback) {

        if (!data) {
            RunCallback(callback, true);
            return;
        }

        RunModuleHook(data.module, 'OnClose', function(result) {

            if (requestId != _openRequestId) {
                return;
            }

            //if the module's onclose indicates true in result, its ok to move on
            if (result) {
                HidePanelImmediately(data);
                _currentOpen = null;
                RunCallback(callback, true);
            }
            else {
                RunCallback(callback, false);
            }
        });
    };

    var RunModuleHook = function(module, hookName, callback) {

        if (module && module[hookName]) {
            module[hookName](function(result) {
                callback(result);
            });
        }
        else {
            callback(true);
        }
    };

    var ShowPanelImmediately = function(data) {

        HideAllPanelsExcept(data.panel);
        data.icon.addClass('on');

        data.panel
            .stop(true, true)
            .removeClass('closed')
            .addClass('opened')
            .css({
                display: 'block',
                height: '',
                overflow: '',
                paddingTop: '',
                paddingBottom: '',
                marginTop: '',
                marginBottom: ''
            });
    };

    var HidePanelImmediately = function(data) {

        if (!data) {
            return;
        }

        data.icon.removeClass('on');

        data.panel
            .stop(true, true)
            .removeClass('opened')
            .addClass('closed')
            .css({
                display: 'none',
                height: '',
                overflow: '',
                paddingTop: '',
                paddingBottom: '',
                marginTop: '',
                marginBottom: ''
            });
    };

    var HideAllPanelsExcept = function($panelToKeep) {

        for (var slider in _sliders) {
            if (!_sliders.hasOwnProperty(slider)) {
                continue;
            }

            if ($panelToKeep && _sliders[slider].panel[0] == $panelToKeep[0]) {
                continue;
            }

            HidePanelImmediately(_sliders[slider]);
        }
    };

    var CloseAllPanelsImmediately = function() {

        HideAllPanelsExcept(null);
        _currentOpen = null;
    };

    var MeasurePanelHeight = function($panel) {

        if (!$panel || !$panel.length) {
            return 0;
        }

        var height = $panel.outerHeight(true);

        if (isNaN(height)) {
            height = 0;
        }

        return Math.max(0, Math.ceil(height));
    };

    var GetHeightContainerHeight = function() {

        if (!$heightContainer.length) {
            return 0;
        }

        var height = parseFloat($heightContainer.css('height'));

        if (isNaN(height)) {
            height = $heightContainer.height();
        }

        if (isNaN(height)) {
            height = 0;
        }

        return Math.max(0, Math.ceil(height));
    };

    var SetHeightTransition = function(enabled) {

        if (!$heightContainer.length) {
            return;
        }

        var transitionValue = enabled ? 'height ' + _heightAnimationDuration + 'ms ease' : 'none';

        $heightContainer.css({
            transition: transitionValue,
            '-webkit-transition': transitionValue,
            '-moz-transition': transitionValue,
            '-o-transition': transitionValue
        });
    };

    var FreezeHeightContainer = function() {

        if (!$heightContainer.length) {
            return 0;
        }

        var height = GetHeightContainerHeight();

        _heightAnimationId++;
        _heightAnimationRunning = false;
        _heightAnimationTarget = null;
        $heightContainer.off(_transitionEndEvents);
        SetHeightTransition(false);

        $heightContainer.css({
            height: height + 'px',
            overflow: 'visible'
        });

        return height;
    };

    var SetHeightContainerImmediately = function(height) {

        if (!$heightContainer.length) {
            return;
        }

        height = NormalizeHeight(height);
        _heightAnimationId++;
        _heightAnimationRunning = false;
        _heightAnimationTarget = height;
        $heightContainer.off(_transitionEndEvents);
        SetHeightTransition(false);

        $heightContainer.css({
            height: height + 'px',
            overflow: 'visible'
        });
    };

    var ResetHeightContainer = function() {

        if (!$heightContainer.length) {
            return;
        }

        _heightAnimationId++;
        _heightAnimationRunning = false;
        _heightAnimationTarget = null;
        $heightContainer.off(_transitionEndEvents);
        SetHeightTransition(false);

        $heightContainer.css({
            height: '',
            overflow: ''
        });
    };

    var AnimateHeightTo = function(targetHeight, callback) {

        if (!$heightContainer.length) {
            RunCallback(callback, true);
            return;
        }

        targetHeight = NormalizeHeight(targetHeight);

        var startHeight = GetHeightContainerHeight();
        var animationId = ++_heightAnimationId;

        _heightAnimationTarget = targetHeight;
        $heightContainer.off(_transitionEndEvents);
        SetHeightTransition(false);

        $heightContainer.css({
            height: startHeight + 'px',
            overflow: 'visible'
        });

        if (Math.abs(startHeight - targetHeight) <= 1) {
            _heightAnimationRunning = false;
            SetHeightContainerImmediately(targetHeight);
            RunCallback(callback, true);
            return;
        }

        _heightAnimationRunning = true;
        ForceReflow($heightContainer[0]);
        SetHeightTransition(true);

        var complete = false;
        var finish = function() {

            if (complete || animationId != _heightAnimationId) {
                return;
            }

            complete = true;
            _heightAnimationRunning = false;
            _heightAnimationTarget = targetHeight;
            $heightContainer.off(_transitionEndEvents);
            SetHeightTransition(false);

            $heightContainer.css({
                height: targetHeight + 'px',
                overflow: 'visible'
            });

            RunCallback(callback, true);
        };

        $heightContainer.on(_transitionEndEvents, function(e) {

            if (e.target == $heightContainer[0]) {
                finish();
            }
        });

        setTimeout(finish, _heightAnimationDuration + 90);

        NextFrame(function() {

            if (animationId != _heightAnimationId) {
                return;
            }

            $heightContainer.css({
                height: targetHeight + 'px',
                overflow: 'visible'
            });
        });
    };

    var RefreshOpenHeight = function(animate, callback) {

        if (!_currentOpen || !_sliders[_currentOpen]) {
            RunCallback(callback, false);
            return;
        }

        if (!$heightContainer.is(':visible')) {
            ResetHeightContainer();
            RunCallback(callback, false);
            return;
        }

        var targetHeight = MeasurePanelHeight(_sliders[_currentOpen].panel);

        if (_heightAnimationRunning && Math.abs(_heightAnimationTarget - targetHeight) <= 1) {
            RunCallback(callback, true);
            return;
        }

        if (animate === false) {
            SetHeightContainerImmediately(targetHeight);
            RunCallback(callback, true);
            return;
        }

        FreezeHeightContainer();
        AnimateHeightTo(targetHeight, callback);
    };

    var ScheduleHeightRefresh = function(delay) {

        var timer = setTimeout(function() {
            RemoveHeightRefreshTimer(timer);
            RefreshOpenHeight(true);
        }, delay || 0);

        _heightRefreshTimers.push(timer);
    };

    var ScheduleHeightRefreshPasses = function() {

        if (!_currentOpen) {
            return;
        }

        ClearHeightRefreshTimers();

        ScheduleHeightRefresh(45);
        ScheduleHeightRefresh(140);
        ScheduleHeightRefresh(320);
        ScheduleHeightRefresh(700);
        ScheduleHeightRefresh(1250);
    };

    var ClearHeightRefreshTimers = function() {

        while (_heightRefreshTimers.length) {
            clearTimeout(_heightRefreshTimers.pop());
        }
    };

    var RemoveHeightRefreshTimer = function(timer) {

        for (var i = _heightRefreshTimers.length - 1; i >= 0; i--) {
            if (_heightRefreshTimers[i] == timer) {
                _heightRefreshTimers.splice(i, 1);
                return;
            }
        }
    };

    var BindDynamicHeightRefresh = function() {

        $(window).on('resize.cesSlidersHeight', function() {
            ScheduleHeightRefreshPasses();
        });

        if ($heightContainer[0] && $heightContainer[0].addEventListener) {
            $heightContainer[0].addEventListener('load', function(e) {

                if (e.target && e.target.tagName && e.target.tagName.toLowerCase() == 'img') {
                    ScheduleHeightRefreshPasses();
                }
            }, true);
        }
        else {
            $heightContainer.on('load.cesSlidersHeight', 'img', function() {
                ScheduleHeightRefreshPasses();
            });
        }

        if (window.MutationObserver && $heightContainer[0]) {
            _heightMutationObserver = new window.MutationObserver(function() {
                ScheduleHeightRefreshPasses();
            });

            _heightMutationObserver.observe($heightContainer[0], {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    };

    var NormalizeHeight = function(height) {

        height = parseFloat(height);

        if (isNaN(height)) {
            height = 0;
        }

        return Math.max(0, Math.ceil(height));
    };

    var ForceReflow = function(element) {

        if (element) {
            return element.offsetHeight;
        }

        return 0;
    };

    var NextFrame = function(callback) {

        var requestFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(fn) {
                return setTimeout(fn, 16);
            };

        requestFrame(callback);
    };

    var RunCallback = function(callback, result) {

        if (callback) {
            callback(result);
        }
    };

    //self execute at end of script for availiblity of everything above
    var Constructor = (function() {

        $silderIcons.children().each(function(index, li) {

            var $li = $(li);
            var sliderId = $(this).data('slider');
            var $panel = $('#' + sliderId + '-slider');

            $li.addClass('deactivated');

            //if a data reference was found along with the dom element
            if (sliderId && $('#' + sliderId + '-slider')) {

                $li.attr('tabindex', '0');

                var module;

                if (window.hasOwnProperty('cesSliders' + sliderId)) {
                    module = new window['cesSliders' + sliderId](_config, $li, $panel, function() {
                        _self.Open(sliderId); //give each module the ability to open themselves (because some are subscribing to topics)
                    });
                }

                _sliders[sliderId] = {
                    icon: $li,
                    panel: $panel,
                    module: module,
                    activated: false
                };

                var OpenSlider = function() {
                    _self.Open(sliderId);
                };

                $li.on('click', OpenSlider);

                $li.on('keydown', function(e) {
                    var key = e.which || e.keyCode;

                    if (key == 13 || key == 32) {
                        e.preventDefault();
                        OpenSlider();
                    }
                });
            }
        });

        BindDynamicHeightRefresh();

    })();

    return this;
});
