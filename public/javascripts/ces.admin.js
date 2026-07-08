(function(window, $) {
    'use strict';

    if (window.cesAdminKeyRuntimeLoaded) {
        return;
    }

    window.cesAdminKeyRuntimeLoaded = true;

    var MAX_FILE_BYTES = 4096;
    var MESSAGE_HIDE_MS = 4500;
    var _statusTimer = null;
    var _adminActive = false;
    var _uploadInProgress = false;
    var _$banner = null;
    var _$status = null;
    var _$message = null;
    var _$exit = null;
    var _$featured = null;

    function GetNativeEvent(event) {
        return event && event.originalEvent ? event.originalEvent : event;
    }

    function DataTransferHasFiles(event) {
        var dataTransfer = GetNativeEvent(event).dataTransfer;
        var types;
        var i;

        if (!dataTransfer) {
            return false;
        }

        types = dataTransfer.types;

        if (types) {
            for (i = 0; i < types.length; i++) {
                if (types[i] === 'Files') {
                    return true;
                }
            }
        }

        return !!(dataTransfer.files && dataTransfer.files.length);
    }

    function GetDroppedFiles(event) {
        var dataTransfer = GetNativeEvent(event).dataTransfer;

        if (!dataTransfer || !dataTransfer.files) {
            return [];
        }

        return dataTransfer.files;
    }

    function StopFileDrag(event) {
        var nativeEvent = GetNativeEvent(event);

        event.preventDefault();
        event.stopPropagation();

        if (nativeEvent.dataTransfer) {
            nativeEvent.dataTransfer.dropEffect = 'copy';
        }
    }

    function ShowStatusMessage(message, keepVisible) {
        if (!_$status || !_$status.length) {
            return;
        }

        if (_statusTimer) {
            clearTimeout(_statusTimer);
            _statusTimer = null;
        }

        _$message.text(message || '');
        _$status.addClass('runtime-admin-status-visible');

        if (!keepVisible && !_adminActive) {
            _statusTimer = setTimeout(function() {
                _$status.removeClass('runtime-admin-status-visible');
                _$message.text('');
            }, MESSAGE_HIDE_MS);
        }
    }

    function SetAdminState(adminState) {
        adminState = adminState || { active: false };
        _adminActive = !!(adminState && adminState.active);
        $('body').toggleClass('runtime-admin-active', _adminActive);
        $(document).trigger('ces.admin.state', [_adminActive, adminState]);

        if (_adminActive) {
            ShowStatusMessage('Admin mode active', true);
            _$featured.show();
            _$exit.show();
        }
        else {
            _$featured.hide();
            _$exit.hide();
            if (!_statusTimer) {
                _$status.removeClass('runtime-admin-status-visible');
                _$message.text('');
            }
        }
    }

    function ShowRejectedMessage() {
        ShowStatusMessage('Admin key was not accepted.', false);
    }

    function RefreshAdminStatus() {
        $.ajax({
            url: '/admin/status',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function(response) {
                if (response && response.ok) {
                    SetAdminState(response.admin);
                }
            }
        });
    }

    function UploadAdminKeyFile(file) {
        var formData;

        if (_uploadInProgress) {
            return;
        }

        if (!file || file.size > MAX_FILE_BYTES) {
            ShowStatusMessage('File ignored.', false);
            return;
        }

        formData = new FormData();
        formData.append('adminKey', file, file.name || 'admin.key');
        _uploadInProgress = true;

        $.ajax({
            url: '/admin/key',
            type: 'POST',
            data: formData,
            dataType: 'json',
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response && response.ok && response.admin && response.admin.active) {
                    SetAdminState(response.admin);
                }
                else {
                    ShowRejectedMessage();
                }
            },
            error: function() {
                ShowRejectedMessage();
            },
            complete: function() {
                _uploadInProgress = false;
            }
        });
    }

    function HandleBannerDrop(event) {
        var files;

        if (!DataTransferHasFiles(event)) {
            return;
        }

        StopFileDrag(event);
        _$banner.removeClass('runtime-admin-key-drag');
        files = GetDroppedFiles(event);

        if (!files || files.length !== 1) {
            ShowRejectedMessage();
            return;
        }

        UploadAdminKeyFile(files[0]);
    }

    function LeaveAdminMode() {
        $.ajax({
            url: '/admin/logout',
            type: 'POST',
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                SetAdminState(response && response.admin);
                ShowStatusMessage('Admin mode off', false);
            },
            error: function() {
                ShowStatusMessage('Admin mode off', false);
            }
        });
    }

    function InitializeBannerDrop() {
        _$banner = $('#titlebanner');
        _$status = $('#runtimeadminstatus');
        _$message = _$status.find('.runtime-admin-status-message');
        _$featured = $('#runtimeadminfeatured');
        _$exit = $('#runtimeadminexit');

        if (!_$banner.length || !window.FormData) {
            return;
        }

        _$featured.hide().on('click.cesadmin', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (!_adminActive) {
                return;
            }
            $(document).trigger('ces.admin.featuredCollections.open');
        });

        _$exit.hide().on('click.cesadmin', function(event) {
            event.preventDefault();
            event.stopPropagation();
            LeaveAdminMode();
        });

        _$banner.on('dragenter.cesadmin dragover.cesadmin', function(event) {
            if (!DataTransferHasFiles(event)) {
                return;
            }

            StopFileDrag(event);
            _$banner.addClass('runtime-admin-key-drag');
        });

        _$banner.on('dragleave.cesadmin dragend.cesadmin', function(event) {
            if (!DataTransferHasFiles(event)) {
                return;
            }

            _$banner.removeClass('runtime-admin-key-drag');
        });

        _$banner.on('drop.cesadmin', HandleBannerDrop);
        RefreshAdminStatus();
    }

    $(document).ready(InitializeBannerDrop);

    window.cesAdmin = {
        RefreshStatus: RefreshAdminStatus,
        IsActive: function() {
            return _adminActive;
        }
    };
})(window, jQuery);
