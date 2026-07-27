import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildExplicitContentFilter,
  GuildFeature,
  GuildOnboardingMode,
  GuildOnboardingPromptType,
  GuildVerificationLevel,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import {
  BRAND,
  ROLE_KEYS,
  categories,
  channels,
  roles,
  selfAssignableRoles,
  staffRoleKeys,
} from './config.js';

const SETUP_REASON = 'Automatyczna konfiguracja serwera EMUPLCOOM';
const GAMELOOP_32_BIT_URL =
  'https://down.gameloop.com/channel/3/16412/GLP_installer_1000218456_market.exe';
const GAMELOOP_64_BIT_URL =
  'https://down.gameloop.com/channel/3/26460/GLP_installer_900223150_market.exe';
const GLX_TEAM_IMAGE_URL =
  'https://raw.githubusercontent.com/bastian1v2v1-ctrl/EMUPLCOOM/main/assets/glx-extream-team-huumy.png';
const VERIFIED_PUBLIC_CATEGORY_KEYS = ['START', 'COMMUNITY', 'EMULATORS', 'SUPPORT', 'VOICE'];
const VERIFIED_ACCESS_EXCLUDED_CHANNEL_KEYS = ['VERIFICATION', 'CHAT_PL', 'CHAT_GB'];
const VERIFIED_ACCESS_EXCLUDED_CHANNEL_NAMES = new Set(['weryfikacja', 'chat-pl', 'chat-gb']);
const BOT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
];

function allowText() {
  return [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.SendMessagesInThreads,
  ];
}

function allowVoice() {
  return [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.UseVAD,
  ];
}

function buildOverwrites(guild, roleMap, mode) {
  const everyone = guild.roles.everyone.id;
  const botId = guild.members.me.id;
  const staffIds = staffRoleKeys.map((key) => roleMap.get(key).id);
  const memberId = roleMap.get(ROLE_KEYS.MEMBER).id;
  const polishId = roleMap.get(ROLE_KEYS.POLISH).id;
  const englishId = roleMap.get(ROLE_KEYS.ENGLISH).id;
  const botOverwrite = { id: botId, allow: BOT_PERMISSIONS };

  switch (mode) {
    case 'VERIFICATION':
      return [
        {
          id: everyone,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
        },
        { id: memberId, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'PUBLIC_READ':
      return [
        {
          id: everyone,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
        },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'STAFF_WRITE_PUBLIC_READ':
      return [
        {
          id: everyone,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
        },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'MEMBER':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: memberId, allow: allowText() },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'MEMBER_READ':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: memberId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
        },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'LANGUAGE_POLISH':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: polishId, allow: allowText() },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'LANGUAGE_ENGLISH':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: englishId, allow: allowText() },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'MEMBER_VOICE':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
        { id: memberId, allow: allowVoice() },
        ...staffIds.map((id) => ({ id, allow: allowVoice() })),
        botOverwrite,
      ];
    case 'STAFF':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel] },
        ...staffIds.map((id) => ({ id, allow: allowText() })),
        botOverwrite,
      ];
    case 'STAFF_VOICE':
      return [
        { id: everyone, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
        ...staffIds.map((id) => ({ id, allow: allowVoice() })),
        botOverwrite,
      ];
    default:
      throw new Error(`Nieznany tryb uprawnień / Unknown permission mode: ${mode}`);
  }
}

async function ensureRole(guild, spec, report) {
  let role = guild.roles.cache.find((item) => item.name === spec.name && !item.managed);
  role ??= guild.roles.cache.find(
    (item) => (spec.legacyNames ?? []).includes(item.name) && !item.managed,
  );
  const data = {
    name: spec.name,
    colors: { primaryColor: spec.color },
    hoist: spec.hoist,
    mentionable: false,
    permissions: spec.permissions,
  };

  if (!role) {
    role = await guild.roles.create({ ...data, reason: SETUP_REASON });
    report.created.push(`rola ${spec.name}`);
    return role;
  }

  if (!role.editable) {
    report.warnings.push(
      `Nie można zaktualizować roli ${spec.name}; przenieś rolę bota wyżej. / Cannot update ${spec.name}; move the bot role higher.`,
    );
    return role;
  }

  await role.edit({ ...data, reason: SETUP_REASON });
  report.updated.push(`rola ${spec.name}`);
  return role;
}

