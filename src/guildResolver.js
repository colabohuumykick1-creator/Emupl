export async function resolveGuild(client, configuredGuildId, warn = console.warn) {
  const cachedGuilds = [...client.guilds.cache.values()];

  if (configuredGuildId) {
    try {
      return await client.guilds.fetch(configuredGuildId);
    } catch (error) {
      if (cachedGuilds.length !== 1) {
        throw error;
      }

      const fallbackGuild = cachedGuilds[0];
      warn(
        `Nie znaleziono serwera GUILD_ID=${configuredGuildId}. ` +
          `Używam jedynego dostępnego serwera ${fallbackGuild.name} (${fallbackGuild.id}).`,
      );
      return fallbackGuild;
    }
  }

  if (cachedGuilds.length === 1) {
    const fallbackGuild = cachedGuilds[0];
    warn(
      `Brak GUILD_ID. Używam jedynego dostępnego serwera ` +
        `${fallbackGuild.name} (${fallbackGuild.id}).`,
    );
    return fallbackGuild;
  }

  throw new Error(
    'Nie można automatycznie wybrać serwera. Ustaw prawidłowe GUILD_ID.',
  );
}
