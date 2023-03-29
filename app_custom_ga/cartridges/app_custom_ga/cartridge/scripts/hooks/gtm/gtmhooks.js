'use strict';


var velocity = require('dw/template/Velocity');
var gaHelpers = require('*/cartridge/scripts/helpers/gaHelpers');

/**
 * Should be executed inside of the head tags
 * Renders GTM code.s
 */
function htmlHead(pdict) {
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

/**
 * Should be executed right after body tag
 * Renders GTM code.
 */
function beforeHeader(pdict) {
  velocity.render('$velocity.remoteInclude(\'GTM-BeforeHeader\')', { velocity: velocity});
}

// Ensure gtm is enabled before registering hooks
if (gaHelpers.isEnabled) {
  module.exports = {
    htmlHead: htmlHead,
    beforeHeader: beforeHeader
  };
} else {
  module.exports = {
    htmlHead: function () {},
    beforeHeader: function () {}
  };
}
