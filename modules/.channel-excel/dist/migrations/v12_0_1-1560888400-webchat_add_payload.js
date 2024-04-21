"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const migration = {
  info: {
    description: `Adds payload field to the table excel_messages`,
    type: 'database'
  },
  up: async ({
    bp
  }) => {
    if (await bp.database.schema.hasColumn('excel_messages', 'payload')) {
      return {
        success: true,
        message: 'Column payload already exists, skipping...'
      };
    }

    try {
      await bp.database.schema.alterTable('excel_messages', table => {
        table.jsonb('payload');
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
//# sourceMappingURL=v12_0_1-1560888400-webchat_add_payload.js.map