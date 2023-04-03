/* eslint-disable max-len */
'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');

var Site = require('dw/system/Site');
var gtmEnabled = Site.current.getCustomPreferenceValue('GTMEnable') || false;
var gtmga4Enabled = Site.current.getCustomPreferenceValue('GTMGA4Enable') || false;
var gtmContainerId = Site.current.getCustomPreferenceValue('GTMID') || '';

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object of containing customer data
 */
function getCustomerData(res) {
  var system = require('dw/system/System');
  var customer = res.currentCustomer.raw,
    profile = customer.profile,
    session = request.session,
    customerObject = {};

  customerObject.environment = (system.instanceType === system.PRODUCTION_SYSTEM ? 'production' : 'development');
  customerObject.demandwareID = customer.ID;
  customerObject.loggedInState = customer.authenticated;
  if (res.locale && res.locale.id) {
    customerObject.locale = res.locale.id;
  } else {
    customerObject.locale = Site.current.defaultLocale;
  }
  customerObject.currencyCode = session.currency.currencyCode;
  customerObject.pageLanguage = request.httpLocale;
  customerObject.registered = customer.registered;

  if (customer.registered && profile != null) {
    customerObject.email = profile.email.toLowerCase();
    customerObject.emailHash = dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(profile.email.toLowerCase())));
    customerObject.user_id = profile.customerNo;
  } else {
    var email = (session.custom.email == null) ? '' : session.custom.email;
    var emailHash = (session.custom.emailHash == null) ? '' : session.custom.emailHash;
    customerObject.email = email;
    customerObject.emailHash = emailHash;
    customerObject.user_id = '';
  }

  return customerObject;
}

/**
 * @returns {Object} an object of containing home page data
 */
