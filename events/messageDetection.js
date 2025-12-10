const { Events } = require('discord.js');
const { Users } = require('../database/sequelize');

const PRAISE_KEYWORDS = ['bless', 'praise', 'hail', 'worship'];
const SIN_KEYWORDS = ['ugly', 'stupid', 'hate', 'trash', 'bad', 'dumb', 'suck', 'brainwash', 'ling'];

const TARGET_NAME = 'sophia';

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

        const messageContent = message.content.toLowerCase();
        if (!messageContent.includes(TARGET_NAME)) return;

        if (PRAISE_KEYWORDS.some((gWord) => messageContent.includes(gWord))) {
            await user.increment('praisePoints');
            await user.reload();
            message.channel.send(
                `${message.author} has been blessed! (+1 praise)\n` +
                `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
            );
        }

       else if (SIN_KEYWORDS.some((bWord) => messageContent.includes(bWord))) {
            await user.increment('sinPoints');
            await user.reload();
            // await message.member.timeout(60 * 1000);
            message.channel.send(
                `UNHOLY TEXT DETECTED BY ${message.author}, You are muted for 1 minute. (+1 sin)\n` +
                `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
            );
        }
    },
};
