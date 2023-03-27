'use strict';

var server = require('server');

var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');


// render helpers for velocity template use from hooks
server.get('HtmlHead', server.middleware.include, function (req, res, next) {
    // var action = req.querystring.action;
    // var datalayer = req.querystring.datalayer;
    // var ga4datalayer = req.querystring.ga4datalayer;

    res.render('gtm/gtmScript', {
        id: gaHelpers.gtmContainer,
        action: req.querystring.action,
        datalayer: req.querystring.datalayer,
        ga4datalayer: req.querystring.ga4datalayer,
        gtmEnabled: req.querystring.gtmEnabled
    });

    next();
});

module.exports = server.exports();