function getHomeData() {
  var obj = {
      'event': 'home'
  };
  return obj;
}

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
  } else if (master && master.primaryCategory != null) {
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
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
 function getGA4ListObject(product) {
  var obj = {};
  if (product.categories && product.categories.length > 0) {
    var prodCat = product.categories[product.categories.length -1];
    obj.item_list_id = prodCat.ID;
    obj.item_list_name = prodCat.displayName;
  } else {
    obj.item_list_id = 'home';
    obj.item_list_name = 'home';
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
    event: 'order-confirmation',
    ecommerce: {
      purchase: {
        actionField: {},
        products: []
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
      event: 'purchase',
      ecommerce: {
        currencyCode: order.currencyCode,
        transaction_id: order.orderNo,
        value: order.getAdjustedMerchandizeTotalPrice(true).getValue().toFixed(2),
        shipping: order.getAdjustedShippingTotalPrice().getValue().toFixed(2),
        tax: order.getTotalTax().getValue().toFixed(2),
        items: module.exports.getProductArrayFromList(order.getProductLineItems().iterator(), module.exports.getGA4OrderProductObject, true),
        affiliation: Site.current.ID
      }
    };

    var coupons = getCoupons(order.getCouponLineItems().iterator());
    if (!empty(coupons)) {
      obj.ecommerce.coupon = coupons;
    }
  }

  return obj;
}

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object of containing pdp data
 */
function getGA4PdpData(res) {
  if ('product' in res) {
    var product = ProductMgr.getProduct(res.product.id);
    var productObject = module.exports.getGA4ProductObject(product);

    return {
      event: 'view_item',
      ecommerce: {
        currencyCode: productObject.currencyCode,
        value: productObject.price,
        items: [productObject]
      }
    };
  }

  return {};
}

/**
 * @param {Object} res - current route response object
 * @returns {Object} an object containing a product list
 */
function getSearchProducts(res) {
  var products = new dw.util.ArrayList();
  if ('productSearch' in res) {
    for (var i = 0; i < res.productSearch.productIds.length; i++) {
      var product = ProductMgr.getProduct(res.productSearch.productIds[i].productID);
      products.add1(product);
    }
  }
  return products;
}

/**
 * @param {Object} res - current route response object
 * @return {Object} Object containing search impression data.
 */
function getGA4SearchImpressionData(res) {
  var obj = {
    event: 'view_item_list',
    ecommerce: {
      items: module.exports.getProductArrayFromList(module.exports.getSearchProducts(res).iterator(), module.exports.getGA4ProductObject, true)
    }
  };

  if ('productSearch' in res && 'category' in res.productSearch) {
    if ('id' in res.productSearch.category) {
      obj.ecommerce.item_list_id = res.productSearch.category.id;
    }
    if ('name' in res.productSearch.category) {
      obj.ecommerce.item_list_name = res.productSearch.category.name;
    }
  }

  return obj;
}


/**
 * @param {String} step - string of the current step, potential values: view_cart, begin_checkout, add_shipping_info, add_payment_info
 * @return {Object} Object containing GA4 checkout data
 */
function getGA4CheckoutData(step) {
  var currentBasket = dw.order.BasketMgr.getCurrentBasket();

  if (currentBasket != null) {
    var obj = {
      event: step,
      ecommerce: {
        currencyCode: currentBasket.currencyCode,
        value: currentBasket.getAdjustedMerchandizeTotalNetPrice().value.toFixed(2),
        items: module.exports.getProductArrayFromList(currentBasket.getProductLineItems().iterator(), module.exports.getGA4OrderProductObject, true)
      }
    };

    if (step == 'begin_checkout' || step == 'add_shipping_info' || step == 'add_payment_info') {
      var coupons = getCoupons(currentBasket.getCouponLineItems().iterator());

      if (!empty(coupons)) {
        obj.ecommerce.coupon = coupons;
      }
    }

    if (step == 'add_shipping_info') {
      var shipment = currentBasket.getDefaultShipment();

      if ('shippingMethod' in shipment && 'displayName' in shipment.shippingMethod) {
        obj.ecommerce.shipping_tier = shipment.shippingMethod.displayName;
      }
    }

    if (step == 'add_payment_info') {
      var paymentInstrumentsArray = new Array();
      var paymentInstruments = currentBasket.getPaymentInstruments().iterator();

      while (paymentInstruments.hasNext()) {
        var paymentInstrument = paymentInstruments.next();
        paymentInstrumentsArray.push(paymentInstrument.paymentMethod);
      }

      if (paymentInstrumentsArray.length > 0) {
        obj.ecommerce.payment_type = paymentInstrumentsArray.join(',');
      }
    }

    return obj;
  }

  return {};
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
      case 'Product-Show':
      case 'Product-ShowInCategory':
        return module.exports.getGA4PdpData(res);
      case 'Search-Show':
        return module.exports.getGA4SearchImpressionData(res);
      case 'Cart-Show':
        return module.exports.getGA4CheckoutData('view_cart');
      case 'Checkout-Begin':
        return module.exports.getGA4CheckoutData('begin_checkout');
      case 'Order-Confirm':
        return module.exports.getGA4ConfirmationData(res);
      default:
        return false;
    }
  }
}

module.exports = {
  isEnabled: gtmEnabled,
  isGA4Enabled: gtmga4Enabled,
  gtmContainer: gtmContainerId,
  getDataLayer: getDataLayer,
  getProductObject: getProductObject,
  getGA4ProductObject: getGA4ProductObject,
  getCustomerData: getCustomerData,
  getGA4SearchImpressionData: getGA4SearchImpressionData,
  getHomeData: getHomeData,
  getGA4PdpData: getGA4PdpData,
  getCoupons: getCoupons,
  getConfirmationData: getConfirmationData,
  getGA4ConfirmationData: getGA4ConfirmationData,
//   getConfirmationActionFieldObject: getConfirmationActionFieldObject,
  getProductArrayFromList: getProductArrayFromList,
  getSearchProducts: getSearchProducts,
  getGA4OrderProductObject: getGA4OrderProductObject,
  getGA4CheckoutData: getGA4CheckoutData,
  getGA4ListObject: getGA4ListObject
};