export async function ensureCategory(guild, spec, roleMap, report) {
  const sameName = guild.channels.cache.find((channel) => channel.name === spec.name);
  if (sameName && sameName.type !== ChannelType.GuildCategory) {
    report.warnings.push(
      `Pominięto „${spec.name}”: element nie jest kategorią. / Skipped “${spec.name}”: the existing item is not a category.`,
    );
    return null;
  }

  if (!sameName) {
    report.warnings.push(
      `Pominięto brakującą kategorię „${spec.name}”. / Skipped missing category “${spec.name}”.`,
    );
    return null;
  }

  const data = {
    name: spec.name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: buildOverwrites(guild, roleMap, spec.permissionMode),
    reason: SETUP_REASON,
  };

  await sameName.edit({
    permissionOverwrites: data.permissionOverwrites,
    reason: SETUP_REASON,
  });
  report.updated.push(`kategoria ${spec.name}`);
  return sameName;
}

export async function ensureChannel(guild, spec, category, categorySpec, roleMap, report) {
  const acceptedTypes = new Set([spec.type, ...(spec.acceptedTypes ?? [])]);
  const candidates = guild.channels.cache.filter((channel) => channel.name === spec.name);
  const categoryId = category?.id;
  const sameName =
    candidates.find(
      (channel) =>
        acceptedTypes.has(channel.type) && (!categoryId || channel.parentId === categoryId),
    ) ?? candidates.find((channel) => acceptedTypes.has(channel.type));

  if (!sameName && candidates.size > 0) {
    report.warnings.push(
      `Pominięto „${spec.name}”: niezgodny typ kanału. / Skipped “${spec.name}”: incompatible channel type.`,
    );
    return null;
  }

  if (!sameName && !spec.createIfMissing) {
    report.warnings.push(
      `Pominięto brakujący kanał #${spec.name}. / Skipped missing channel #${spec.name}.`,
    );
    return null;
  }

  if (!sameName && !category) {
    report.warnings.push(
      `Nie można utworzyć #${spec.name}: brakuje kategorii nadrzędnej. / Cannot create #${spec.name}: its parent category is missing.`,
    );
    return null;
  }

  const permissionMode = spec.permissionMode ?? categorySpec.permissionMode;
  const managedOverwrites = buildOverwrites(guild, roleMap, permissionMode);
  const managedIds = new Set(managedOverwrites.map((overwrite) => overwrite.id));
  const preservedOverwrites =
    spec.preserveOverwrites && sameName
      ? [...sameName.permissionOverwrites.cache.values()]
          .filter((overwrite) => !managedIds.has(overwrite.id))
          .map((overwrite) => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.bitfield,
            deny: overwrite.deny.bitfield,
          }))
      : [];
  const common = {
    name: spec.name,
    permissionOverwrites: [...managedOverwrites, ...preservedOverwrites],
    reason: SETUP_REASON,
  };
  const typeSpecific =
    spec.type === ChannelType.GuildText
      ? {
          topic: spec.topic ?? null,
          rateLimitPerUser: spec.slowmode ?? 0,
        }
      : {
          userLimit: spec.userLimit ?? 0,
        };

  if (!sameName) {
    const channel = await guild.channels.create({
      ...common,
      ...typeSpecific,
      parent: category.id,
      type: spec.type,
    });
    report.created.push(`kanał ${spec.name}`);
    return channel;
  }

  await sameName.edit({ ...common, ...typeSpecific });
  report.updated.push(`kanał ${spec.name}`);
  return sameName;
}

export async function unlockVerifiedChannels(
  guild,
  categoryMap,
  channelMap,
  roleMap,
  report,
) {
  const verifiedRole = roleMap.get(ROLE_KEYS.MEMBER);
  const publicCategoryIds = new Set(
    VERIFIED_PUBLIC_CATEGORY_KEYS.map((key) => categoryMap.get(key)?.id).filter(Boolean),
  );
  const excludedChannelIds = new Set(
    VERIFIED_ACCESS_EXCLUDED_CHANNEL_KEYS.map((key) => channelMap.get(key)?.id).filter(Boolean),
  );
  const voiceTypes = new Set([ChannelType.GuildVoice, ChannelType.GuildStageVoice]);

  for (const channel of guild.channels.cache.values()) {
    if (
      !publicCategoryIds.has(channel.parentId) ||
      excludedChannelIds.has(channel.id) ||
      VERIFIED_ACCESS_EXCLUDED_CHANNEL_NAMES.has(channel.name) ||
      typeof channel.permissionsFor !== 'function' ||
      typeof channel.permissionOverwrites?.edit !== 'function'
    ) {
      continue;
    }

    const currentPermissions = channel.permissionsFor(verifiedRole);
    const needsViewChannel = !currentPermissions?.has(PermissionFlagsBits.ViewChannel);
    const needsConnect =
      voiceTypes.has(channel.type) && !currentPermissions?.has(PermissionFlagsBits.Connect);

    if (!needsViewChannel && !needsConnect) {
      continue;
    }

    await channel.permissionOverwrites.edit(
      verifiedRole,
      {
        ...(needsViewChannel ? { ViewChannel: true } : {}),
        ...(needsConnect ? { Connect: true } : {}),
      },
      { reason: SETUP_REASON },
    );
    report.updated.push(`dostęp Zweryfikowany: #${channel.name}`);
  }
}

