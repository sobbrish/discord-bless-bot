const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Users } = require('../../database/sequelize');
const { Op } = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('demote')
		.setDescription('Manual demotion: straight to Peasant')
		.addUserOption(opt => // adds a required user picker to the /demote command
			opt.setName('user')
				.setDescription('User to demote')
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // only admins
	

	async execute(interaction) { // demote immediately straight to peasant
		
		const target = interaction.options.getUser('user');
		const guild = interaction.guild;
		
		// Fetch DB record
		const user = await Users.findOne({ where: { userId: target.id } });
		if (!user) return interaction.reply('No DB record for that user.');

		// Fetch guild member
		const member = await guild.members.fetch(user.userId).catch(() => null);
		if (!member) throw new Error("Member not found in this guild.");
		if (!member.manageable) throw new Error("I cannot change this user's nickname."); // Check if this member can be managed by the bot


		try {
			await member.timeout(60 * 1000).catch(() => null); // /demote on a peasant will still timeout but do nothing

			if (user.currentStatus == 'Worshipper') { // when a Worshipper is getting demoted (doesn't matter for a Peasant to get Demoted)
				
				// rank shift
				const worshippersBelow = await Users.findAll({
					where: {
						currentStatus: 'Worshipper',
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
			}
			// Demote the person
			await member.setNickname('Peasant').catch(() => null);; // set the nickname
			user.currentRank = 0;
			user.currentStatus = 'Peasant';
			await user.save();

			return interaction.reply(
                `DEMOTION. ${target.username}, muted for 1 min. \n` +
            	`:rage: Straight to PEASANT :index_pointing_at_the_viewer: :joy:`,
            );

		} catch (err) {
			console.error(err);
			return interaction.reply("Couldn't demote that user.");
		}


	},
};