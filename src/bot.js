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
import { resolveGuild } from './guildResolver.js';
import { startHealthServer } from './healthServer.js';
import {
  assignUnverifiedRole,
  setupGuild,
  toggleSelfRole,
  verifyMember,
} from './setupGuild.js';

const token = process.env.DISCORD_TOKEN?.trim();
const configuredGuildId = process.env.GUILD_ID?.trim();
const guildId =
  configuredGuildId && configuredGuildId !== 'wklej_tutaj_id_serwera'
    ? configuredGuildId
    : null;

if (!token || token === 'wklej_tutaj_token_bota') {
  console.error('Brak DISCORD_TOKEN. Skopiuj .env.example do .env i uzupełnij token.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});
const healthServer = startHealthServer(client);
let setupRunning = false;
let activeGuildId = null;

async function runSetup(guild, progress = () => {}) {
  if (setupRunning) {
    throw new Error(
      'Konfiguracja jest już uruchomiona. / Setup is already running; wait for it to finish.',
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
  try {
    const guild = await resolveGuild(readyClient, guildId);
    activeGuildId = guild.id;
    await guild.commands.set(commandData);
    readyClient.user.setActivity('PL EMULATOR CENTER • GameLoop • PL/EN', {
      type: ActivityType.Watching,
    });

    console.log(`Zalogowano jako ${readyClient.user.tag}.`);
    console.log(`Komendy zarejestrowano na serwerze ${guild.name}.`);
    console.log('Wpisz /setup na serwerze, aby ręcznie zaktualizować konfigurację.');
  } catch (error) {
    console.error('Błąd podczas startu bota:', error);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (!activeGuildId || member.guild.id !== activeGuildId) return;

  try {
    await assignUnverifiedRole(member);
  } catch (error) {
    console.error(`Nie udało się nadać roli Unverified użytkownikowi ${member.user.tag}:`, error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('emuplcoom-verify:')) {
      await verifyMember(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('emuplcoom-role:')) {
      await toggleSelfRole(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.guildId !== guildId) {
      await interaction.reply({
        content:
          'Ten bot jest skonfigurowany dla innego serwera. / This bot is configured for a different server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.commandName === 'setup') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content:
            'Tej komendy może użyć tylko administrator. / Only an administrator can use this command.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const report = await runSetup(interaction.guild, (message) => console.log(message));
      const warningText = report.warnings.length
        ? `\n\n**Ostrzeżenia / Warnings:**\n${report.warnings.map((item) => `• ${item}`).join('\n')}`
        : '';

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND.color)
            .setTitle('Serwer gotowy / EMUPLCOOM server ready ✅')
            .setDescription(
              `Utworzono / Created: **${report.created.length}**\nZaktualizowano / Updated: **${report.updated.length}**${warningText}`,
            )
            .setFooter({ text: BRAND.footer })
            .setTimestamp(),
        ],
      });
      return;
    }

    if (interaction.commandName === 'emuplcoom') {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND.accentColor)
            .setTitle('EMUPLCOOM 👾')
            .setDescription(
              '🇵🇱 Bot zarządza konfiguracją serwera, panelem ról i wiadomościami EMUPLCOOM.\n' +
                '🇬🇧 The bot manages the EMUPLCOOM server configuration, role panel and server messages.',
            )
            .addFields(
              { name: 'Status', value: 'Online', inline: true },
              { name: 'Wersja / Version', value: '1.0.0', inline: true },
            )
            .setFooter({ text: BRAND.footer }),
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
    const message = `Nie udało się wykonać operacji / Operation failed: ${error.message}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: message, embeds: [], components: [] }).catch(() => {});
    } else {
      await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

client.on(Events.Error, (error) => console.error('Błąd klienta Discord:', error));
process.on('unhandledRejection', (error) => console.error('Nieobsłużony błąd:', error));

async function shutdown(signal) {
  console.log(`Odebrano ${signal}. Wyłączam bota…`);
  client.destroy();
  await new Promise((resolve) => healthServer.close(resolve));
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

client.login(token);
