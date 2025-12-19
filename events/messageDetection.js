const { Events, PermissionsBitField } = require('discord.js');
const { Users } = require('../database/sequelize');

const config = require('../config.json');

const PRAISE_KEYWORDS = ['bless', 'praise', 'hail', 'worship'];
const leoProfanity = require('leo-profanity');

// const TARGET_NAME = 'sophia';

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

        // if (!messageContent.includes(TARGET_NAME)) return;

        // failsafe for if config.json file doesn't exist or if "targetwords" doesn't exist in config
        const TARGET_NAME = Array.isArray(config.targetwords)
            ? config.targetwords.map(w => w.toLowerCase())
            : [];

        if (!TARGET_NAME.some(word => messageContent.includes(word))) return;

        // If author is admin, just ignore
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        if (PRAISE_KEYWORDS.some((gWord) => messageContent.includes(gWord))) {
            await user.increment('praisePoints');
            await user.reload();
            message.channel.send(
                `${message.author} has been blessed! (+1 praise)\n` +
                `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
            );
        }

       else if (leoProfanity.check(message.content)) {
            await user.increment('sinPoints');
            await user.reload();

            try {
                await message.member.timeout(60 * 1000);
                message.channel.send(
                    `UNHOLY TEXT DETECTED BY ${message.author}, You are muted for 1 minute. (+1 sin)\n` +
                    `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
                );

            } catch (err) {
                console.error(err);
                await message.channel.send(
                `Can't timeout ${message.author}, (admins).`,
                );
            }
        }
    },
};

