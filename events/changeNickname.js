const { Events, PermissionsBitField } = require('discord.js');
const { Users } = require('../database/sequelize');

const config = require('../config.json');


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

        // const messageContent = message.content.toLowerCase();

        // If author is admin, just ignore
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        if (user.praisePoints >= 3) {
            user.praisePoints = 0;
            await user.reload();
            try {
                user.setNickname('new-nickname');
                await user.reload();
            } catch (err) {
                console.error(err);
                await message.channel.send(`Can't change ${message.author}'s nickname.`);
            }
            message.channel.send(
                `${message.author} has been PROMOTED!\n` +
                `Total Praise: ${user.praisePoints} | Total Sins: ${user.sinPoints}`,
            );
        }
    },
};

// if (command === 'nick') {
//     if (!message.member.permission.has("MANAGE_NICKNAMES")) return message.channel.send("no permissions to change nicknames");
//     if (!message.mentions.users.first()) return message.channel.send("pls specify username");

//     const user = message.mentions.member.first()
//     const name = args.slice(1).join(" ") || 'no nickname provided'

//     if (!user.kickable) return message.channel.send("I cant change this persons nickname");

//     const embed = new MessageEmbed().setColor("BLUE").setDescription(`:white_check_mark:	Changed ${user.user.tag}'s nickname to **${name}**`);

//     user.setNickname(name).catch(err => {console.log("There was an error with this nickname command.")});

//     message.channel.send({ embeds: [embed] });

// }
