var cesControllerDiagramCoordinates = (function(window) {

    var ReadCoordinate = function() {

        var i;
        var value;

        for (i = 0; i < arguments.length; i++) {
            value = arguments[i];

            if (value === null || typeof value === 'undefined' || value === '') {
                continue;
            }

            value = parseFloat(String(value).replace('%', ''));

            if (!isNaN(value)) {
                return value;
            }
        }

        return 50;
    };

    var ClampCoordinate = function(value) {

        value = parseFloat(value);

        if (isNaN(value)) {
            return 50;
        }

        return Math.max(0, Math.min(100, value));
    };

    var GetElementNode = function(element) {

        if (!element) {
            return null;
        }

        if (element.jquery) {
            return element[0] || null;
        }

        if (element.nodeType === 1) {
            return element;
        }

        return null;
    };

    var GetElementGeometry = function(element) {

        var node = GetElementNode(element);
        var rect;
        var width;
        var height;

        if (!node) {
            return null;
        }

        if (node.getBoundingClientRect) {
            rect = node.getBoundingClientRect();
        }

        width = rect ? (rect.width || (rect.right - rect.left)) : 0;
        height = rect ? (rect.height || (rect.bottom - rect.top)) : 0;

        if (!width) {
            width = node.clientWidth || node.offsetWidth || 0;
        }

        if (!height) {
            height = node.clientHeight || node.offsetHeight || 0;
        }

        if (!width || !height) {
            return null;
        }

        return {
            left: rect ? rect.left : 0,
            top: rect ? rect.top : 0,
            width: width,
            height: height
        };
    };

    var TranslateCoordinate = function(x, y, geometry) {

        geometry = geometry || {};

        return {
            left: (ReadCoordinate(x, 50) / 100) * (geometry.width || geometry.stageWidth || 0),
            top: (ReadCoordinate(y, 50) / 100) * (geometry.height || geometry.stageHeight || 0)
        };
    };

    var GetPointer = function(e) {

        var original = e && (e.originalEvent || e);

        if (!original) {
            return null;
        }

        if (original.touches && original.touches.length) {
            return original.touches[0];
        }

        if (original.changedTouches && original.changedTouches.length) {
            return original.changedTouches[0];
        }

        if (typeof original.clientX !== 'undefined' && typeof original.clientY !== 'undefined') {
            return original;
        }

        return null;
    };

    var ReadPointerCoordinate = function(e, element) {

        var geometry = GetElementGeometry(element);
        var pointer = GetPointer(e);

        if (!geometry || !pointer) {
            return null;
        }

        return {
            x: ClampCoordinate(((pointer.clientX - geometry.left) / geometry.width) * 100),
            y: ClampCoordinate(((pointer.clientY - geometry.top) / geometry.height) * 100)
        };
    };

    return {
        readCoordinate: ReadCoordinate,
        clampCoordinate: ClampCoordinate,
        getElementGeometry: GetElementGeometry,
        translateCoordinate: TranslateCoordinate,
        readPointerCoordinate: ReadPointerCoordinate
    };

})(window);

window.cesControllerDiagramCoordinates = cesControllerDiagramCoordinates;
