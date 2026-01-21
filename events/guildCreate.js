const { Events } = require('discord.js');
const { initGuild } = require('../services/initGuildService');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        await initGuild(guild);
        console.log(`Initialized database for new guild: ${guild.name}`);
    },
};