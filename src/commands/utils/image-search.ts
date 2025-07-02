import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
						.setName('img')
						.setDescription('Sucht nach Bildern auf Google.'),
	async execute(interaction: any) {
		await interaction.reply('This command is currently under development. Please check back later!');
	},
};