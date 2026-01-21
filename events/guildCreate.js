const { Events } = require('discord.js');
const { initGuild } = require('../services/initGuildService');
const { deployCommandsToGuild } = require('../services/deploy-commands');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        await initGuild(guild);
        await deployCommandsToGuild(guild.id);
        console.log(`Initialized database for new guild: ${guild.name}`);
    },
};