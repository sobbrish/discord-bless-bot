const { Events, PermissionsBitField } = require('discord.js');
const { Users } = require('../database/sequelize');
const { promoteUser } = require('../services/rankServices');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        // Ignore bots
        if (message.author.bot) return;

        const [user] = await Users.findOrCreate({
            where: { 
                userId: message.author.id,
                guildId: message.guild.id,
             },
            defaults: {
                // currentStatus: message.member?.nickname || 'Peasant', // we compare Status not literal names "Peasants"
                currentStatus: 'Peasant',
                currentRank: 0,
            },
        });

        // If author is admin, just ignore
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        if (user.praisePoints > 4) { // 5 points to promote a single rank

            // Reset praise points to 0
            user.praisePoints = 0;
            await user.save(); // Save the change to the database
            await user.reload();

            try {
                // Retrieve the GuildMember object
                const member = message.guild.members.cache.get(user.userId);
                // const member = await message.guild.members.fetch(user.userId).catch(() => null);

                if (!member) {
                    throw new Error("Member not found in this guild.");
                }

                // Check if the member can be managed by the bot
                if (member.manageable) {

                    if (user.currentStatus === 'Worshipper' && user.currentRank === 1) {
                        return message.channel.send("Chill!! You're already my #1 worshipper 😉");
                    }

                    await promoteUser(user, member, message.guild);

                    await message.channel.send(`**${message.author.username}** has been PROMOTED!\n`);

                } else {
                    throw new Error("I cannot change this user's nickname.");
                }

            } catch (err) {
                console.error(err);
                await message.channel.send(`Can't change **${message.author.username}**'s nickname.`);
            }
        }       
    },
};