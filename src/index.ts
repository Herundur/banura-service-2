import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Collection, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { CommandClient } from './types/client.js';
import LOGGER from "./config/logger.js";

const client = new CommandClient({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const filename = fileURLToPath(import.meta.url);
const foldersPath = path.join(path.dirname(filename), "commands");
const commandFolders = fs.readdirSync(foldersPath).filter(name => {
    const fullPath = path.join(foldersPath, name);
    return fs.statSync(fullPath).isDirectory();
});

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file =>  file.endsWith('.ts') || file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
        const commandContent = await import(pathToFileURL(filePath).href);
        const command = commandContent.default;
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			LOGGER.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const interactionClient = interaction.client as CommandClient;
    const command = interactionClient.commands.get(interaction.commandName);

	if (!command) {
		LOGGER.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		LOGGER.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Ein Fehler ist während dem Ausführen des Commands aufgetreten!', flags: MessageFlags.Ephemeral }); // Only visible to the user.
		} else {
			await interaction.reply({ content: 'Ein Fehler ist während dem Ausführen des Commands aufgetreten!', flags: MessageFlags.Ephemeral }); // Only visible to the user.
		}
	}
});

client.on('ready', (c: any) => {
    LOGGER.info(`${c.user.username} is online.`);
})

client.login(process.env.TOKEN);