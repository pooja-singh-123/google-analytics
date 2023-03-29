'use strict';

var server = require('server');
server.extend(module.superModule);

var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

server.append('UpdateGrid', function (req, res, next) {
  var viewData = res.getViewData();

  if (gaHelpers.isEnabled) {
    var ga4SearchImpressionData = gaHelpers.getGA4SearchImpressionData(viewData);
    ga4SearchImpressionData.event = 'view_item_list';
    viewData.ga4SearchImpressionData = JSON.stringify(ga4SearchImpressionData);
  }

  res.setViewData(viewData);
  next();
});

module.exports = server.exports();
