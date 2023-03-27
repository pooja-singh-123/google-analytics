'use strict';

// var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');

var Site = require('dw/system/Site');
var gtmEnabled = Site.current.getCustomPreferenceValue('GTMEnable') || false;
// var gtmga4Enabled = Site.current.getCustomPreferenceValue('GTMGA4Enable') || false;
var gtmContainerId = Site.current.getCustomPreferenceValue('GTMID') || '';

var SITE_NAME = 'Sites-' + Site.current.ID + '-Site';


// var gtmga4Enabled = Site.current.getCustomPreferenceValue('GTMGA4Enable') || false;
// var gtmContainerId = Site.current.getCustomPreferenceValue('GTMID') || '';

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
function getProductObject(product) {
    var obj = {};
    obj.id = product.ID;
    var master = product.variationModel.master;
    if (product.variant) {
        obj.id = master.ID;
    }

    obj.name = product.name;

    if (product.primaryCategory != null) {
        obj.category = product.primaryCategory.displayName;
        obj.categoryID = product.primaryCategory.ID.replace(/_/gi, '/');
    } else if (master && master.primaryCategory != null) {
        obj.category = master.primaryCategory.displayName;
        obj.categoryID = master.primaryCategory.ID.replace(/_/gi, '/');
    }

    if (product.priceModel.maxPrice.valueOrNull != null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
    } else if (product.priceModel.price.valueOrNull != null) {
        obj.price = product.priceModel.price.value.toFixed(2);
        obj.currencyCode = product.priceModel.price.currencyCode;
    }
    return obj;
}

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
function getGA4ProductObject(product) {
    var obj = {};
    obj.item_id = product.ID;
    var master = product.variationModel.master;
    if (product.variant) {
        obj.item_id = master.ID;
        obj.item_variant = product.ID;
    }

    obj.item_name = product.name;

    if (product.primaryCategory != null) {
        obj.item_category = product.primaryCategory.displayName;
    }
    else if (master && master.primaryCategory != null) {
        obj.item_category = master.primaryCategory.displayName;
    }

    if (product.priceModel.maxPrice.valueOrNull != null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
        obj.currencyCode = product.priceModel.maxPrice.currencyCode;
    } else if (product.priceModel.price.valueOrNull != null) {
        obj.price = product.priceModel.price.value.toFixed(2);
        obj.currencyCode = product.priceModel.price.currencyCode;
    }

    return obj;
}


/**
 * @param {dw.util.Iterator} productList - Iterator composed of Products, ProductListItems, or ProductLineItems
 * @param {Function} callback - Callback that constructs the object that will be added to the returned Array
 * @param {Boolean} ga4 - is a GA4 event
 * @returns {Array} an array containing product data
 */
function getProductArrayFromList(productList, callback, ga4) {
    var productArray = new Array(),
        position = 1;

    while (productList.hasNext()) {
        var item = productList.next(),
            prodObj = {};

        if (item instanceof dw.catalog.Product || item instanceof dw.catalog.Variant) {
            prodObj = callback(item);
            if (ga4) {
                prodObj.index = position;
            } else {
                prodObj.position = position;
                prodObj.list = 'Search Results';
            }
        } else if (item instanceof dw.customer.ProductListItem || item instanceof dw.order.ProductLineItem) {
            prodObj = callback(item);
        }
        productArray.push(prodObj);
        position++;
    }
    return productArray;
}

/**
 * @param {Object} productLineItem - a product line item
 * @returns {Object} an object containing order product data
 */
function getGA4OrderProductObject(productLineItem) {
    var obj = module.exports.getGA4ProductObject(productLineItem.getProduct());
    obj.quantity = productLineItem.getQuantityValue();
    return obj;
}

/**
 * @param {CouponLineItems} coupons - a collection of all the order coupons
 * @return {String} a comman separated string of all the coupons in the order
 */
function getCoupons(coupons) {
    var text = new Array();

    while (coupons.hasNext()) {
        var coupon = coupons.next();
        text.push(coupon.promotion.campaign.ID);
    }

    return text.join(',');
}

/**
 * @param {object} res - current route response object
 * @param {String} step - string of the current step
 * @return {Object} Object containing confirmation page data.
 */
