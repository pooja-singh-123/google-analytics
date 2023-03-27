'use strict';


var velocity = require('dw/template/Velocity');
var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

/**
 * Should be executed inside of the head tags
 * Renders GTM code.s
 */
function gtmHeader(pdict) {
  if (gaHelpers.isEnabled) {
    var ga4datalayer = gaHelpers.isGA4Enabled ? gaHelpers.getDataLayer(pdict, true) : false;

    velocity.render(
        "$velocity.remoteInclude('GTM-HtmlHead', 'action', $action, 'ga4datalayer', $ga4datalayer, 'gtmEnabled', $gtmEnabled)",
      {
        velocity: velocity,
        action: pdict.action,
        ga4datalayer: ga4datalayer ? JSON.stringify(ga4datalayer) : false,
        gtmEnabled: gaHelpers.isEnabled
      }
        );
  }
}

module.exports = {
  gtmHeader: gtmHeader
};

// Ensure gtm is enabled before registering hooks
if (gaHelpers.isEnabled) {
  module.exports = {
    gtmHeader: gtmHeader
  };
} else {
  module.exports = {
    gtmHeader: function () { }
  };
}
