'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MediaCreatorOutputs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'MediaCreatorProjects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'MediaCreatorTemplates', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      media_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Media', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      template_name: { type: Sequelize.STRING(100), allowNull: false },
      width: { type: Sequelize.INTEGER, allowNull: false },
      height: { type: Sequelize.INTEGER, allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: false },
      config: { type: Sequelize.JSON, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('MediaCreatorOutputs', ['project_id', 'template_id'], {
      unique: true,
      name: 'media_creator_outputs_project_template_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MediaCreatorOutputs');
  },
};
