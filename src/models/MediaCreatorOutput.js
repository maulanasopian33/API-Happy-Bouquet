const { Model, DataTypes } = require('sequelize');

class MediaCreatorOutput extends Model {}

const initMediaCreatorOutput = (sequelize) => {
  MediaCreatorOutput.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      template_id: { type: DataTypes.INTEGER, allowNull: true },
      media_id: { type: DataTypes.INTEGER, allowNull: false },
      template_name: { type: DataTypes.STRING(100), allowNull: false },
      width: { type: DataTypes.INTEGER, allowNull: false },
      height: { type: DataTypes.INTEGER, allowNull: false },
      file_size: { type: DataTypes.INTEGER, allowNull: false },
      config: { type: DataTypes.JSON, allowNull: false },
    },
    {
      sequelize,
      tableName: 'MediaCreatorOutputs',
      indexes: [{ unique: true, fields: ['project_id', 'template_id'] }],
    }
  );
  return MediaCreatorOutput;
};

module.exports = { initMediaCreatorOutput };
module.exports.default = MediaCreatorOutput;
