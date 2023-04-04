/* eslint-disable max-len */
'use strict';

var base = require('base/product/base');

/**
 * @param {String} productId The product ID
 * @description gets the data for a product click
 */
function productClick(productObject, itemlistid, itemlistname) {
  var obj = {
    event: 'select_item',
    ecommerce: {
      item_list_id: itemlistid,
      item_list_name: itemlistname,
      items: []
    }
  };
  obj.ecommerce.items.push(productObject);
  dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
  dataLayer.push(obj);
}

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

/**
 * @function removeFromCartGA4
 * @description Click event for remove product from cart
 */
function removeFromCartGA4(productObject, quantity) {
  var quantObj = { quantity: quantity };
  var obj = {
    event: 'remove_from_cart',
    ecommerce: {
      currency: productObject.currency,
      items: [$.extend(productObject, quantObj)],
      value: (Number(productObject.price) * Number(quantity)).toFixed(2)
    }
  };

  dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
  dataLayer.push(obj);
}

/**
 * Events are divided up by name space so only the
 * events that are needed are initialized.
 */
var events = {
  homeshow: function () {
    $('.subscribe-email').on('click', function (e) {
      var userEmail = $('.home-email-signup').find('input[name="hpEmailSignUp"]').val();
      if (userEmail) {
        $(document).ajaxSuccess(function () {
          var visited = window.localStorage.getItem('gtmloadDataVisited');
          var obj = {};
          userEmail = $('.home-email-signup').find('input[name="hpEmailSignUp"]').val();
          var gtmData = {
            userEmail: userEmail
          };
          if (visited !== 'true') {
            var obj = {
              event: 'newsletter_subscription',
              ecommerce: gtmData
            };
            window.localStorage.setItem('gtmloadDataVisited', true);
            dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
            dataLayer.push(obj);
          }
        });
        window.localStorage.setItem('gtmloadDataVisited', false);
      }
    });
  },
  productshow: function () {},
  productshowincategory: function () {},
  searchshow: function () {
    $('body').on('click', '.product .image-container a:not(.quickview), .product .pdp-link a', function (e) {
      var $ele = $(this).closest('.product');
      var gtmdata = $ele.data('gtmga4data') || $.parseJSON($ele.attr('data-gtmga4data'));
      var itemlistid = $ele.data('itemlistid') || $ele.attr('data-itemlistid');
      var itemlistname = $ele.data('itemlistname') || $ele.attr('data-itemlistname');
      productClick(gtmdata, itemlistid, itemlistname);
    });
  },
  cartshow: function () {},
  checkoutbegin: function () {},
  orderconfirm: function () {},
  // events that should happen on every page
  all: function () {
      // Add to Cart
    $('body').on('click', '.add-to-cart, .add-to-cart-global', function () {
      if (!$(this).hasClass('isDisabled') && !$(this).hasClass('disabled')) {
        var $ele = $(this);
        var gtmGA4Data = $ele.data('gtmga4data') || $.parseJSON($ele.attr('data-gtmga4data'));
        var qty = $ele.closest('.product-wrapper').find('.quantity-select').val();
        qty = qty || 1;
        addToCartGA4(gtmGA4Data, qty);
      }
    });

      // Remove from Cart
    $('body').on('click', '.remove-product', function () {
      var $ele = $(this);
      var gtmGA4Data = $ele.data('gtmga4data') || $.parseJSON($ele.attr('data-gtmga4data'));
      var qty = $ele.closest('.card').find('select.quantity').val();
      qty = qty || 1;
      $('body').on('click', '#removeProductModal .cart-delete-confirmation-btn', function () {
        removeFromCartGA4(gtmGA4Data, qty);
      });
    });

      // Update GTM data attribute
    $('body').on('product:updateAddToCart', function (e, response) {
      $('button.add-to-cart, button.add-to-cart-global', response.$productContainer)
              .attr('data-gtmga4data', JSON.stringify(response.product.gtmGA4Data));
    });
  }
};


/**
 * listener for ajax events
 */
function gtmEventLoader() {
  try {
    $(document).ajaxSuccess(function (event, request, settings, data) {
      if (settings.dataTypes.indexOf('json') > -1) {
        if (data && '__gtmEvents' in data && Array.isArray(data.__gtmEvents)) {
          data.__gtmEvents.forEach(function gtmEvent(gtmEvent) {
            if (gtmEvent) {
              dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
              dataLayer.push(gtmEvent);
            }
          });
        }

        if (data && 'gtmEvent' in data) {
          var gtmData = JSON.parse(data.gtmEvent);
          dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
          dataLayer.push(gtmData);
        }
      }
    });
    document.removeEventListener('DOMContentLoaded', gtmEventLoader);
  } catch (e) {
    console.error(e);
  }
}

/**
 * @function init
 * @description Initialize the tag manager functionality
 * @param {String} nameSpace The current name space
 */
$(document).ready(function () {
  if (window.gtmEnabled) {
    if (pageAction && events[pageAction]) {
      events[pageAction]();
    }
    events.all();
  }
  gtmEventLoader();
  window.localStorage.setItem('gtmloadDataVisited', false);
});

/**
* setup ajax event listener
*/
if (document.readyState === 'complete') {
  gtmEventLoader();
} else {
  document.addEventListener('DOMContentLoaded', gtmEventLoader);
}
