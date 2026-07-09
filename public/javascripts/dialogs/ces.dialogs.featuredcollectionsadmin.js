var cesDialogsFeaturedCollectionsAdmin = (function(_config, $el, $wrapper, args) {

    var _collections = [];
    var _sortFields = [];
    var _sortDirections = [];
    var _importSettings = null;
    var _masterInventory = null;
    var _eventsBound = false;
    var _requestInProgress = false;

    var $status = null;
    var $list = null;
    var $title = null;
    var $sort = null;
    var $direction = null;
    var $published = null;
    var $import = null;
    var $example = null;
    var $previewResult = null;
    var $inventoryDownload = null;
    var $inventoryNote = null;

    this.OnOpen = function(args, callback) {
        BindElements();
        BindEvents();
        ShowStatus('Loading featured collections...', false);
        LoadCollections();
    };

    this.OnIntroAnimationComplete = function() {
        if ($title && $title.length) {
            $title.focus();
        }
    };

    this.OnClose = function(callback) {
        ClearStatus();
        if (callback) {
            callback();
        }
    };

    this.GetHeight = function(defaultHeight) {
        var viewportHeight = $(window).height() || defaultHeight || 700;
        return Math.max(560, Math.min(760, viewportHeight - 120));
    };

    function BindElements() {
        $status = $el.find('#featuredcollectionsadminstatus');
        $list = $el.find('#featuredcollectionsadminlist');
        $title = $el.find('#featuredcollectionsadmintitle');
        $sort = $el.find('#featuredcollectionsadminsort');
        $direction = $el.find('#featuredcollectionsadmindirection');
        $published = $el.find('#featuredcollectionsadminpublished');
        $import = $el.find('#featuredcollectionsadminimport');
        $example = $el.find('#featuredcollectionsadminexample');
        $previewResult = $el.find('#featuredcollectionsadminpreviewresult');
        $inventoryDownload = $el.find('#featuredcollectionsadmininventorydownload');
        $inventoryNote = $el.find('#featuredcollectionsadmininventorynote');
    }

    function BindEvents() {
        if (_eventsBound) {
            return;
        }

        _eventsBound = true;

        $el.find('#featuredcollectionsadminclose').on('click.featuredAdmin', function(event) {
            event.preventDefault();
            $(document).trigger('ces.admin.featuredCollections.close');
        });

        $el.find('#featuredcollectionsadminrefresh').on('click.featuredAdmin', function(event) {
            event.preventDefault();
            LoadCollections();
        });

        $el.find('#featuredcollectionsadminpreview').on('click.featuredAdmin', function(event) {
            event.preventDefault();
            PreviewImport();
        });

        $el.find('#featuredcollectionsadmincreate').on('click.featuredAdmin', function(event) {
            event.preventDefault();
            CreateCollection();
        });

        $el.find('#featuredcollectionsadmininventorydownload').on('click.featuredAdmin', function(event) {
            if (!IsAdminActive()) {
                event.preventDefault();
                ShowStatus('Admin mode is required to download the master inventory.', true);
                return;
            }

            if ($inventoryDownload && $inventoryDownload.attr('aria-disabled') === 'true') {
                event.preventDefault();
                ShowStatus('Master inventory file is not available yet. Confirm startup generated master-inventory.tsv.', true);
                return;
            }

            ShowStatus('Starting master inventory download...', false);
        });

        $list.on('click.featuredAdmin', '.featured-admin-row-save', function(event) {
            event.preventDefault();
            SaveRow($(this).closest('tr'));
        });

        $list.on('click.featuredAdmin', '.featured-admin-row-toggle', function(event) {
            event.preventDefault();
            ToggleRow($(this).closest('tr'));
        });

        $list.on('click.featuredAdmin', '.featured-admin-row-delete', function(event) {
            event.preventDefault();
            DeleteRow($(this).closest('tr'));
        });
    }

    function ApiRequest(method, url, body, callback) {
        var options = {
            url: url,
            type: method,
            dataType: 'json',
            cache: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (!response || response.ok === false) {
                    return callback(response && response.error ? response : { error: 'Featured collection request failed.' });
                }

                callback(null, response);
            },
            error: function(xhr) {
                var response = xhr && xhr.responseJSON ? xhr.responseJSON : null;
                callback(response || { error: 'Featured collection request failed.' });
            }
        };

        if (body) {
            options.contentType = 'application/json; charset=utf-8';
            options.data = JSON.stringify(body);
        }

        $.ajax(options);
    }

    function LoadCollections() {
        if (!IsAdminActive()) {
            ShowStatus('Admin mode is required.', true);
            return;
        }

        SetBusy(true);

        ApiRequest('GET', '/admin/featured-collections', null, function(err, response) {
            SetBusy(false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                return;
            }

            _collections = response.collections || [];
            _sortFields = response.sortFields || [];
            _sortDirections = response.sortDirections || [];
            _importSettings = response.import || null;
            _masterInventory = response.masterInventory || null;

            RenderCreateControls();
            RenderList();
            ClearStatus();
        });
    }

    function RenderCreateControls() {
        RenderSortOptions($sort, '');
        RenderDirectionOptions($direction, 'asc');
        RenderMasterInventoryDownload();

        if (_importSettings && _importSettings.example) {
            var exampleText = '';

            if (_importSettings.notes) {
                exampleText += _importSettings.notes + '\n\n';
            }

            exampleText += 'Required CSV headers: ' + (_importSettings.requiredHeaders || 'System,Title,File') + '\n';

            if (_importSettings.alternateHeaders) {
                exampleText += 'Alternate identifier header: ' + _importSettings.alternateHeaders + '\n';
            }

            exampleText += '\nExample CSV:\n' + _importSettings.example;

            $example.text(exampleText);
            if (!$import.val()) {
                $import.attr('placeholder', _importSettings.example);
            }
        }
    }

    function RenderMasterInventoryDownload() {
        var filename = 'master-inventory.tsv';
        var url = '/admin/featured-collections/master-inventory.tsv';
        var note = '';
        var available = true;

        if (_masterInventory) {
            filename = _masterInventory.filename || filename;
            url = _masterInventory.downloadUrl || url;
            available = _masterInventory.available !== false;

            if (available) {
                note = 'Ready';
                if (_masterInventory.size) {
                    note += ' - ' + FormatBytes(_masterInventory.size);
                }
                if (_masterInventory.updated) {
                    note += ' - updated ' + FormatDate(_masterInventory.updated);
                }
            }
            else {
                note = 'Not found at the project root yet. Restart the app or check startup inventory logs.';
            }
        }

        if ($inventoryDownload && $inventoryDownload.length) {
            $inventoryDownload
                .attr('href', url)
                .attr('download', filename)
                .toggleClass('featured-admin-disabled', !available)
                .attr('aria-disabled', available ? 'false' : 'true');
        }

        if ($inventoryNote && $inventoryNote.length) {
            $inventoryNote
                .toggleClass('featured-admin-inventory-missing', !available)
                .text(note);
        }
    }

    function RenderList() {
        $list.empty();

        if (!_collections.length) {
            $('<p class="featured-admin-empty" />').text('No featured collections were found.').appendTo($list);
            return;
        }

        var $table = $('<table class="featured-admin-table" />');
        var $thead = $('<thead />').appendTo($table);
        var $headRow = $('<tr />').appendTo($thead);
        var headers = ['Name', 'Status', 'Games', 'Sort', 'Direction', 'Updated', 'Actions'];

        for (var h = 0; h < headers.length; ++h) {
            $('<th />').text(headers[h]).appendTo($headRow);
        }

        var $tbody = $('<tbody />').appendTo($table);

        for (var i = 0; i < _collections.length; ++i) {
            $tbody.append(BuildCollectionRow(_collections[i]));
        }

        $list.append($table);
    }

    function BuildCollectionRow(collection) {
        var $row = $('<tr />')
            .attr('data-id', collection.id)
            .data('collection', collection);
        var $nameInput = $('<input type="text" class="featured-admin-row-name" maxlength="120" />').val(collection.name || '');
        var $sortSelect = $('<select class="featured-admin-row-sort" />');
        var $directionSelect = $('<select class="featured-admin-row-direction" />');
        var $statusBadge = $('<span class="featured-admin-status-badge" />')
            .addClass(collection.active ? 'published' : 'hidden')
            .text(collection.active ? 'Published' : 'Hidden');
        var $preview = $('<div class="featured-admin-game-preview" />');
        var $actions = $('<div class="featured-admin-row-actions" />');

        RenderSortOptions($sortSelect, collection.sortField || collection.sort || '');
        RenderDirectionOptions($directionSelect, collection.sortDirection || (collection.asc === false ? 'desc' : 'asc'));

        $('<td />').append($nameInput).appendTo($row);
        $('<td />').append($statusBadge).appendTo($row);

        var $gameCell = $('<td />');
        var invalidCount = parseInt(collection.invalidGameCount || 0, 10) || 0;
        var rawCount = parseInt(collection.rawGameCount || collection.gameCount || 0, 10) || 0;
        var validCount = parseInt(collection.gameCount || 0, 10) || 0;

        $gameCell.append($('<span />').text(validCount));

        if (rawCount && rawCount !== validCount) {
            $gameCell.append($('<span class="featured-admin-game-count-note" />').text(' of ' + rawCount + ' hydratable'));
        }

        if (invalidCount) {
            $gameCell.append($('<div class="featured-admin-warning" />').text(invalidCount + ' stored game reference' + (invalidCount === 1 ? '' : 's') + ' could not be hydrated.'));
        }

        $gameCell.append($preview).appendTo($row);

        RenderPreview($preview, collection.preview || [], collection.warnings || []);

        $('<td />').append($sortSelect).appendTo($row);
        $('<td />').append($directionSelect).appendTo($row);
        $('<td />').text(FormatDate(collection.updated || collection.created)).appendTo($row);

        $('<button type="button" class="featured-admin-row-save button zoom noselect" />').text('Save').appendTo($actions);
        $('<button type="button" class="featured-admin-row-toggle button zoom noselect" />').text(collection.active ? 'Hide' : 'Show').appendTo($actions);
        $('<button type="button" class="featured-admin-row-delete button remove zoom noselect" />').text('Delete').appendTo($actions);
        $('<td />').append($actions).appendTo($row);

        return $row;
    }

    function RenderPreview($target, preview, warnings) {
        var labels = [];

        for (var i = 0; i < preview.length; ++i) {
            if (preview[i] && preview[i].title) {
                labels.push(preview[i].system + ': ' + preview[i].title);
            }
        }

        if (labels.length) {
            $('<div />').text(labels.join(', ')).appendTo($target);
        }

        warnings = warnings || [];
        for (var j = 0; j < warnings.length; ++j) {
            $('<div class="featured-admin-warning" />').text(warnings[j]).appendTo($target);
        }
    }

    function RenderSortOptions($select, selected) {
        selected = selected || '';
        $select.empty();

        if (!_sortFields.length) {
            _sortFields = [
                { value: '', label: 'Manual/import order' },
                { value: 'name', label: 'Title name' },
                { value: 'releaseDate', label: 'Release date' },
                { value: 'lastPlayed', label: 'Last played' },
                { value: 'playCount', label: 'Play count' }
            ];
        }

        for (var i = 0; i < _sortFields.length; ++i) {
            $('<option />')
                .attr('value', _sortFields[i].value)
                .text(_sortFields[i].label)
                .prop('selected', String(_sortFields[i].value) === String(selected))
                .appendTo($select);
        }
    }

    function RenderDirectionOptions($select, selected) {
        selected = selected === 'desc' ? 'desc' : 'asc';
        $select.empty();

        if (!_sortDirections.length) {
            _sortDirections = [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
            ];
        }

        for (var i = 0; i < _sortDirections.length; ++i) {
            $('<option />')
                .attr('value', _sortDirections[i].value)
                .text(_sortDirections[i].label)
                .prop('selected', String(_sortDirections[i].value) === String(selected))
                .appendTo($select);
        }
    }

    function SaveRow($row) {
        var collection = $row.data('collection') || {};
        var id = $row.attr('data-id');
        var name = $row.find('.featured-admin-row-name').val();
        var sortField = $row.find('.featured-admin-row-sort').val();
        var sortDirection = $row.find('.featured-admin-row-direction').val();

        if (!id) {
            return;
        }

        SetRowBusy($row, true);

        ApiRequest('PATCH', '/admin/featured-collections/' + encodeURIComponent(id), {
            name: name,
            active: collection.active === true,
            sortField: sortField,
            sortDirection: sortDirection
        }, function(err) {
            SetRowBusy($row, false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                RenderImportResult(err.details);
                return;
            }

            ShowStatus('Featured collection saved.', false);
            NotifyFeaturedChanged();
            LoadCollections();
        });
    }

    function ToggleRow($row) {
        var collection = $row.data('collection') || {};
        var id = $row.attr('data-id');
        var target = collection.active ? 'hide' : 'show';

        if (!id) {
            return;
        }

        SetRowBusy($row, true);

        ApiRequest('POST', '/admin/featured-collections/' + encodeURIComponent(id) + '/' + target, {}, function(err) {
            SetRowBusy($row, false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                return;
            }

            ShowStatus(collection.active ? 'Featured collection hidden.' : 'Featured collection published.', false);
            NotifyFeaturedChanged();
            LoadCollections();
        });
    }

    function DeleteRow($row) {
        var collection = $row.data('collection') || {};
        var id = $row.attr('data-id');

        if (!id) {
            return;
        }

        if (!confirm('Delete featured collection "' + (collection.name || id) + '"?')) {
            return;
        }

        SetRowBusy($row, true);

        ApiRequest('DELETE', '/admin/featured-collections/' + encodeURIComponent(id), null, function(err) {
            SetRowBusy($row, false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                return;
            }

            ShowStatus('Featured collection deleted.', false);
            NotifyFeaturedChanged();
            LoadCollections();
        });
    }

    function PreviewImport() {
        var importText = $import.val();

        SetBusy(true);
        ClearPreview();

        ApiRequest('POST', '/admin/featured-collections/parse-preview', {
            importText: importText
        }, function(err, response) {
            SetBusy(false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                RenderImportResult(err.details);
                return;
            }

            ShowStatus('Import preview complete.', false);
            RenderImportResult(response.importResult);
        });
    }

    function CreateCollection() {
        var payload = {
            name: $title.val(),
            importText: $import.val(),
            sortField: $sort.val(),
            sortDirection: $direction.val(),
            active: $published.prop('checked') === true
        };

        SetBusy(true);
        ClearPreview();

        ApiRequest('POST', '/admin/featured-collections', payload, function(err, response) {
            SetBusy(false);

            if (err) {
                ShowStatus(GetErrorMessage(err), true);
                RenderImportResult(err.details);
                return;
            }

            ShowStatus('Featured collection created.', false);
            RenderImportResult(response.importResult);
            $title.val('');
            $import.val('');
            NotifyFeaturedChanged();
            LoadCollections();
        });
    }

    function RenderImportResult(result) {
        ClearPreview();

        if (!result) {
            return;
        }

        var $summary = $('<div class="featured-admin-preview-summary" />');
        var matched = result.matched ? result.matched.length : 0;
        var unmatched = result.unmatched ? result.unmatched.length : 0;
        var ambiguous = result.ambiguous ? result.ambiguous.length : 0;
        var duplicates = result.duplicates ? result.duplicates.length : 0;
        var errors = result.errors ? result.errors.length : 0;
        var hasBlockingIssues = unmatched || ambiguous || errors;

        $summary
            .toggleClass('featured-admin-preview-blocked', hasBlockingIssues > 0)
            .text('Matched ' + matched + ' game' + (matched === 1 ? '' : 's') + '. Unmatched: ' + unmatched + '. Ambiguous: ' + ambiguous + '. Duplicates: ' + duplicates + '. Other errors: ' + errors + '.');
        $previewResult.append($summary);

        AppendMatchedGames(result.matched);
        AppendImportIssues('Unmatched games', result.unmatched);
        AppendImportIssues('Ambiguous games', result.ambiguous);
        AppendImportIssues('Duplicates ignored', result.duplicates);
        AppendImportIssues('Errors', result.errors);
    }

    function AppendMatchedGames(items) {
        if (!items || !items.length) {
            return;
        }

        var $group = $('<div class="featured-admin-preview-matches" />');
        $('<strong />').text('Matched canonical games').appendTo($group);
        var $list = $('<ul />').appendTo($group);

        for (var i = 0; i < Math.min(items.length, 10); ++i) {
            var item = items[i] || {};
            $('<li />').text('Line ' + (item.line || '?') + ': ' + FormatResolvedGame(item)).appendTo($list);
        }

        if (items.length > 10) {
            $('<li />').text('Additional matched games omitted from this preview.').appendTo($list);
        }

        $previewResult.append($group);
    }

    function AppendImportIssues(title, items) {
        if (!items || !items.length) {
            return;
        }

        var $group = $('<div class="featured-admin-preview-issues" />');
        $('<strong />').text(title).appendTo($group);
        var $list = $('<ul />').appendTo($group);

        for (var i = 0; i < Math.min(items.length, 20); ++i) {
            var item = items[i] || {};
            var $issue = $('<li />').appendTo($list);
            $issue.text('Line ' + (item.line || '?') + ': ' + (item.error || 'Could not import') + FormatReference(item));
            AppendCandidateList($issue, item.candidates);
        }

        if (items.length > 20) {
            $('<li />').text('Additional issues omitted from this preview.').appendTo($list);
        }

        $previewResult.append($group);
    }

    function AppendCandidateList($issue, candidates) {
        if (!candidates || !candidates.length) {
            return;
        }

        var $candidateList = $('<ul class="featured-admin-candidate-list" />').appendTo($issue);

        for (var i = 0; i < Math.min(candidates.length, 5); ++i) {
            $('<li />').text(FormatResolvedGame(candidates[i] || {})).appendTo($candidateList);
        }

        if (candidates.length > 5) {
            $('<li />').text('Additional candidates omitted.').appendTo($candidateList);
        }
    }

    function FormatResolvedGame(item) {
        var parts = [];

        if (item.system || item.systemKey) { parts.push(item.system || item.systemKey); }
        if (item.title) { parts.push(item.title); }
        if (item.file) { parts.push(item.file); }

        return parts.length ? parts.join(' / ') : 'matched game';
    }

    function FormatReference(item) {
        var parts = [];

        if (item.system || item.systemKey) { parts.push(item.system || item.systemKey); }
        if (item.title) { parts.push(item.title); }
        if (item.file) { parts.push(item.file); }

        return parts.length ? ' (' + parts.join(' / ') + ')' : '';
    }

    function ClearPreview() {
        if ($previewResult) {
            $previewResult.empty();
        }
    }

    function ShowStatus(message, isError) {
        if (!$status || !$status.length) {
            return;
        }

        $status
            .toggleClass('featured-admin-status-error', isError === true)
            .toggleClass('featured-admin-status-ok', isError !== true)
            .text(message || '');
    }

    function ClearStatus() {
        if ($status) {
            $status.removeClass('featured-admin-status-error featured-admin-status-ok').text('');
        }
    }

    function GetErrorMessage(err) {
        if (!err) {
            return 'Featured collection request failed.';
        }

        return err.error || err.message || 'Featured collection request failed.';
    }

    function SetBusy(busy) {
        _requestInProgress = busy === true;
        $el.toggleClass('featured-admin-busy', _requestInProgress);
        $el.find('button, input, select, textarea').prop('disabled', _requestInProgress);
    }

    function SetRowBusy($row, busy) {
        $row.toggleClass('featured-admin-row-busy', busy === true);
        $row.find('button, input, select').prop('disabled', busy === true);
    }

    function NotifyFeaturedChanged() {
        $(document).trigger('ces.admin.featuredCollections.changed');
    }

    function IsAdminActive() {
        if (window.cesAdmin && window.cesAdmin.IsActive) {
            return window.cesAdmin.IsActive() === true;
        }

        return $('body').hasClass('runtime-admin-active');
    }

    function FormatBytes(bytes) {
        bytes = parseInt(bytes, 10);

        if (!bytes || bytes < 0) {
            return '';
        }

        if (bytes < 1024) {
            return bytes + ' B';
        }

        if (bytes < 1024 * 1024) {
            return Math.round(bytes / 102.4) / 10 + ' KB';
        }

        return Math.round(bytes / 1024 / 102.4) / 10 + ' MB';
    }

    function FormatDate(value) {
        var date;

        if (!value) {
            return '';
        }

        date = new Date(value);

        if (isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString();
    }

    return this;
});

