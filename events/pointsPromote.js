const { Events, PermissionsBitField } = require('discord.js');
const { Users } = require('../database/sequelize');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {

        // Ignore bots
        if (message.author.bot) return;

        const [user] = await Users.findOrCreate({
            where: { userId: message.author.id },
            defaults: {
                currentStatus: message.member?.nickname || 'Peasant',
            },
        });

        // If author is admin, just ignore
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        if (user.praisePoints >= 9) { // 10 points to promote

            // Reset praise points to 0
            user.praisePoints = 0;
            await user.save(); // Save the change to the database
            await user.reload();

            try {
                // Retrieve the GuildMember object
                const member = message.guild.members.cache.get(user.userId);

                if (!member) {
                    throw new Error("Member not found in this guild.");
                }

                // Check if the member can be managed by the bot
                if (member.manageable) {
                    await member.setNickname('Name based on rank worshipper or peasent'); // set the nickname
                    await message.channel.send(
                        `${message.author} has been PROMOTED!\n` +
                        `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
                    );
                } else {
                    throw new Error("I cannot change this user's nickname.");
                }

            } catch (err) {
                console.error(err);
                await message.channel.send(`Can't change ${message.author}'s nickname.`);
            }
        }
    },
};