"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const migration = {
  info: {
    description: `Adds incomingEventId to the table web_messages`,
    type: 'database'
  },
  up: async ({
    bp
  }) => {
    if (await bp.database.schema.hasColumn('excel_messages', 'incomingEventId')) {
      return {
        success: true,
        message: 'Column incomingEventId already exists, skipping...'
      };
    }

    try {
      await bp.database.schema.alterTable('excel_messages', table => {
        table.string('incomingEventId');
      });
      return {
        success: true,
        message: 'Field created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};
var _default = migration;
exports.default = _default;
//# sourceMappingURL=v12_0_0-1560863165-incoming_event.js.map