function markerEmbed(marker, builder) {
  return builder.setFooter({ text: `${BRAND.footer} • ${marker}` });
}

function rolePanelComponents() {
  const buttons = selfAssignableRoles.map((role) =>
    new ButtonBuilder()
      .setCustomId(`emuplcoom-role:${role.key}`)
      .setLabel(role.buttonLabel)
      .setEmoji(role.buttonEmoji)
      .setStyle(ButtonStyle.Primary),
  );

  const rows = [];
  for (let index = 0; index < buttons.length; index += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(index, index + 5)));
  }
  return rows;
}

export function starterMessages(roleMap) {
  const memberRole = roleMap.get(ROLE_KEYS.MEMBER);
  const polishRole = roleMap.get(ROLE_KEYS.POLISH);
  const englishRole = roleMap.get(ROLE_KEYS.ENGLISH);
  const newsRole = roleMap.get(ROLE_KEYS.NEWS);
  const eventsRole = roleMap.get(ROLE_KEYS.EVENTS);

  return [
    {
      channelKey: 'WELCOME',
      marker: 'setup:welcome:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:welcome:v1',
          new EmbedBuilder()
            .setColor(BRAND.color)
            .setTitle('Witaj w EMUPLCOOM / Welcome to EMUPLCOOM! 🎮')
            .setDescription(
              '🇵🇱 **Wersja polska**\n' +
                'Ten serwer jest przeznaczony dla osób grających za pomocą emulatora **GameLoop**. Znajdziesz tutaj graczy, pomoc techniczną, sprawdzone ustawienia i porady dotyczące optymalizacji.\n\n' +
                '1. Przeczytaj **#regulamin** i przestrzegaj zasad.\n' +
                '2. Wybierz język oraz zainteresowania na **#wybierz-role**.\n' +
                '3. Przedstaw się na **#przedstaw-sie**.\n' +
                '4. Potrzebujesz pomocy? Opisz problem na **#pomoc-emulatory**.\n\n' +
                '🇬🇧 **English version**\n' +
                'This server is for players using the **GameLoop** emulator. Here you will find other players, technical support, tested settings and performance tips.\n\n' +
                '1. Read **#regulamin** and follow the rules.\n' +
                '2. Choose your language and interests in **#wybierz-role**.\n' +
                '3. Introduce yourself in **#przedstaw-sie**.\n' +
                '4. Need help? Describe your issue in **#pomoc-emulatory**.\n\n' +
                'Play fair, respect others and help the EMUPLCOOM community grow!',
            ),
        ),
      ],
    },
    {
      channelKey: 'GAMELOOP_INFO',
      marker: 'setup:gameloop-info:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:gameloop-info:v1',
          new EmbedBuilder()
            .setColor(BRAND.color)
            .setTitle('GameLoop — kompletny przewodnik / Complete guide 🎮')
            .setDescription(
              'Najważniejsze informacje dla graczy EMUPLCOOM. / Essential information for EMUPLCOOM players.',
            )
            .addFields(
              {
                name: 'Czym jest GameLoop? / What is GameLoop?',
                value:
                  '🇵🇱 GameLoop to emulator Androida na Windows, wywodzący się z Tencent Gaming Buddy. Umożliwia uruchamianie obsługiwanych gier mobilnych na komputerze przy użyciu klawiatury i myszy. Korzysta m.in. z silnika AOW, mapowania sterowania i mechanizmów bezpieczeństwa.\n\n' +
                  '🇬🇧 GameLoop is an Android emulator for Windows that evolved from Tencent Gaming Buddy. It runs supported mobile games on PC with keyboard and mouse controls. It includes the AOW engine, control mapping and security features.',
              },
              {
                name: 'Czy GameLoop jest legalny? / Is GameLoop legal?',
                value:
                  '🇵🇱 Sam oficjalny emulator jest legalnym oprogramowaniem. Pobieraj go wyłącznie z `gameloop.com`. Legalność użycia konkretnej gry oraz zasady konta zależą również od regulaminu jej wydawcy i prawa obowiązującego w Twoim kraju.\n\n' +
                  '🇬🇧 The official emulator itself is legitimate software. Download it only from `gameloop.com`. Use of a particular game and account rules also depend on the publisher’s terms and the laws in your country.',
              },
              {
                name: 'Bezpieczeństwo i fair play / Safety and fair play',
                value:
                  '🇵🇱 Nie instaluj przerobionych wersji, cracków, cheatów, „unlockerów”, podejrzanych dodatków ani plików z losowych poradników. Nie wyłączaj zabezpieczeń gry i nie omijaj wykrywania emulatora. Żaden emulator nie daje bezwarunkowej gwarancji braku blokady konta — zawsze sprawdzaj zasady danej gry.\n\n' +
                  '🇬🇧 Never install modified builds, cracks, cheats, “unlockers”, suspicious add-ons or files from random guides. Do not bypass game security or emulator detection. No emulator can unconditionally guarantee account safety—always check the game’s rules.',
              },
              {
                name: 'Wydajność i skalowanie / Performance and scaling',
                value:
                  '🇵🇱 Aktualizuj Windows i sterownik GPU, włącz wirtualizację, jeśli wymaga jej używana wersja, ustaw rozsądną rozdzielczość/DPI i przydział CPU/RAM. Wyższa rozdzielczość lub FPS zwiększa obciążenie. Przed zmianami zapisz obecne ustawienia.\n\n' +
                  '🇬🇧 Keep Windows and GPU drivers updated, enable virtualization when required by your build, and choose sensible resolution/DPI and CPU/RAM allocation. Higher resolution or FPS increases load. Save your current settings before changing them.',
              },
              {
                name: 'Oficjalne linki / Official links',
                value:
                  '🌐 [Strona główna / Website](https://www.gameloop.com/en) • [Pobieranie / Download](https://www.gameloop.com/product/gameloop-download)\n' +
                  `🪟 [GameLoop 32-bit](${GAMELOOP_32_BIT_URL}) • [GameLoop 64-bit](${GAMELOOP_64_BIT_URL})\n` +
                  '🎮 [Katalog gier / Games](https://www.gameloop.com/game) • [Pomoc techniczna / Support](https://www.gameloop.com/en/support)\n' +
                  '📄 [Regulamin usługi / Terms](https://www.gameloop.com/terms-of-services) • [Prywatność / Privacy](https://www.gameloop.com/privacy-policy)\n' +
                  '📘 [Facebook](https://www.facebook.com/GameLoopOfficial/) • [X](https://x.com/gameloop_game) • [Instagram](https://www.instagram.com/gameloop.official/) • [YouTube](https://www.youtube.com/channel/UC1Ltwjxfd-1ldFRpaGnFtqQ)',
              },
              {
                name: 'Discord GameLoop',
                value:
                  '🇵🇱 Zaproszenie publikowane obecnie przez oficjalną stronę GameLoop jest nieaktywne. Do czasu udostępnienia nowego linku korzystaj z oficjalnego centrum pomocy i nie ufaj przypadkowym zaproszeniom.\n\n' +
                  '🇬🇧 The invite currently published by the official GameLoop website is inactive. Until a new official link is available, use the official Support Center and avoid unverified invites.',
              },
            ),
        ),
      ],
    },
    {
      channelKey: 'RULES',
      marker: 'setup:rules:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:rules:v1',
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('REGULAMIN / SERVER RULES — EMUPLCOOM ⚠️')
            .setDescription(
              [
                '**§1. SZACUNEK ALBO WYJŚCIE / RESPECT OR LEAVE**\n🇵🇱 Zakazane są wyzwiska, nękanie, groźby, dyskryminacja, prowokacje i toksyczne zachowanie.\n\n🇬🇧 Insults, harassment, threats, discrimination, provocation and toxic behaviour are forbidden.',
                '**§2. ZERO SPAMU / ZERO SPAM**\n🇵🇱 Bez floodu, kopiowania wiadomości, nadmiernych CAPSÓW, bezsensownych pingów oraz nadużywania `@everyone` i `@here`.\n\n🇬🇧 No flooding, repeated messages, excessive CAPS, pointless pings or abuse of `@everyone` and `@here`.',
                '**§3. ZAKAZ REKLAMY / NO ADVERTISING**\n🇵🇱 Reklamy, linki partnerskie, zaproszenia na inne serwery i rekrutacja przez wiadomości prywatne wymagają zgody administracji.\n\n🇬🇧 Ads, affiliate links, server invites and recruitment through direct messages require staff approval.',
                '**§4. OSZUSTWA = BAN / SCAMS = BAN**\n🇵🇱 Phishing, fałszywe Nitro, podejrzane pliki, malware, IP loggery, kradzież kont i wyłudzanie danych kończą się natychmiastowym banem.\n\n🇬🇧 Phishing, fake Nitro, suspicious files, malware, IP loggers, account theft and data scams result in an immediate ban.',
                '**§5. LEGALNY GAMELOOP I EMULACJA / LEGAL GAMELOOP AND EMULATION**\n🇵🇱 Zakaz udostępniania pirackich gier, ROM-ów, BIOS-ów, cracków, cheatów, hacków oraz linków do takich materiałów.\n\n🇬🇧 Sharing pirated games, ROMs, BIOS files, cracks, cheats, hacks or links to such content is forbidden.',
                '**§6. CHROŃ KONTA I PRYWATNOŚĆ / PROTECT ACCOUNTS AND PRIVACY**\n🇵🇱 Nie publikuj tokenów, haseł, kluczy, danych osobowych ani cudzych prywatnych rozmów. Zakaz podszywania się pod użytkowników i ekipę.\n\n🇬🇧 Do not share tokens, passwords, keys, personal information or private conversations. Impersonating users or staff is forbidden.',
                '**§7. TREŚCI ZABRONIONE / FORBIDDEN CONTENT**\n🇵🇱 Treści NSFW, drastyczne, nielegalne, rasistowskie lub nawołujące do przemocy są zabronione — także w nazwach, avatarach i profilach.\n\n🇬🇧 NSFW, graphic, illegal, racist or violent content is forbidden, including in names, avatars and profiles.',
                '**§8. PORZĄDEK NA KANAŁACH / KEEP CHANNELS ON TOPIC**\n🇵🇱 Pisz w odpowiednich działach. Na kanałach głosowych nie puszczaj hałasu, nie przeszkadzaj i nie nadużywaj udostępniania ekranu.\n\n🇬🇧 Use the correct channels. In voice chat, do not play disruptive sounds, interrupt others or abuse screen sharing.',
                '**§9. POMOC TECHNICZNA / TECHNICAL SUPPORT**\n🇵🇱 Zgłoszenie musi zawierać wersję GameLoop, system, sprzęt, grę, opis błędu i wykonane próby naprawy. Nie poganiaj ekipy.\n\n🇬🇧 Requests must include the GameLoop version, system, hardware, game, error details and attempted fixes. Do not pressure staff.',
                '**§10. MODERACJA MA OSTATNIE SŁOWO / STAFF HAS THE FINAL SAY**\n🇵🇱 Kary obejmują ostrzeżenie, wyciszenie, kick lub ban. Omijanie kary i powrót na alternatywnym koncie może zakończyć się banem permanentnym. Dołączając, akceptujesz regulamin.\n\n🇬🇧 Penalties include warnings, mutes, kicks or bans. Evading punishment or returning on an alternate account may result in a permanent ban. By joining, you accept these rules.',
              ].join('\n\n'),
            ),
        ),
      ],
    },
    {
      channelKey: 'ROLES',
      marker: 'setup:roles:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:roles:v1',
          new EmbedBuilder()
            .setColor(BRAND.color)
            .setTitle('Wybierz role / Choose your roles 🎛️')
            .setDescription(
              `🇵🇱 Kliknij przycisk, aby dodać lub usunąć rolę.\n🇬🇧 Click a button to add or remove a role.\n\n` +
                `${memberRole} — weryfikacja i dostęp do serwera / verification and server access\n` +
                `${polishRole} — język polski i #chat-pl / Polish language and #chat-pl\n` +
                `${englishRole} — język angielski i #chat-gb / English language and #chat-gb\n` +
                `${newsRole} — aktualizacje / update notifications\n` +
                `${eventsRole} — wydarzenia / community events\n\n` +
                '🇵🇱 Pozostałe role określają platformę i zainteresowania.\n' +
                '🇬🇧 Other roles describe your platform and interests.',
            ),
        ),
      ],
      components: rolePanelComponents(),
    },
    {
      channelKey: 'GAMELOOP_INFO',
      previousChannelKeys: ['FAQ'],
      marker: 'setup:faq:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:faq:v1',
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('Najczęstsze pytania / Frequently Asked Questions ❓')
            .addFields(
              {
                name: 'Czy emulacja jest legalna? / Is emulation legal?',
                value:
                  '🇵🇱 Emulatory są narzędziami. Korzystaj wyłącznie z własnych, legalnie pozyskanych gier i plików systemowych.\n\n' +
                  '🇬🇧 Emulators are tools. Use only your own legally obtained games and system files and follow the law in your country.',
              },
              {
                name: 'Jak opisać problem? / How should I report an issue?',
                value:
                  '🇵🇱 Podaj wersję GameLoop, system, procesor/GPU, grę, ustawienia i pełny komunikat błędu.\n\n' +
                  '🇬🇧 Include your GameLoop version, system, CPU/GPU, game, settings and the complete error message.',
              },
              {
                name: 'Gdzie wysłać log? / Where should I send a log?',
                value:
                  '🇵🇱 Krótkie fragmenty wklej na kanale pomocy, a długie logi dodaj jako plik. Usuń dane prywatne.\n\n' +
                  '🇬🇧 Paste short excerpts in the help channel and attach long logs as a file. Remove private information.',
              },
            ),
        ),
      ],
    },
    {
      channelKey: 'GLX_EXTREAM_TEAM',
      marker: 'setup:glx-extream-team:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:glx-extream-team:v1',
          new EmbedBuilder()
            .setColor(0xed1c24)
            .setTitle('GLX EXTREAM TEAM ESPORT')
            .setDescription(
              '**SQUAD / SKŁAD**\n\n' +
                '1. **GLX HUUMY**\n' +
                '2. —\n' +
                '3. —\n' +
                '4. —',
            )
            .setImage(GLX_TEAM_IMAGE_URL),
        ),
      ],
    },
    {
      channelKey: 'HELP',
      marker: 'setup:help:v1',
      pin: true,
      embeds: [
        markerEmbed(
          'setup:help:v1',
          new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle('Jak poprosić o pomoc? / How to ask for help 🧰')
            .setDescription(
              '🇵🇱 **Skopiuj i uzupełnij:**\n```text\nGameLoop i wersja:\nSystem:\nProcesor / karta graficzna:\nGra:\nOpis problemu:\nWykonane próby naprawy:\nKomunikat błędu / log:\n```\n' +
                '🇬🇧 **Copy and complete:**\n```text\nGameLoop version:\nOperating system:\nCPU / GPU:\nGame:\nProblem description:\nFixes already attempted:\nError message / log:\n```\n' +
                '🔒 Nie publikuj haseł, tokenów ani danych prywatnych. / Never share passwords, tokens or private information.',
            ),
        ),
      ],
    },
  ];
}

