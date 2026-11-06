const { Model, DataTypes } = require('sequelize');

class MediaCreatorProject extends Model {}

const initMediaCreatorProject = (sequelize) => {
  MediaCreatorProject.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      source_media_id: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'done', 'partial'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      template_ids: {
        type: DataTypes.JSON,
        allowNull: true,
        // MySQL bisa mengembalikan JSON sebagai string; panel butuh array.
        get() {
          const raw = this.getDataValue('template_ids');
          if (typeof raw === 'string') {
            try {
              return JSON.parse(raw);
            } catch (_) {
              return [];
            }
          }
          return raw || [];
        },
      },
    },
    {
      sequelize,
      tableName: 'MediaCreatorProjects',
      indexes: [{ fields: ['createdAt'] }, { fields: ['status'] }],
    }
  );
  return MediaCreatorProject;
};

module.exports = { initMediaCreatorProject };
module.exports.default = MediaCreatorProject;
