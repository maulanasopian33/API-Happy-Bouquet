'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MediaCreatorProjects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      source_media_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Media', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('draft', 'done', 'partial'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      template_ids: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('MediaCreatorProjects', ['status']);
    await queryInterface.addIndex('MediaCreatorProjects', ['createdAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MediaCreatorProjects');
  },
};
