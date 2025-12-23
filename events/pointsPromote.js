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

        if (user.praisePoints >= 4) { // 5 points to promote a single rank

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
                    await member.setNickname('Worshipper'); // set the nickname
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


        if (user.sinPoints >= 2) { // Straight up demote to Peasent when 3 sin points
            user.sinPoints = 0;
            await user.save();
            await user.reload();

            try {
                const member = message.guild.members.cache.get(user.userId);
                if (!member) {
                    throw new Error("Member not found in this guild.");
                }

                // Check if the member can be managed by the bot
                if (member.manageable) {
                    await member.setNickname('Peasent'); // set the nickname
                    await message.channel.send(
                        `${message.author} has been DEMOTED!\n` +
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