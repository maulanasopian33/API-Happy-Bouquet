'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MediaCreatorTemplates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      width: { type: Sequelize.INTEGER, allowNull: false },
      height: { type: Sequelize.INTEGER, allowNull: false },
      watermark_media_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Media', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      watermark_position: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'bottom-right',
      },
      watermark_x: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      watermark_y: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      watermark_scale: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 18 },
      watermark_opacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 80 },
      margin: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 32 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('MediaCreatorTemplates', ['is_active']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MediaCreatorTemplates');
  },
};
