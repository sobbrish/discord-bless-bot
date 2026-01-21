// Initiates the bot and the database

const { Events } = require('discord.js');
const { sequelize } = require('../database/sequelize');
const { initGuild } = require('../services/initGuildService');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        await sequelize.sync();
        console.log('Database synced!');

        // Populate the database with existing users
		for (const guild of client.guilds.cache.values()) {
            
            await initGuild(guild);
        }

        console.log('All guild members added/updated in the database.');
    },
};
