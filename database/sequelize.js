const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'points.sqlite',
});

const Users = sequelize.define('Users', {
	userId: {
		type: Sequelize.STRING,
		unique: true,
	},
	praisePoints: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	sinPoints: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	currentStatus: {
        type: Sequelize.STRING,
    },
	currentRank: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},

});

module.exports = { sequelize, Users };