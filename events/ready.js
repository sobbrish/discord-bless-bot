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

                if (member.nickname?.startsWith('Worshipper')) {
                    await Users.findOrCreate({
                        where: { userId: member.id },
                        defaults: {
                            currentStatus: 'Worshipper',
                            currentRank: member.nickname.slice(-1),
                        },
                    });

                } else {
                    await Users.findOrCreate({
                        where: { userId: member.id },
                        defaults: {
                            currentStatus: 'Peasant',
                            currentRank: 0,
                        },
                    });
                   if (member.manageable) {
                        await member.setNickname('Peasant');
                    } 

                }
            }
        }

        console.log('All guild members added/updated in the database.');
    },
};
