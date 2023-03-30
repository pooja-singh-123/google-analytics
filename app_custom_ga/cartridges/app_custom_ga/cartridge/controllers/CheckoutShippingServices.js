'use strict';

var server = require('server');
server.extend(module.superModule);

var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

server.append('SubmitShipping', function (req, res, next) {
  var viewData = res.getViewData();

  if (gaHelpers.isEnabled) {
    var gtmEvent = gaHelpers.getGA4CheckoutData('add_shipping_info');
    viewData.gtmEvent = JSON.stringify(gtmEvent);
  }

  res.setViewData(viewData);
  next();
});

module.exports = server.exports();
