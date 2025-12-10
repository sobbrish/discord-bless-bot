// Initiates the bot and the database

const { Events } = require('discord.js');
const { sequelize, Users } = require('../database/sequelize');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        await sequelize.sync();
        console.log('Database synced!');

        // Populate the database with existing users
		for (const guild of client.guilds.cache.values()) {
            await guild.members.fetch();

            for (const member of guild.members.cache.values()) {
				// Ignore bots
                if (member.user.bot) continue;

                const [user, created] = await Users.findOrCreate({
                    where: { userId: member.id },
                    defaults: {
                        currentStatus: member.nickname || 'Peasant',
                    },
                });

                if (!created) {
                    user.currentStatus = member.nickname || user.currentStatus;
                    await user.save();
                }
            }
        }

        console.log('All guild members added/updated in the database.');
    },
};