async function ensureStarterMessage(channel, spec, report) {
  const recent = await channel.messages.fetch({ limit: 100 });
  const existing = recent.find(
    (message) =>
      message.author.id === channel.client.user.id &&
      message.embeds.some((embed) => embed.footer?.text?.includes(spec.marker)),
  );
  const payload = {
    embeds: spec.embeds,
    components: spec.components ?? [],
    allowedMentions: { parse: [] },
  };

  let message;
  if (existing) {
    message = await existing.edit(payload);
    report.updated.push(`wiadomość #${channel.name}`);
  } else {
    message = await channel.send(payload);
    report.created.push(`wiadomość #${channel.name}`);
  }

  if (spec.pin && !message.pinned) {
    await message.pin(SETUP_REASON);
  }
}

export async function removeStarterMessage(channel, marker, report) {
  const recent = await channel.messages.fetch({ limit: 100 });
  let existing = recent.find(
    (message) =>
      message.author.id === channel.client.user.id &&
      message.embeds.some((embed) => embed.footer?.text?.includes(marker)),
  );

  if (!existing && typeof channel.messages.fetchPins === 'function') {
    const pinned = await channel.messages.fetchPins({ limit: 50 });
    existing = pinned.items
      .map((item) => item.message)
      .find(
        (message) =>
          message.author.id === channel.client.user.id &&
          message.embeds.some((embed) => embed.footer?.text?.includes(marker)),
      );
  }

  if (!existing) {
    return;
  }

  await existing.delete();
  report.updated.push(`przeniesiono wiadomość z #${channel.name}`);
}

