const { Events, PermissionsBitField } = require('discord.js');
const { Users } = require('../database/sequelize');
const { Op } = require('sequelize');

const config = require('../config.json');

const PRAISE_KEYWORDS = ['bless', 'praise', 'hail', 'worship', 'good', 'ace', 'pro', 'cool', 'lord'];
const leoProfanity = require('leo-profanity');
leoProfanity.addWord('bad');
// const TARGET_NAME = 'sophia';

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
                `**${message.author.username}** has been blessed! (+1 praise)\n` +
                `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
            );
        }

       else if (leoProfanity.check(messageContent)) {
            await user.increment('sinPoints');
            await user.reload();

            try {
                await message.member.timeout(60 * 1000);

                message.channel.send(
                    `UNHOLY TEXT DETECTED BY **${message.author.username}**, You are muted for 1 minute. (+1 sin)\n` +
                    `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
                );

                // demote immediately when it reaches threshold
                if (user.sinPoints >= 3) { // Straight up demote to Peasant when 3 sin points

                    try {
                        // Retrieve the GuildMember object
                        const member = await message.guild.members.fetch(user.userId).catch(() => null);
                        if (!member) throw new Error("Member not found in this guild.");
                        if (!member.manageable) throw new Error("I cannot change this user's nickname."); // Check if this member can be managed by the bot

                        if (user.currentStatus == 'Worshipper') { // when a Worshipper is getting demoted (doesn't matter for a Peasant to get Demoted) 

                            const worshippersBelow = await Users.findAll({
                                where: {
                                    guildId: message.guild.id,
                                    currentStatus: 'Worshipper',
                                    currentRank: { [Op.gt]: user.currentRank },
                                },
                                order: [['currentRank', 'ASC']], // in ascending order
                            }); // every user with Worshipper status and with rank greater than demoting user's rank

                            // Promote everyone below (rank number decreases by 1)
                            for (const wUser of worshippersBelow) {
                                wUser.currentRank -= 1;
                                await wUser.save();

                                const guildMember = await message.guild.members.fetch(wUser.userId).catch(() => null);
                                if (guildMember && guildMember.manageable) {
                                    await guildMember.setNickname(`Worshipper#${wUser.currentRank}`);
                                }
                            }

                            // Demote the person
                            await member.setNickname('Peasant'); // set the nickname
                            user.currentRank = 0;
                            user.currentStatus = 'Peasant';
                            await user.save();

                        }

                        await message.channel.send(`**${message.author.username}** has been DEMOTED!\n`);

                    } catch (err) {
                        console.error(err);
                        await message.channel.send(`Can't change **${message.author.username}**'s nickname.`);
                    }
                    
                    // Reset sin points to 0
                    user.sinPoints = 0;
                    await user.save();
                    await user.reload();

                }

            } catch (err) {
                console.error(err);
                await message.channel.send(
                `Can't timeout **${message.author.username}**, (admins).`,
                );
            }
        }
    },
};

