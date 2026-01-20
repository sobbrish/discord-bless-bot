const { Events } = require('discord.js');
const { Users } = require('../database/sequelize');
const { Op } = require('sequelize'); // e.g: Op.gt

module.exports = {
  name: Events.GuildMemberRemove, // when any member leaves the server while the bot is online
  async execute(member) { // member = member who has left - you can still read member.id
    try {
      const user = await Users.findOne({ where: { userId: member.id } }); // look up user in DB
      if (!user) return;

      // Only need to fix the ladder if they were ranked/worshipper (if peasant, it don't matter)
      if (user.currentStatus === 'Worshipper' && user.currentRank > 0) {
        const leavingRank = user.currentRank;

        // Shift everyone below them up (rank decreases by 1)
        const worshippersBelow = await Users.findAll({
          where: {
            currentStatus: 'Worshipper',
            currentRank: { [Op.gt]: leavingRank },
          },
          order: [['currentRank', 'ASC']],
        });

        for (const wUser of worshippersBelow) {
          wUser.currentRank -= 1;
          await wUser.save();

          // Try to update nickname if they still exist in guild cache/fetch
          const gm = await member.guild.members.fetch(wUser.userId).catch(() => null);
          if (gm && gm.manageable) {
            await gm.setNickname(`Worshipper#${wUser.currentRank}`).catch(() => null);
          }
        }

        // Remove rank from the leaver (so DB doesn't keep a ghost worshipper)
        user.currentStatus = 'Peasant';
        user.currentRank = 0;
        await user.save();
      } else {
        // If they were already Peasant, optional: do nothing
        // Or cleanup their record if you want
      }
    } catch (err) {
      console.error('member left but rank cleanup failed:', err);
    }
  },
};
