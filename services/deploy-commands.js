const { REST, Routes } = require('discord.js');
const { clientId, token } = require('../config.json');
const fs = require('node:fs');
const path = require('path');

const rest = new REST().setToken(token);

// Load all commands dynamically
async function getCommandsJSON() {
    const commands = [];
    const foldersPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if (command.data && command.execute) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] Missing "data" or "execute" in ${file}`);
            }
        }
    }

    return commands;
}

// Deploy commands to a single guild
async function deployCommandsToGuild(guildId) {
    const commands = await getCommandsJSON();
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Deployed ${commands.length} commands to guild ${guildId}`);
}

// Deploy commands to multiple guilds
async function deployCommandsToGuilds(guildIds) {
    for (const guildId of guildIds) {
        try {
            await deployCommandsToGuild(guildId);
        } catch (err) {
            console.error(`Failed to deploy commands to guild ${guildId}:`, err);
        }
    }
}

module.exports = {
    deployCommandsToGuild,
    deployCommandsToGuilds,
};
