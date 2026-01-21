const { Events } = require('discord.js');
const { Users } = require('../database/sequelize');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;
        await Users.findOrCreate({
            where: { 
                userId: member.id,
                guildId: member.guild.id,
             },
            defaults: {
                praisePoints: 0,
                sinPoints: 0,
                currentStatus:'Peasant',
            },
        });
        if (member.manageable) {
            try {
                await member.setNickname('Peasant');
            } catch {
                console.warn(`Cannot set nickname for ${member.user.tag}`);
            }
        }
    },

};