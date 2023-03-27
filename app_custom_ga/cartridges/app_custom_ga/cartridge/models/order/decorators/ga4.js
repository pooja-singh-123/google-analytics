'use strict';

var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

module.exports = function (order, options) {
    Object.defineProperty(order, 'gtmGA4Data', {
        enumerable: true,
        value: gaHelpers.getGA4ConfirmationData(order, options),
        writable: true
    });
};
