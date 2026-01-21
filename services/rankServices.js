const { Users } = require('../database/sequelize');

async function promoteUser(user, member, guild) {
    if (user.currentStatus == 'Peasant') {

        const worshipperCount = await Users.count({
            where: { 
                currentStatus: 'Worshipper',
                guildId: guild.id,
             },
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
            where: {
                currentRank: newRank,
                guildId: guild.id,
                currentStatus: 'Worshipper',
            },
        });


        if (userAtRank) {

            userAtRank.currentRank = user.currentRank; // where the swap occurs
            await userAtRank.save();
            const memberAtRank = guild.members.cache.get(userAtRank.userId);
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
}

module.exports = { promoteUser };