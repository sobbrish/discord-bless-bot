const { Users } = require('../database/sequelize');
const { Op } = require('sequelize');

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


async function demoteUser(user, target, member, guild) {

    try {
        await member.timeout(60 * 1000).catch(() => null); // /demote on a peasant will still timeout but do nothing

        if (user.currentStatus == 'Worshipper') { // when a Worshipper is getting demoted (doesn't matter for a Peasant to get Demoted)
            
            // rank shift
            const worshippersBelow = await Users.findAll({
                where: {
                    currentStatus: 'Worshipper',
                    guildId: guild.id,
                    currentRank: { [Op.gt]: user.currentRank },
                },
                order: [['currentRank', 'ASC']], // in ascending order
            }); // every user with Worshipper status and with rank greater than demoting user's rank
            
            // Promote everyone below (rank number decreases by 1)
            for (const wUser of worshippersBelow) {
                wUser.currentRank -= 1;
                await wUser.save();

                // Try to update nickname if they still exist in guild cache/fetch
                const gm = await guild.members.fetch(wUser.userId).catch(() => null);
                if (gm && gm.manageable) {
                    await gm.setNickname(`Worshipper#${wUser.currentRank}`).catch(() => null);
                }
            }

            // Demote the person
            await member.setNickname('Peasant').catch(() => null);; // set the nickname
            user.currentRank = 0;
            user.currentStatus = 'Peasant';
            await user.save();

            return `DEMOTION. :weary: **${target.username}**, muted for 1 min. \n` +
                `:rage: Straight to PEASANT :index_pointing_at_the_viewer: :joy:`;
        } else {
            return `You already at the lowest rank. :poop: **${target.username}** :poop: Muted for 1 min. \n` +
                ` **you clown** 🤡 `;
        }

    } catch (err) {
        console.error(err);
        return "Couldn't demote that user.";
    }
    
}


module.exports = { promoteUser, demoteUser };