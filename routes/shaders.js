'use strict';

const express = require('express');
const router = express.Router();
const ShaderService = require('../services/shaders');

router.get('/list', function(req, res, next) {
    ShaderService.ListPresets(function(err, result) {
        if (err) {
            return next(err);
        }

        res.json(result);
    });
});

router.post('/defaults/:system', function(req, res) {
    var shader = req.body && Object.prototype.hasOwnProperty.call(req.body, 'shader') ? req.body.shader : null;

    ShaderService.SaveSystemDefault(req.user && req.user.user_id, req.params.system, shader, function(err, result) {
        if (err) {
            return res.status(err.status || 500).json({
                ok: false,
                error: err.message || 'Shader default could not be saved.'
            });
        }

        res.json({
            ok: true,
            default: result
        });
    });
});

router.delete('/defaults/:system', function(req, res) {
    ShaderService.ClearSystemDefault(req.user && req.user.user_id, req.params.system, function(err, result) {
        if (err) {
            return res.status(err.status || 500).json({
                ok: false,
                error: err.message || 'Shader default could not be cleared.'
            });
        }

        res.json({
            ok: true,
            default: result
        });
    });
});

module.exports = router;