function getConfirmationData(res, step) {
    var obj = {
        'event': 'order-confirmation',
        'ecommerce': {
            'purchase': {
                'actionField': {},
                'products': []
            }
        }
    };

    var order = null;
    try {
        if ('orderToken' in res.CurrentHttpParameterMap) {
            order = dw.order.OrderMgr.getOrder(res.order ? res.order.orderNumber : res.CurrentHttpParameterMap.orderID.value, res.CurrentHttpParameterMap.orderToken.value);
        } else {
            order = dw.order.OrderMgr.getOrder(res.order ? res.order.orderNumber : res.CurrentHttpParameterMap.orderID.value);
        }
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('GTMHelpers - cannot retrieve order: ' + e.message);
    }
    if (order) {
        obj.ecommerce.purchase.products = module.exports.getProductArrayFromList(order.getProductLineItems().iterator(), module.exports.getOrderProductObject, false);
        obj.ecommerce.purchase.actionField = module.exports.getConfirmationActionFieldObject(order, step);
        obj.orderEmail = order.getCustomerEmail();
        obj.orderUser_id = order.getCustomerNo();
        obj.currencyCode = order.currencyCode;
    } else {
        obj.ecommerce.purchase.actionField = {
            step: step,
            affiliation: Site.current.ID
        };
    }

    return obj;
}

/**
 * @param {object} res - current route response object
 * @return {Object} Object containing confirmation page data.
 */
function getGA4ConfirmationData(res) {
    var order = null;
    var obj = null;

    try {
        if ('orderToken' in res.CurrentHttpParameterMap) {
            order = dw.order.OrderMgr.getOrder(res.order ? res.order.orderNumber : res.CurrentHttpParameterMap.orderID.value, res.CurrentHttpParameterMap.orderToken.value);
        } else {
            order = dw.order.OrderMgr.getOrder(res.order ? res.order.orderNumber : res.CurrentHttpParameterMap.orderID.value);
        }
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('GTMHelpers - cannot retrieve order: ' + e.message);
    }

    if (order) {
        obj = {
            'event': 'purchase',
            'ecommerce': {
                'currencyCode': order.currencyCode,
                'transaction_id': order.orderNo,
                'value': order.getAdjustedMerchandizeTotalPrice(true).getValue().toFixed(2),
                'shipping': order.getAdjustedShippingTotalPrice().getValue().toFixed(2),
                'tax': order.getTotalTax().getValue().toFixed(2),
                'items': module.exports.getProductArrayFromList(order.getProductLineItems().iterator(), module.exports.getGA4OrderProductObject, true),
                'affiliation': Site.current.ID
            }
        };

        var coupons = getCoupons(order.getCouponLineItems().iterator());
        if (!empty(coupons)) {
            obj.ecommerce['coupon'] = coupons;
        }
    }

    return obj;
}


/**
* appendProductCategories function is responsible to fetch the product categories
* @param  { Object } catID Product category
* @return { Object } Product Categories
*/
function appendProductCategories(catID) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.getAllBreadcrumbs(catID, null, []);
    var parentCat = {};
    for (var pCat = 0; pCat < showProductPageHelperResult.length; pCat++) {
        if (showProductPageHelperResult[pCat]['htmlValue']) {
            parentCat['item_category' + (pCat + 1)] = showProductPageHelperResult[pCat]['htmlValue'];
        }
    }
    return parentCat;
}

/**
 * prepareGtmRequest function is responsible to prepare the GTM transactional request
 * @param  {Object} product Product data
 * @return {Object} GTM request
 */
function prepareGtmRequest(product, event, quantity, monetaryValue, itemListId, itemListName, selectItem) {
    var itemsArray = [];
    var data = {};
    var currency;
    var parentCat = itemListId ? appendProductCategories(itemListId) : {};
    if (product.priceModel.price.currencyCode == 'N/A') {
        currency = product.priceModel.maxPrice.currencyCode;
    } else {
        currency = product.priceModel.price.currencyCode;
    }
    var productArray = {
        item_name: product.name,
        item_id: product.ID,
        affiliation: Resource.msg('label.affiliation.value', 'order', null),
        currency: currency,
        item_brand: product.brand,
        item_list_id: itemListId,
        item_list_name: itemListName,
        // item_variant: product.custom.categoryStyle && product.custom.categoryStyle != 0 ? product.custom.categoryStyle : product.custom.color,
        price: product.priceModel.price.value ? product.priceModel.price.value : product.priceModel.maxPrice.value,
        quantity: quantity ? quantity : '1'
    };
    var updatedProductArr = Object.assign(productArray, parentCat);
    itemsArray.push(updatedProductArr);
    data.items = itemsArray;
    if (monetaryValue) {
        data.currency = productArray.currency;
        data.value = productArray.price;
    }
    if (selectItem) {
        data.item_list_id = item_list_id;
        data.item_list_name = item_list_name;
    }
    return {
        event: event,
        ecommerce: data
    };
}
/**
 * prepareGtmRequestList function is responsible to prepare the GTM transactional request
 * @param  {Object} productLineItem Product List data
 * @return {Object} GTM request
 */