(function(window, $) {
    'use strict';

    var fallbackModule = null;
    var fallbackOpen = false;
    var fallbackCloseMs = 600;

    function GetFallbackModule() {
        var $dialogs = $('#dialogs');
        var $dialog = $dialogs.find('.FeaturedCollectionsAdmin');

        if (!$dialog.length) {
            return null;
        }

        if (!fallbackModule) {
            fallbackModule = new cesDialogsFeaturedCollectionsAdmin({}, $dialog, $dialogs, []);
        }

        return {
            module: fallbackModule,
            $dialog: $dialog,
            $dialogs: $dialogs
        };
    }

    $(document).on('ces.admin.featuredCollections.open.featuredAdminFallback', function(event) {
        // The normal dialog registry handler is registered during ces.main document-ready.
        // This fallback runs only when that handler did not prevent the event, which keeps
        // production app.min.js deployments usable without double-opening in development.
        setTimeout(function() {
            var fallback;

            if (event.isDefaultPrevented && event.isDefaultPrevented()) {
                return;
            }

            fallback = GetFallbackModule();
            if (!fallback) {
                return;
            }

            event.preventDefault();
            fallbackOpen = true;
            fallback.$dialogs.stop(true, false).animate({ height: fallback.module.GetHeight(700) }, 250);
            fallback.$dialog.removeClass('hide close').addClass('dialog dialog-animation');
            fallback.module.OnOpen([], function() {});
            setTimeout(function() {
                fallback.module.OnIntroAnimationComplete();
            }, 250);
        }, 0);
    });

    $(document).on('ces.admin.featuredCollections.close.featuredAdminFallback', function(event) {
        setTimeout(function() {
            var fallback;

            if (event.isDefaultPrevented && event.isDefaultPrevented()) {
                return;
            }

            if (!fallbackOpen) {
                return;
            }

            fallback = GetFallbackModule();
            if (!fallback) {
                return;
            }

            event.preventDefault();
            fallbackOpen = false;
            fallback.$dialog.addClass('close');
            setTimeout(function() {
                fallback.module.OnClose(function() {
                    fallback.$dialog.addClass('hide');
                });
            }, fallbackCloseMs);
        }, 0);
    });
})(window, jQuery);
