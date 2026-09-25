import 'dotenv/config';

import {
  ActivityType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';

import { BRAND } from './config.js';
import { commandData } from './commands.js';
import { sendEmbedCommand } from './embedCommand.js';
import { startHealthServer } from './healthServer.js';
import { setupGuild, toggleSelfRole } from './setupGuild.js';

const token = process.env.DISCORD_TOKEN?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token) {
  console.error('Brak zmiennej DISCORD_TOKEN.');
  process.exit(1);
}

if (!guildId) {
  console.error('Brak zmiennej GUILD_ID.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const healthServer = startHealthServer(client);

let setupRunning = false;

async function runSetup(guild, progress = () => {}) {
  if (setupRunning) {
    throw new Error(
      'Konfiguracja jest już uruchomiona. Poczekaj na jej zakończenie.',
    );
  }

  setupRunning = true;

  try {
    return await setupGuild(guild, progress);
  } finally {
    setupRunning = false;
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log('======================================');
  console.log(`Discord: zalogowano jako ${readyClient.user.tag}`);
  console.log(`Bot ID: ${readyClient.user.id}`);
  console.log('======================================');

  readyClient.user.setPresence({
    activities: [
      {
        name: 'PUBG Mobile • GameLoop • PL',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });

  try {
    const guild = await readyClient.guilds.fetch(guildId);

    console.log(`Połączono z serwerem: ${guild.name} (${guild.id})`);

    await guild.commands.set(commandData);

    console.log('Komendy slash zostały zarejestrowane.');
    console.log('Bot PubgPLEMULATOR jest gotowy.');
  } catch (error) {
    console.error(
      'Bot zalogował się do Discorda, ale wystąpił problem z serwerem lub komendami:',
      error,
    );
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (
      interaction.isButton() &&
      interaction.customId.startsWith('emuplcoom-role:')
    ) {
      await toggleSelfRole(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (interaction.guildId !== guildId) {
      await interaction.reply({
        content:
          'Ten bot jest skonfigurowany dla innego serwera.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (interaction.commandName === 'setup') {
      if (
        !interaction.memberPermissions?.has(
          PermissionFlagsBits.Administrator,
        )
      ) {
        await interaction.reply({
          content:
            'Tej komendy może użyć tylko administrator.',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      });

      const report = await runSetup(
        interaction.guild,
        (message) => console.log(message),
      );

      const warningText = report.warnings.length
        ? `\n\n**Ostrzeżenia:**\n${report.warnings
            .map((item) => `• ${item}`)
            .join('\n')}`
        : '';

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND.color)
            .setTitle(
              'PubgPLEMULATOR • konfiguracja zakończona ✅',
            )
            .setDescription(
              `Utworzono: **${report.created.length}**\n` +
                `Zaktualizowano: **${report.updated.length}**` +
                warningText,
            )
            .setFooter({
              text: BRAND.footer,
            })
            .setTimestamp(),
        ],
      });

      return;
    }

    if (
      interaction.commandName === 'emuplcoom' ||
      interaction.commandName === 'pubgplemulator'
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND.accentColor)
            .setTitle('PubgPLEMULATOR 🎮')
            .setDescription(
              'Bot społeczności **PUBG Mobile PL Emulator Center**.\n\n' +
                'Obsługuje konfigurację serwera, role, wiadomości i narzędzia administracyjne.',
            )
            .addFields(
              {
                name: 'Status',
                value: '🟢 Online',
                inline: true,
              },
              {
                name: 'Wersja',
                value: '1.0.0',
                inline: true,
              },
            )
            .setFooter({
              text: BRAND.footer,
            }),
        ],
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (interaction.commandName === 'embed') {
      await sendEmbedCommand(interaction);
    }
  } catch (error) {
    console.error('Błąd interakcji:', error);

    const message =
      `Nie udało się wykonać operacji: ${error.message}`;

    if (
      interaction.deferred ||
      interaction.replied
    ) {
      await interaction
        .editReply({
          content: message,
          embeds: [],
          components: [],
        })
        .catch(() => {});
    } else {
      await interaction
        .reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  }
});

client.on(Events.Error, (error) => {
  console.error(
    'Błąd klienta Discord:',
    error,
  );
});

client.on(Events.Warn, (warning) => {
  console.warn(
    'Ostrzeżenie Discord:',
    warning,
  );
});

client.on(Events.ShardDisconnect, (event, shardId) => {
  console.warn(
    `Discord rozłączył shard ${shardId}. Kod: ${event.code}`,
  );
});

process.on('unhandledRejection', (error) => {
  console.error(
    'Nieobsłużony Promise rejection:',
    error,
  );
});

process.on('uncaughtException', (error) => {
  console.error(
    'Nieobsłużony wyjątek:',
    error,
  );
});

async function shutdown(signal) {
  console.log(
    `Odebrano ${signal}. Wyłączam PubgPLEMULATOR...`,
  );

  client.destroy();

  await new Promise((resolve) => {
    healthServer.close(resolve);
  });

  process.exit(0);
}

process.once('SIGINT', () =>
  shutdown('SIGINT'),
);

process.once('SIGTERM', () =>
  shutdown('SIGTERM'),
);

async function startBot() {
  try {
    console.log(
      'Łączenie PubgPLEMULATOR z Discordem...',
    );

    await client.login(token);
  } catch (error) {
    console.error(
      'NIE UDAŁO SIĘ ZALOGOWAĆ DO DISCORDA:',
      error,
    );

    healthServer.close(() => {
      process.exit(1);
    });
  }
}

startBot();