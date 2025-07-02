import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import LOGGER from "../config/logger.js";

// This file will be used to register and update the slash commands for the bot application.
// Slash commands only need to be registered once, and updated when the definition (description, options etc) is changed.
// As there is a daily limit on command creations, it's not necessary nor desirable to connect a whole client to the gateway or do this on every ready event. 
// As such, a standalone script using the lighter REST manager is preferred.

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const filename = fileURLToPath(import.meta.url);
const foldersPath = path.dirname(filename);
const commandFolders = fs.readdirSync(foldersPath).filter(name => {
	const fullPath = path.join(foldersPath, name);
	return fs.statSync(fullPath).isDirectory();
});

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const commandContent = await import(pathToFileURL(filePath).href);
		const command = commandContent.default
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			LOGGER.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN!);

// and deploy your commands!
(async () => {
	try {
		LOGGER.info(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands
		const data: any = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
			//Routes.applicationCommands(process.env.CLIENT_ID!), Use this line to register commands globally when deploying, but be aware it can take up to an hour to propagate.
			{ body: commands },
		);

		LOGGER.info(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		LOGGER.error(error);
	}
})();