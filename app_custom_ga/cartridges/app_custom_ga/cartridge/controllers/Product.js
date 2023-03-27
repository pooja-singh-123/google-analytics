"use strict";

/**
 * @namespace Product
 */

var server = require("server");
server.extend(module.superModule);

/**
 * Product-Show : This endpoint is called to show the details of the selected product
 * @name Base/Product-Show
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append("Show", function (req, res, next) {
    var ProductMgr = require("dw/catalog/ProductMgr");
    var Resource = require("dw/web/Resource");
    var gaHelper = require("*/cartridge/scripts/helpers/gaHelpers.js");

    var viewData = res.getViewData();
    var product = ProductMgr.getProduct(viewData.product.id);
    var event = Resource.msg("label.gtm.event.viewItem", "googleEvents", null);

    var itemListId = product.primaryCategory
        ? product.primaryCategory.ID
        : null;
    var itemListName = product.primaryCategory
        ? product.primaryCategory.displayName
        : null;

    viewData.gtmData = gaHelper.prepareGtmRequest(
        product,
        event,
        null,
        true,
        itemListId,
        itemListName,
        false
    );

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
