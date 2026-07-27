import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GuildExplicitContentFilter,
  GuildFeature,
  GuildVerificationLevel,
} from 'discord.js';
import { ROLE_KEYS } from '../src/config.js';
import { ensureCommunity, ensureOnboardingQuestions } from '../src/setupGuild.js';

function createGuild(features = [], verificationLevel = 0) {
  let editOptions;
  return {
    guild: {
      features,
      verificationLevel,
      async edit(options) {
        editOptions = options;
      },
    },
    getEditOptions: () => editOptions,
  };
}

test('setup włącza tryb Społeczność i ustawia wymagane kanały', async () => {
  const rulesChannel = { id: 'rules' };
  const updatesChannel = { id: 'updates' };
  const channelMap = new Map([
    ['RULES', rulesChannel],
    ['COMMUNITY_UPDATES', updatesChannel],
  ]);
  const report = { updated: [] };
  const { guild, getEditOptions } = createGuild(['NEWS']);

  await ensureCommunity(guild, channelMap, report);

  const options = getEditOptions();
  assert.deepEqual(options.features, ['NEWS', GuildFeature.Community]);
  assert.equal(options.rulesChannel, rulesChannel);
  assert.equal(options.publicUpdatesChannel, updatesChannel);
  assert.equal(options.safetyAlertsChannel, updatesChannel);
  assert.equal(options.preferredLocale, 'pl');
  assert.equal(options.verificationLevel, GuildVerificationLevel.Low);
  assert.equal(options.explicitContentFilter, GuildExplicitContentFilter.AllMembers);
});

test('setup nie nadpisuje listy funkcji, gdy Społeczność jest już włączona', async () => {
  const channelMap = new Map([
    ['RULES', { id: 'rules' }],
    ['COMMUNITY_UPDATES', { id: 'updates' }],
  ]);
  const report = { updated: [] };
  const { guild, getEditOptions } = createGuild(
    [GuildFeature.Community],
    GuildVerificationLevel.High,
  );

  await ensureCommunity(guild, channelMap, report);

  assert.equal(getEditOptions().features, undefined);
  assert.equal(getEditOptions().verificationLevel, GuildVerificationLevel.High);
});

test('setup przygotowuje 7 pytań bez otwierania serwera przed weryfikacją', async () => {
  let onboardingOptions;
  const guild = {
    async editOnboarding(options) {
      onboardingOptions = options;
    },
  };
  const channelKeys = [
    'VERIFICATION',
    'CHAT_PL',
    'CHAT_GB',
    'CONFIGS',
    'COMPATIBILITY',
    'PERFORMANCE',
    'MODS',
    'RETRO',
    'GENERAL',
    'HELP',
    'SHOWCASE',
    'MEMES',
    'OFFTOPIC',
    'EMU_NEWS',
    'LOBBY',
    'GAMING_VOICE',
    'HELP_VOICE',
    'ISSUES',
    'SUGGESTIONS',
    'FAQ',
  ];
  const roleKeys = [
    ROLE_KEYS.POLISH,
    ROLE_KEYS.ENGLISH,
    ROLE_KEYS.PC,
    ROLE_KEYS.ANDROID,
    ROLE_KEYS.APPLE,
    ROLE_KEYS.LINUX,
    ROLE_KEYS.NEWS,
    ROLE_KEYS.EVENTS,
    ROLE_KEYS.GAMING,
  ];
  const channelMap = new Map(channelKeys.map((key) => [key, { id: key }]));
  const roleMap = new Map(roleKeys.map((key) => [key, { id: key }]));
  const report = { updated: [], warnings: [] };

  await ensureOnboardingQuestions(guild, channelMap, roleMap, report);

  assert.equal(onboardingOptions.prompts.length, 7);
  assert.equal(onboardingOptions.enabled, false);
  assert.deepEqual(onboardingOptions.defaultChannels, [channelMap.get('VERIFICATION')]);
  assert.ok(onboardingOptions.prompts.some((prompt) => prompt.required));
  assert.equal(report.warnings.length, 1);
});
