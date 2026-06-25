/**
 * Handles normal in-game save data (SRAM, Flash, EEPROM, memory cards, etc.).
 *
 * This is intentionally separate from cesSavesManager, which handles emulator
 * save states/snapshots created by Crazyerics.
 */
var cesSaveFilesManager = (function(_config, _Compression, _Sync, _gameKey, _initialSaveFileData, _saveFileContext, _Logging, _PubSub) {

    var _self = this;
    var _context = _saveFileContext || {};
    var _initialFiles = _initialSaveFileData || [];
    var _dirtyFiles = {};
    var _knownFileFingerprints = {};
    var _lastUnchangedLogAt = {};
    var _dirtyCount = 0;
    var _revision = 0;
    var _uploadTimer = null;
    var _periodicTimer = null;
    var _uploadInProgress = false;
    var _uploadAgainWhenDone = false;
    var _uploadWaiters = [];
    var _stopped = false;
    var _lastStatus = null;
    var _metadata = {};
    var _lastNotificationAt = {};

    var GetConfigValue = function(name, fallback) {
        if (_context && _context.hasOwnProperty(name)) {
            return _context[name];
        }

        if (_config && _config.normalSaveFiles && _config.normalSaveFiles.hasOwnProperty(name)) {
            return _config.normalSaveFiles[name];
        }

        return fallback;
    };

    var Log = function(message) {
        if (_Logging && typeof _Logging.Console === 'function') {
            _Logging.Console('cesSaveFilesManager', message);
        }
    };

    var Notify = function(message, priority, hold, icon, topic, throttleMs) {
        var key;
        var now;

        if (!_PubSub || typeof _PubSub.Publish !== 'function') {
            return;
        }

        key = topic || message;
        now = Date.now();

        if (throttleMs && _lastNotificationAt[key] && now - _lastNotificationAt[key] < throttleMs) {
            Log('Suppressed repeat normal save-file notification: ' + message);
            return;
        }

        _lastNotificationAt[key] = now;
        _PubSub.Publish('notification', [message, priority || 3, !!hold, !!icon, topic || null]);
    };

    var NotifySaveFailure = function(message, topic) {
        var key = topic || 'normalSaveFileFailure';
        var now = Date.now();
        var throttleMs = 30000;

        // Negative normal in-game save-file persistence messages are intentionally
        // hidden from the player. They are background persistence details and can
        // occur during routine scans, flushes, uploads, or unavailable storage.
        if (_lastNotificationAt[key] && now - _lastNotificationAt[key] < throttleMs) {
            Log('Suppressed repeat normal save-file persistence log: ' + (message || 'Could not save in-game progress.'));
            return;
        }

        _lastNotificationAt[key] = now;
        Log('Normal save-file persistence issue suppressed from toast: ' + (message || 'Could not save in-game progress.') + '; topic=' + key);
    };

    var NotifySaveSuccess = function(fileCount) {
        var throttleMs = parseInt(GetConfigValue('successNotificationThrottleMs', 30000), 10);

        if (isNaN(throttleMs) || throttleMs < 0) {
            throttleMs = 30000;
        }

        if (!fileCount || fileCount <= 0) {
            return;
        }

        Notify('In-game progress saved.', 3, false, false, null, throttleMs);
    };

    var NormalizeRelativePath = function(relativePath) {
        relativePath = String(relativePath || '').replace(/\\/g, '/');

        while (relativePath.indexOf('//') >= 0) {
            relativePath = relativePath.replace(/\/\//g, '/');
        }

        if (relativePath.charAt(0) === '/') {
            relativePath = relativePath.substring(1);
        }

        return relativePath;
    };

    var IsInternalMetadataPath = function(relativePath) {
        var metadataFileName = GetConfigValue('metadataFileName', '.crazyerics-savefiles.json');
        return relativePath === metadataFileName || relativePath.indexOf(metadataFileName + '/') === 0;
    };

    var IsSafeRelativePath = function(relativePath) {
        var parts;
        var i;

        relativePath = NormalizeRelativePath(relativePath);
        if (!relativePath || IsInternalMetadataPath(relativePath)) {
            return false;
        }

        if (relativePath.indexOf('\0') >= 0 || relativePath.match(/^[A-Za-z]:/)) {
            return false;
        }

        parts = relativePath.split('/');
        for (i = 0; i < parts.length; i++) {
            if (!parts[i] || parts[i] === '.' || parts[i] === '..') {
                return false;
            }
        }

        return true;
    };

    var CloneBytes = function(contents) {
        if (!contents) {
            return new Uint8Array(0);
        }

        if (contents instanceof Uint8Array) {
            return new Uint8Array(contents);
        }

        if (contents.buffer && typeof contents.byteLength === 'number') {
            return new Uint8Array(contents.buffer.slice(contents.byteOffset || 0, (contents.byteOffset || 0) + contents.byteLength));
        }

        if (typeof contents.length === 'number') {
            return new Uint8Array(contents);
        }

        return new Uint8Array(0);
    };

    var FingerprintBytes = function(bytes) {
        var hash = 2166136261;
        var i;

        bytes = CloneBytes(bytes);
        for (i = 0; i < bytes.length; i++) {
            hash ^= bytes[i];
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }

        return String(bytes.length) + ':' + ((hash >>> 0).toString(16));
    };

    var LogUnchangedSkip = function(relativePath, reason) {
        var now = Date.now();
        var last = _lastUnchangedLogAt[relativePath] || 0;

        // Proactive interval scans should stay quiet when nothing changed.
        if (String(reason || '').match(/save monitor interval/i)) {
            return;
        }

        if (now - last < 30000) {
            return;
        }

        _lastUnchangedLogAt[relativePath] = now;
        Log('Normal save-file unchanged; skipped upload: ' + relativePath + '; reason=' + (reason || 'change detection'));
    };

    var TouchDirtyCount = function(wasDirty, isDirty) {
        if (!wasDirty && isDirty) {
            _dirtyCount++;
        }
        if (wasDirty && !isDirty && _dirtyCount > 0) {
            _dirtyCount--;
        }
    };

    var ClearUploadTimer = function() {
        if (_uploadTimer) {
            clearTimeout(_uploadTimer);
            _uploadTimer = null;
        }
    };

    var RunUploadWaiters = function(err, response) {
        var waiters = _uploadWaiters.slice(0);
        var i;

        _uploadWaiters = [];
        for (i = 0; i < waiters.length; i++) {
            try {
                waiters[i](err || null, response || null);
            } catch (e) {
                Log('Normal save-file upload waiter failed: ' + e);
            }
        }
    };

    var BuildUploadSnapshot = function() {
        var snapshot = [];
        var relativePath;
        var item;

        for (relativePath in _dirtyFiles) {
            if (!_dirtyFiles.hasOwnProperty(relativePath)) {
                continue;
            }

            item = _dirtyFiles[relativePath];
            if (!item || !item.contents || !item.contents.length) {
                continue;
            }

            snapshot.push({
                relativePath: relativePath,
                contents: item.contents,
                clientUpdatedAt: item.clientUpdatedAt,
                revision: item.revision,
                fingerprint: item.fingerprint
            });
        }

        return snapshot;
    };

    var BuildCompressedUpload = function(snapshot) {
        var payload;
        var files = [];
        var i;

        for (i = 0; i < snapshot.length; i++) {
            files.push({
                relativePath: snapshot[i].relativePath,
                sizeBytes: snapshot[i].contents.length,
                clientUpdatedAt: snapshot[i].clientUpdatedAt,
                data: _Compression.Zip.bytearray(snapshot[i].contents)
            });
        }

        payload = {
            context: {
                coreId: _context.coreId,
                storageKey: _context.storageKey
            },
            files: files
        };

        return {
            payload: payload,
            files: files,
            body: _Compression.Compress.json(payload)
        };
    };

    var GetUploadUrl = function() {
        return '/savefiles?gk=' + encodeURIComponent(_gameKey.gk);
    };

    var GetStringByteLength = function(value) {
        if (typeof Blob !== 'undefined') {
            try {
                return new Blob([value]).size;
            } catch (e) {}
        }

        try {
            return unescape(encodeURIComponent(String(value))).length;
        } catch (e2) {
            return String(value || '').length;
        }
    };

    var GetKeepaliveMaxBytes = function() {
        var max = parseInt(GetConfigValue('pageLifecycleKeepaliveMaxBytes', 60000), 10);

        if (isNaN(max) || max <= 0 || max > 60000) {
            max = 60000;
        }

        return max;
    };

    var MarkSnapshotUploaded = function(snapshot, response) {
        var responseFiles = (response && response.files) ? response.files : [];
        var i;
        var current;
        var relativePath;

        for (i = 0; i < responseFiles.length; i++) {
            if (responseFiles[i] && responseFiles[i].relativePath) {
                _metadata[responseFiles[i].relativePath] = responseFiles[i];
            }
        }

        for (i = 0; i < snapshot.length; i++) {
            relativePath = snapshot[i].relativePath;
            current = _dirtyFiles[relativePath];

            if (current && current.revision === snapshot[i].revision) {
                _knownFileFingerprints[relativePath] = snapshot[i].fingerprint || FingerprintBytes(snapshot[i].contents);
                delete _dirtyFiles[relativePath];
                TouchDirtyCount(true, false);
            }
        }
    };

    this.GetContext = function() {
        return _context || {};
    };

    this.GetInitialFiles = function() {
        return _initialFiles || [];
    };

    this.IsEnabled = function() {
        return GetConfigValue('enabled', true) !== false;
    };

    this.IsBrowserSyncEnabled = function() {
        return _self.IsEnabled() && GetConfigValue('browserSyncEnabled', true) !== false;
    };

    this.IsServerSyncEnabled = function() {
        return _self.IsEnabled() && GetConfigValue('serverSyncEnabled', true) !== false;
    };

    this.GetDirtyCount = function() {
        return _dirtyCount;
    };

    this.HasDirtyFiles = function() {
        return _dirtyCount > 0;
    };

    this.MarkSaveFileDirty = function(relativePath, contents, options) {
        var wasDirty;
        var bytes;
        var fingerprint;
        var current;

        options = options || {};
        relativePath = NormalizeRelativePath(relativePath);

        if (!_self.IsEnabled() || !IsSafeRelativePath(relativePath)) {
            Log('Ignoring unsafe or disabled normal save-file write: ' + relativePath);
            return false;
        }

        bytes = CloneBytes(contents);
        if (!bytes.length) {
            Log('Ignoring empty normal save-file write: ' + relativePath);
            return false;
        }

        fingerprint = FingerprintBytes(bytes);
        current = _dirtyFiles[relativePath];

        if (!options.force && current && current.fingerprint === fingerprint) {
            LogUnchangedSkip(relativePath, options.reason || 'already dirty');
            return false;
        }

        if (!options.force && !current && _knownFileFingerprints[relativePath] === fingerprint) {
            LogUnchangedSkip(relativePath, options.reason || 'unchanged from last clean copy');
            return false;
        }

        wasDirty = !!current;
        _revision++;
        _dirtyFiles[relativePath] = {
            relativePath: relativePath,
            contents: bytes,
            clientUpdatedAt: options.clientUpdatedAt || Date.now(),
            revision: _revision,
            fingerprint: fingerprint
        };
        TouchDirtyCount(wasDirty, true);

        Log('Marked normal save-file dirty: ' + relativePath + ' (' + bytes.length + ' bytes, fingerprint=' + fingerprint + '); reason=' + (options.reason || 'file write'));

        _lastStatus = 'dirty';

        _self.QueueUpload(options.reason || 'file write');
        return true;
    };

    this.MarkSaveFilesDirty = function(files, reason) {
        var i;
        var marked = 0;

        if (!files || !files.length) {
            return 0;
        }

        for (i = 0; i < files.length; i++) {
            if (files[i] && files[i].relativePath && files[i].data) {
                if (_self.MarkSaveFileDirty(files[i].relativePath, files[i].data, {
                    reason: reason || 'runtime export',
                    clientUpdatedAt: files[i].clientUpdatedAt
                })) {
                    marked++;
                }
            }
        }

        return marked;
    };

    this.MarkSaveFilesClean = function(files, reason) {
        var i;
        var file;
        var bytes;
        var relativePath;
        var seeded = 0;

        files = files || [];
        for (i = 0; i < files.length; i++) {
            file = files[i];
            relativePath = NormalizeRelativePath(file && file.relativePath);

            if (!file || !relativePath || !file.data || !IsSafeRelativePath(relativePath)) {
                continue;
            }

            bytes = CloneBytes(file.data);
            if (!bytes.length) {
                continue;
            }

            _knownFileFingerprints[relativePath] = FingerprintBytes(bytes);
            seeded++;
        }

        if (seeded) {
            Log('Seeded ' + seeded + ' clean normal save-file fingerprint(s); reason=' + (reason || 'runtime import'));
        }

        return seeded;
    };

    this.QueueUpload = function(reason) {
        var delay;

        if (_stopped || !_self.IsServerSyncEnabled() || _dirtyCount <= 0) {
            return;
        }

        delay = parseInt(GetConfigValue('writeDebounceMs', 750), 10);
        if (isNaN(delay) || delay < 0) {
            delay = 750;
        }

        ClearUploadTimer();
        _uploadTimer = setTimeout(function() {
            _uploadTimer = null;
            _self.FlushServer(null, reason || 'debounced upload');
        }, delay);
    };

    this.FlushServer = function(callback, reason) {
        var snapshot;
        var upload;
        var url;

        callback = callback || function() {};

        if (_stopped && reason !== 'cleanup') {
            return callback();
        }

        if (!_self.IsServerSyncEnabled()) {
            return callback();
        }

        if (_uploadInProgress) {
            _uploadAgainWhenDone = true;
            _uploadWaiters.push(callback);
            Log('Normal save-file server flush requested while upload is in progress; queued follow-up and waiter; reason=' + (reason || 'manual'));
            return;
        }

        snapshot = BuildUploadSnapshot();
        if (!snapshot.length) {
            Log('Normal save-file server flush skipped; no dirty files; reason=' + (reason || 'manual'));
            return callback();
        }

        _uploadInProgress = true;

        try {
            upload = BuildCompressedUpload(snapshot);
        } catch (e) {
            _uploadInProgress = false;
            Log('Unable to compress normal save-file upload: ' + e);
            NotifySaveFailure('Could not save in-game progress.', 'normalSaveFileSaveFailure');
            return callback(e);
        }

        url = GetUploadUrl();
        Log('Uploading ' + upload.files.length + ' normal save-file(s) to server; reason=' + (reason || 'manual'));

        $.ajax({
            url: url,
            processData: false,
            contentType: 'text/plain',
            type: 'POST',
            data: upload.body,
            headers: {
                sync: 1
            },
            timeout: 15000
        })
        .done(function(data) {
            var response;

            _uploadInProgress = false;

            try {
                response = _Compression.Decompress.json(data);
            } catch (e) {
                Log('Unable to decompress normal save-file upload response: ' + e);
                NotifySaveFailure('Could not save in-game progress.', 'normalSaveFileSaveFailure');
                callback(e);
                return;
            }

            _self.OnServerUploadComplete(response);
            MarkSnapshotUploaded(snapshot, response);
            Log('Normal save-file upload completed; uploaded=' + upload.files.length + ', responseFiles=' + ((response && response.files && response.files.length) || 0) + '; reason=' + (reason || 'manual'));

            if (response && response.ok !== false) {
                NotifySaveSuccess(upload.files.length);
            }

            if (_dirtyCount <= 0) {
                _lastStatus = 'synced';
            }

            if (_uploadAgainWhenDone && _dirtyCount > 0) {
                _uploadAgainWhenDone = false;
                _self.FlushServer(function(followUpErr, followUpResponse) {
                    RunUploadWaiters(followUpErr, followUpResponse || response);
                }, 'queued during upload');
            }
            else {
                _uploadAgainWhenDone = false;
                RunUploadWaiters(null, response);
            }

            callback(null, response);
        })
        .fail(function(xhr, textStatus, errorThrown) {
            _uploadInProgress = false;
            Log('Normal save-file upload failed: ' + (errorThrown || textStatus));
            NotifySaveFailure('Could not save in-game progress.', 'normalSaveFileSaveFailure');
            _lastStatus = 'failed';

            if (_uploadAgainWhenDone) {
                _uploadAgainWhenDone = false;
                _self.QueueUpload('retry after failed upload');
            }

            RunUploadWaiters(errorThrown || textStatus || 'normal save-file upload failed');
            callback(errorThrown || textStatus || 'normal save-file upload failed');
        });
    };

    this.FlushServerBestEffort = function(reason) {
        var snapshot;
        var upload;
        var byteLength;
        var maxBytes;
        var url;

        if (_stopped || !_self.IsServerSyncEnabled() || _dirtyCount <= 0) {
            Log('Best-effort normal save-file upload skipped; no dirty files or server sync disabled; reason=' + (reason || 'page lifecycle'));
            return false;
        }

        snapshot = BuildUploadSnapshot();
        if (!snapshot.length) {
            Log('Best-effort normal save-file upload skipped; no dirty snapshot; reason=' + (reason || 'page lifecycle'));
            return false;
        }

        try {
            upload = BuildCompressedUpload(snapshot);
        } catch (e) {
            Log('Unable to compress best-effort normal save-file upload: ' + e);
            return false;
        }

        byteLength = GetStringByteLength(upload.body);
        maxBytes = GetKeepaliveMaxBytes();
        if (byteLength > maxBytes) {
            Log('Best-effort normal save-file upload skipped because payload is too large for keepalive: bytes=' + byteLength + ', limit=' + maxBytes + ', files=' + upload.files.length + ', reason=' + (reason || 'page lifecycle'));
            return false;
        }

        url = GetUploadUrl();
        if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
            try {
                window.fetch(url, {
                    method: 'POST',
                    body: upload.body,
                    headers: {
                        'Content-Type': 'text/plain',
                        sync: '1'
                    },
                    credentials: 'same-origin',
                    keepalive: true
                });
                Log('Best-effort keepalive normal save-file upload queued: files=' + upload.files.length + ', bytes=' + byteLength + ', reason=' + (reason || 'page lifecycle'));
                return true;
            } catch (e2) {
                Log('Best-effort keepalive normal save-file upload failed to queue: ' + e2);
            }
        }

        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            try {
                navigator.sendBeacon(url + '&sync=1', new Blob([upload.body], { type: 'text/plain' }));
                Log('Best-effort beacon normal save-file upload queued: files=' + upload.files.length + ', bytes=' + byteLength + ', reason=' + (reason || 'page lifecycle'));
                return true;
            } catch (e3) {
                Log('Best-effort beacon normal save-file upload failed to queue: ' + e3);
            }
        }

        Log('Best-effort normal save-file upload unavailable because fetch keepalive/sendBeacon is not supported; reason=' + (reason || 'page lifecycle'));
        return false;
    };

    this.OnImportedToRuntime = function(files) {
        var i;
        var file;

        files = files || _initialFiles || [];
        for (i = 0; i < files.length; i++) {
            file = files[i];
            if (file && file.relativePath) {
                _metadata[file.relativePath] = {
                    sha256: file.sha256,
                    sizeBytes: file.sizeBytes,
                    serverUpdatedAt: file.serverUpdatedAt,
                    clientUpdatedAt: file.clientUpdatedAt
                };
            }
        }

        _self.MarkSaveFilesClean(files, 'runtime import');
        Log('Prepared ' + files.length + ' server normal save-file(s) for runtime import');
    };

    this.OnServerUploadComplete = function(response) {
        if (!response || response.ok === false) {
            Log('Normal save-file upload response did not indicate success');
        }
    };

    this.Stop = function() {
        _stopped = true;
        ClearUploadTimer();

        if (_periodicTimer) {
            clearInterval(_periodicTimer);
            _periodicTimer = null;
        }
    };

    var Constructor = (function() {
        var interval = parseInt(GetConfigValue('syncIntervalMs', 15000), 10);

        if (isNaN(interval) || interval < 1000) {
            interval = 15000;
        }

        if (_self.IsServerSyncEnabled()) {
            _periodicTimer = setInterval(function() {
                if (_dirtyCount > 0) {
                    _self.FlushServer(null, 'periodic upload');
                }
            }, interval);
        }

        Log('Initialized normal in-game save manager: storageKey=' + (_context.storageKey || '(none)') + ', coreId=' + (_context.coreId || '(none)') + ', syncIntervalMs=' + interval + ', keepaliveMaxBytes=' + GetKeepaliveMaxBytes());
    })();

});