export async function ensureCommunity(guild, channelMap, report) {
  const rulesChannel = channelMap.get('RULES');
  const updatesChannel = channelMap.get('COMMUNITY_UPDATES');
  const communityEnabled = guild.features.includes(GuildFeature.Community);
  const options = {
    rulesChannel,
    publicUpdatesChannel: updatesChannel,
    safetyAlertsChannel: updatesChannel,
    preferredLocale: 'pl',
    verificationLevel: Math.max(guild.verificationLevel, GuildVerificationLevel.Low),
    explicitContentFilter: GuildExplicitContentFilter.AllMembers,
    reason: SETUP_REASON,
  };

  if (!communityEnabled) {
    options.features = [...new Set([...guild.features, GuildFeature.Community])];
  }

  await guild.edit(options);
  report.updated.push(
    communityEnabled ? 'ustawienia Społeczności' : 'włączono tryb Społeczność',
  );
}

function onboardingPrompts(channelMap, roleMap) {
  return [
    {
      title: 'Jakiego języka chcesz używać?',
      singleSelect: false,
      required: true,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        {
          title: 'Polski',
          description: 'Polski czat i polskojęzyczna społeczność.',
          emoji: '🇵🇱',
          roles: [roleMap.get(ROLE_KEYS.POLISH)],
          channels: [channelMap.get('CHAT_PL')],
        },
        {
          title: 'English',
          description: 'English chat and international community.',
          emoji: '🇬🇧',
          roles: [roleMap.get(ROLE_KEYS.ENGLISH)],
          channels: [channelMap.get('CHAT_GB')],
        },
      ],
    },
    {
      title: 'Na jakich urządzeniach korzystasz z emulatorów?',
      singleSelect: false,
      required: false,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        { title: 'PC', emoji: '🖥️', roles: [roleMap.get(ROLE_KEYS.PC)] },
        { title: 'Android', emoji: '📱', roles: [roleMap.get(ROLE_KEYS.ANDROID)] },
        { title: 'Apple', emoji: '🍎', roles: [roleMap.get(ROLE_KEYS.APPLE)] },
        { title: 'Linux', emoji: '🐧', roles: [roleMap.get(ROLE_KEYS.LINUX)] },
      ],
    },
    {
      title: 'Które tematy emulacji najbardziej Cię interesują?',
      singleSelect: false,
      required: false,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        { title: 'Konfiguracje', emoji: '🛠️', channels: [channelMap.get('CONFIGS')] },
        {
          title: 'Kompatybilność gier',
          emoji: '🎯',
          channels: [channelMap.get('COMPATIBILITY')],
        },
        {
          title: 'Wydajność i sprzęt',
          emoji: '⚡',
          channels: [channelMap.get('PERFORMANCE')],
        },
        { title: 'Mody i zapisy', emoji: '🧩', channels: [channelMap.get('MODS')] },
        { title: 'Retro', emoji: '🕹️', channels: [channelMap.get('RETRO')] },
      ],
    },
    {
      title: 'Jak chcesz korzystać ze społeczności?',
      singleSelect: false,
      required: false,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        { title: 'Rozmowy ogólne', emoji: '💬', channels: [channelMap.get('GENERAL')] },
        { title: 'Pomoc innym', emoji: '🧰', channels: [channelMap.get('HELP')] },
        {
          title: 'Screeny i setupy',
          emoji: '📸',
          channels: [channelMap.get('SHOWCASE')],
        },
        { title: 'Memy', emoji: '😂', channels: [channelMap.get('MEMES')] },
        { title: 'Off-topic', emoji: '🌍', channels: [channelMap.get('OFFTOPIC')] },
      ],
    },
    {
      title: 'Jakie powiadomienia chcesz otrzymywać?',
      singleSelect: false,
      required: false,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        {
          title: 'Aktualizacje emulatorów',
          emoji: '📰',
          roles: [roleMap.get(ROLE_KEYS.NEWS)],
          channels: [channelMap.get('EMU_NEWS')],
        },
        {
          title: 'Wydarzenia społeczności',
          emoji: '🎉',
          roles: [roleMap.get(ROLE_KEYS.EVENTS)],
        },
      ],
    },
    {
      title: 'Które kanały głosowe chcesz obserwować?',
      singleSelect: false,
      required: false,
      inOnboarding: false,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        { title: 'Lobby', emoji: '🎧', channels: [channelMap.get('LOBBY')] },
        {
          title: 'Wspólna gra',
          emoji: '🎮',
          roles: [roleMap.get(ROLE_KEYS.GAMING)],
          channels: [channelMap.get('GAMING_VOICE')],
        },
        {
          title: 'Pomoc głosowa',
          emoji: '🎙️',
          channels: [channelMap.get('HELP_VOICE')],
        },
      ],
    },
    {
      title: 'Jakiej pomocy szukasz?',
      singleSelect: false,
      required: false,
      inOnboarding: false,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: [
        { title: 'Pomoc z emulatorem', emoji: '🎮', channels: [channelMap.get('HELP')] },
        {
          title: 'Problem z serwerem lub botem',
          emoji: '🛠️',
          channels: [channelMap.get('ISSUES')],
        },
        {
          title: 'Pomysł na rozwój',
          emoji: '💡',
          channels: [channelMap.get('SUGGESTIONS')],
        },
        { title: 'FAQ', emoji: '❓', channels: [channelMap.get('FAQ')] },
      ],
    },
  ];
}

