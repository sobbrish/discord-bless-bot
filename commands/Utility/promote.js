const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Users } = require('../../database/sequelize');
const { promoteUser } = require('../../services/rankServices');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('promote')
		.setDescription('Promotes the user specified')
		.addUserOption((option) => option.setName('target').setDescription('The user to promote').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		
	async execute(interaction) {
		const target = interaction.options.getMember('target');
		if (!target) return interaction.reply("Could not find that member.");
		
		const [user] = await Users.findOrCreate({
            where: { 
				userId: target.id,
				guildId: interaction.guild.id,
			},
            defaults: {
                currentStatus: 'Peasant',
                currentRank: 0,
            },
        });

		await promoteUser(user, target, interaction.guild);

		await interaction.reply(`Congratulations on getting your promotion ✨**${target.user.username}**!✨ Make your lord proud!!!`);
	},
};