'use strict';

var base = module.superModule;
var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

module.exports = function (object, apiProduct, type) {
    base.call(this, object, apiProduct, type);

    Object.defineProperty(object, 'gtmGA4Data', {
        enumerable: true,
        value: gaHelpers.getGA4ProductObject(apiProduct),
        writable: true
    });
};
