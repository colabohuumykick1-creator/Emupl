import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { BRAND } from './config.js';

export function isValidImageUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function sendEmbedCommand(interaction) {
  const channel = interaction.options.getChannel('kanal', true);
  const title = interaction.options.getString('tytul', true);
  const description = interaction.options.getString('tresc', true);
  const color = interaction.options.getString('kolor') ?? '21D4FD';
  const imageUrl = interaction.options.getString('obraz');
  const thumbnailUrl = interaction.options.getString('miniatura');
  const footerText = interaction.options.getString('stopka') ?? BRAND.footer;

  if (!isValidImageUrl(imageUrl) || !isValidImageUrl(thumbnailUrl)) {
    await interaction.reply({
      content:
        'Nieprawidłowy adres obrazu lub miniatury. Użyj pełnego `https://…`. / Invalid image or thumbnail URL. Use a complete `https://…` address.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const botPermissions = channel.permissionsFor(interaction.guild.members.me);
  const requiredPermissions = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
  ];

  if (!botPermissions?.has(requiredPermissions)) {
    await interaction.reply({
      content: `Nie mam uprawnień do wyświetlania kanału, wysyłania wiadomości i embedów na ${channel}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const botAvatar = interaction.client.user.displayAvatarURL({ size: 128 });
  const serverIcon = interaction.guild.iconURL({ size: 128 }) ?? botAvatar;
  const embed = new EmbedBuilder()
    .setColor(Number.parseInt(color, 16))
    .setAuthor({ name: BRAND.name, iconURL: serverIcon })
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: footerText, iconURL: botAvatar })
    .setTimestamp();

  if (imageUrl) embed.setImage(imageUrl);
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  const message = await channel.send({
    embeds: [embed],
    allowedMentions: { parse: [] },
  });

  await interaction.reply({
    content: `Embed został wysłany na ${channel}. [Zobacz wiadomość](${message.url})`,
    flags: MessageFlags.Ephemeral,
  });
}
