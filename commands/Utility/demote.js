const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Users } = require('../../database/sequelize');
const { demoteUser } = require('../../services/rankServices');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('demote')
		.setDescription('Manual demotion: straight to Peasant')
		.addUserOption(opt => // adds a required user picker to the /demote command
			opt.setName('user')
				.setDescription('User to demote')
				.setRequired(true),
			)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // only admins
	

	async execute(interaction) { // demote immediately straight to peasant
		
		const target = interaction.options.getUser('user');
		const guild = interaction.guild;
		
		// Fetch DB record
		const user = await Users.findOne({
			where: { 
				userId: target.id,
				guildId: guild.id,
			},
		});
		if (!user) return interaction.reply('No DB record for that user.');

		// Fetch guild member
		const member = await guild.members.fetch(user.userId).catch(() => null);
		if (!member) throw new Error("Member not found in this guild.");
		if (!member.manageable) throw new Error("I cannot change this user's nickname."); // Check if this member can be managed by the bot

		if (member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("Can't demote an admin."); // check if this member is admin


		const msg = await demoteUser(user, target, member, guild);
		return interaction.reply(msg);

	},
};