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

                    if (user.currentStatus == 'Peasant') {

                        const worshipperCount = await Users.count({
                            where: { currentStatus: 'Worshipper' },
                        });
                        const rank = worshipperCount + 1;
                        await member.setNickname(`Worshipper#${rank}`);
                        user.currentRank = rank;
                        user.currentStatus = 'Worshipper';
                        await user.save();

                    } else if (user.currentStatus === 'Worshipper' && user.currentRank > 1) {
                        const newRank = user.currentRank - 1;
                         
                        // checks if there are two people in the same rank, if there is than promote user who most recently got promoted and demote the other
                        const userAtRank = await Users.findOne({
                                where: { currentRank: newRank },
                        });

                        if (userAtRank) {

                            userAtRank.currentRank = user.currentRank; // where the swap occurs
                            await userAtRank.save();
                            const memberAtRank = message.guild.members.cache.get(userAtRank.userId);
                            if (memberAtRank && memberAtRank.manageable) {
                                try {
                                    await memberAtRank.setNickname(`Worshipper#${userAtRank.currentRank}`);
                                } catch (err) {
                                    console.error(err);
                                    console.warn(`Cannot change nickname for ${memberAtRank.user.tag}`);
                                }
                            }
                        }

                        user.currentRank = newRank;
                        await member.setNickname(`Worshipper#${newRank}`);
                        await user.save();
                    }
                    
                    if (user.currentRank == 1) {
                        await message.channel.send("Chill!! You're already my #1 worshipper 😉");
                    }

                    await message.channel.send(
                        `${message.author} has been PROMOTED!\n` +
                        `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}  Current Status" ${user.currentStatus}`,
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