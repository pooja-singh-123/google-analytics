'use strict';

var base = require('base/product/base');

// send the GTM data to datalayer
function triggerGTM(gtmData) {
  var sendGTAData = $('.googleScriptEnabled').val();
  if (sendGTAData == 'true') {
    window.dataLayer.push({ ecommerce: null }); // Clear the previous ecommerce object.
    window.dataLayer.push(gtmData);
  }

  $('body').on('click', '.add-to-cart', function () {
    if (!$(this).hasClass('isDisabled') && !$(this).hasClass('disabled')) {
      var $ele = $(this);
            // var gtmData = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
      var gtmGA4Data =
                $ele.data('gtmga4data') ||
                $.parseJSON($ele.attr('data-gtmga4data'));
      var qty = $ele
                .closest('.product-wrapper')
                .find('.quantity-select')
                .val();
      qty = qty || 1;

            // addToCart(gtmData, qty);
      addToCartGA4(gtmGA4Data, qty);
    }
  });
}

// /**
//  * @param productId
//  * @description Click event for add product to cart
//  */
// function addToCart(productObject, quantity) {
//     var quantObj = { 'quantity': quantity },
//         obj = {
//             'event': 'addToCart',
//             'ecommerce': {
//                 'add': {
//                     'products': []
//                 }
//             }
//         };
//     obj.ecommerce.add.products.push($.extend(productObject, quantObj));

//     dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
//     dataLayer.push(obj);
// }

/**
 * @param productId
 * @description Click event for add product to cart
 */
function addToCartGA4(productObject, quantity) {
  if (productObject !== undefined) {
    var quantObj = { quantity: quantity };
    var obj = {
      event: 'add_to_cart',
      ecommerce: {
        currency: productObject.currencyCode,
        items: [$.extend(productObject, quantObj)],
        value: (Number(productObject.price) * Number(quantity)).toFixed(
                    2
                )
      }
    };
    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
  }
}

var exportDetails = $.extend({}, base, {
  triggerGTM: triggerGTM,
    // addToCart: addToCart,
  addToCartGA4: addToCartGA4
});
module.exports = exportDetails;
