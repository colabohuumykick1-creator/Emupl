import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commandData } from './commands.js';

const token = process.env.DISCORD_TOKEN?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token || token === 'wklej_tutaj_token_bota') {
  console.error('Brak prawidłowego DISCORD_TOKEN w pliku .env.');
  process.exit(1);
}

if (!guildId || !/^\d{17,20}$/.test(guildId)) {
  console.error('Brak prawidłowego GUILD_ID w pliku .env.');
  process.exit(1);
}

try {
  const rest = new REST({ version: '10' }).setToken(token);
  const application = await rest.get(Routes.oauth2CurrentApplication());
  const registered = await rest.put(
    Routes.applicationGuildCommands(application.id, guildId),
    { body: commandData },
  );

  console.log(
    `Zarejestrowano komendy na serwerze ${guildId}: ${registered
      .map((command) => `/${command.name}`)
      .join(', ')}`,
  );
} catch (error) {
  console.error('Nie udało się zarejestrować komend:', error);
  process.exit(1);
}