function prepareGtmRequestList(productLineItem, couponLineItem, event, param, monetaryValue, promotion) {
    var itemsArray = [];
    var itemCurrency = null;
    var itemValue = 0;
    for (var i = 0; i < productLineItem.length; i++) {
        var item = productLineItem[i];
        var parentCat = item.product.primaryCategory ? appendProductCategories(item.product.primaryCategory.ID) : {};
        var productArray = {
            item_name: item.productName,
            item_id: item.productID,
            affiliation: Resource.msg('label.affiliation.value', 'order', null),
            currency: item.price.currencyCode,
            item_brand: item.product.brand,
            item_list_id: item.product.primaryCategory ? item.product.primaryCategory.ID : null,
            item_list_name: item.product.primaryCategory ? item.product.primaryCategory.displayName : null,
            // item_variant: item.product.custom.categoryStyle && item.product.custom.categoryStyle != 0 ? item.product.custom.categoryStyle : item.product.custom.color,
            price: item.price.value ? item.price.value : 0,
            quantity: item.quantityValue
        };
        itemValue = itemValue + productArray.price;
        itemCurrency = productArray.currency;
        var updatedProductArr = Object.assign(productArray, parentCat);
        itemsArray.push(updatedProductArr);
    }
    var data = {};
    if (monetaryValue) {
        data.currency = itemCurrency;
        data.value = itemValue.toFixed(2);
        if (!empty(couponLineItem)) {
            var couponParam = [];
            var iter = couponLineItem.iterator();
            while (iter.hasNext()) {
                var couponData = iter.next();
                if (couponData.applied == true) {
                    couponParam.push(couponData.couponCode);
                }
            }
            data.coupon = couponParam.toString(' | ');
        }
    }

    if (promotion) {
        data.promotion_name = promotion;
    }

    if (event == 'add_shipping_info') {
        data.shipping_tier = param;
    } else if (event == 'add_payment_info') {
        data.payment_type = param;
    }
    data.items = itemsArray;
    return {
        event: event,
        ecommerce: data
    };
}


/**
 * @param {object} res - current route response object
 * @param {Boolean} ga4 - is for GA4
 * @returns {Object} Object containing full datalayer
 */
function getDataLayer(res, ga4) {
    if (ga4) {
        // GA4 Events
        switch (res.action) {
            // case 'Product-Show':
            // case 'Product-ShowInCategory':
            //     return module.exports.getGA4PdpData(res);
            // case 'Search-Show':
            //     return module.exports.getGA4SearchImpressionData(res);
            // case 'Cart-Show':
            //     return module.exports.getGA4CheckoutData('view_cart');
            // case 'Checkout-Begin':
            //     return module.exports.getGA4CheckoutData('begin_checkout');
            // case 'CheckoutShippingServices-SubmitShipping':
            //     return module.exports.getGA4CheckoutData('add_shipping_info');
            // case 'CheckoutServices-SubmitPayment':
            //     return module.exports.getGA4CheckoutData('add_payment_info');
            case 'Order-Confirm':
                return module.exports.getGA4ConfirmationData(res);
            default:
                return false;
        }
    }
}

module.exports = {
    isEnabled: gtmEnabled,
    prepareGtmRequest: prepareGtmRequest,
    prepareGtmRequestList: prepareGtmRequestList,
    appendProductCategories: appendProductCategories,
    getProductObject: getProductObject,
    getGA4ProductObject: getGA4ProductObject,
    getConfirmationData: getConfirmationData,
    getGA4ConfirmationData: getGA4ConfirmationData,
    getDataLayer: getDataLayer,
    gtmContainer: gtmContainerId,
    getProductArrayFromList: getProductArrayFromList,
    getGA4OrderProductObject: getGA4OrderProductObject,
    getCoupons: getCoupons
};