export async function ensureOnboardingQuestions(guild, channelMap, roleMap, report) {
  const prompts = onboardingPrompts(channelMap, roleMap);
  await guild.editOnboarding({
    prompts,
    defaultChannels: [channelMap.get('VERIFICATION')],
    enabled: false,
    mode: GuildOnboardingMode.OnboardingAdvanced,
    reason: SETUP_REASON,
  });
  report.updated.push(`${prompts.length} pytań onboardingu`);
  report.warnings.push(
    'Pytania onboardingu są przygotowane, ale onboarding pozostaje wyłączony, aby przed weryfikacją był widoczny tylko #weryfikacja.',
  );
}

function assertBotPermissions(guild) {
  if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    throw new Error(
      'Bot nie ma uprawnienia Administrator. Nadaj je na czas konfiguracji i ustaw rolę bota wysoko. / The bot needs Administrator permission during setup and its role must be placed high enough.',
    );
  }
}

export async function setupGuild(guild, onProgress = () => {}) {
  await guild.roles.fetch();
  await guild.channels.fetch();
  assertBotPermissions(guild);

  const report = { created: [], updated: [], warnings: [] };
  const roleMap = new Map();
  const categoryMap = new Map();
  const channelMap = new Map();

  onProgress('Tworzę i aktualizuję role…');
  for (const spec of roles) {
    roleMap.set(spec.key, await ensureRole(guild, spec, report));
  }

  onProgress('Tworzę kategorie i ustawiam dostęp…');
  for (const spec of categories) {
    categoryMap.set(spec.key, await ensureCategory(guild, spec, roleMap, report));
  }

  onProgress('Tworzę kanały tekstowe i głosowe…');
  for (const spec of channels) {
    const category = categoryMap.get(spec.category);
    const categorySpec = categories.find((item) => item.key === spec.category);
    channelMap.set(
      spec.key,
      await ensureChannel(guild, spec, category, categorySpec, roleMap, report),
    );
  }

  onProgress('Sprawdzam dostęp roli Zweryfikowany do kanałów…');
  await unlockVerifiedChannels(guild, categoryMap, channelMap, roleMap, report);

  onProgress('Publikuję wiadomości startowe i panel ról…');
  for (const messageSpec of starterMessages(roleMap)) {
    const channel = channelMap.get(messageSpec.channelKey);
    if (channel) {
      await ensureStarterMessage(channel, messageSpec, report);
      for (const previousChannelKey of messageSpec.previousChannelKeys ?? []) {
        const previousChannel = channelMap.get(previousChannelKey);
        if (previousChannel && previousChannel.id !== channel.id) {
          await removeStarterMessage(previousChannel, messageSpec.marker, report);
        }
      }
    }
  }

  const logs = channelMap.get('LOGS');
  if (logs) {
    await logs.send({
      embeds: [
        new EmbedBuilder()
          .setColor(BRAND.color)
          .setTitle('Konfiguracja zakończona / Setup complete')
          .setDescription(
            `Utworzono / Created: **${report.created.length}**\nZaktualizowano / Updated: **${report.updated.length}**\nOstrzeżenia / Warnings: **${report.warnings.length}**`,
          )
          .setTimestamp()
          .setFooter({ text: BRAND.footer }),
      ],
    });
  }

  return report;
}

export async function toggleSelfRole(interaction) {
  const roleKey = interaction.customId.split(':')[1];
  const spec = selfAssignableRoles.find((role) => role.key === roleKey);
  if (!spec) {
    await interaction.reply({
      content: 'Ta rola nie jest już dostępna. / This role is no longer available.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const role = interaction.guild.roles.cache.find(
    (item) => item.name === spec.name && !item.managed,
  );
  if (!role) {
    await interaction.reply({
      content:
        'Nie znaleziono tej roli. Administrator powinien użyć `/setup`. / Role not found. An administrator should run `/setup`.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!role.editable) {
    await interaction.reply({
      content:
        'Nie mogę zarządzać tą rolą — rola bota musi być wyżej. / I cannot manage this role—the bot role must be higher.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = member.roles.cache.has(role.id);
  if (hasRole) {
    await member.roles.remove(role, 'Samodzielny wybór roli EMUPLCOOM');
  } else {
    await member.roles.add(role, 'Samodzielny wybór roli EMUPLCOOM');
  }

  await interaction.reply({
    content: hasRole
      ? `Usunięto rolę ${role}. / Removed role ${role}.`
      : `Dodano rolę ${role}. / Added role ${role}.`,
    flags: MessageFlags.Ephemeral,
  });
}
