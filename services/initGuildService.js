const { Users } = require('../database/sequelize');
const { PermissionsBitField } = require('discord.js');


async function initGuild(guild) {

    await guild.members.fetch();

        for (const member of guild.members.cache.values()) {
            // Ignore bots
       

            if (member.user.bot) continue;

            if (member.permissions.has(PermissionsBitField.Flags.Administrator)) continue;

            if (member.nickname?.startsWith('Worshipper')) {
            await Users.findOrCreate({
                where: { 
                    userId: member.id,
                    guildId: member.guild.id,
                 },
                defaults: {
                    currentStatus: 'Worshipper',
                    currentRank: member.nickname.slice(-1),
                },
            }); 

            } else {
                await Users.findOrCreate({
                    where: { 
                        userId: member.id,
                        guildId: member.guild.id,
                    },
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

module.exports = { initGuild };