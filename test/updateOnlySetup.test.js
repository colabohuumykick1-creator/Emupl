import assert from 'node:assert/strict';
import test from 'node:test';
import { ChannelType, Collection } from 'discord.js';
import { ROLE_KEYS } from '../src/config.js';
import { ensureCategory, ensureChannel } from '../src/setupGuild.js';

test('setup nie tworzy brakujących kategorii ani kanałów', async () => {
  let createCalls = 0;
  const guild = {
    channels: {
      cache: new Collection(),
      async create() {
        createCalls += 1;
      },
    },
  };
  const report = { created: [], updated: [], warnings: [] };

  const category = await ensureCategory(
    guild,
    { name: 'BRAKUJĄCA', permissionMode: 'MEMBER' },
    new Map(),
    report,
  );
  const channel = await ensureChannel(
    guild,
    { name: 'brakujacy-kanal', type: ChannelType.GuildText },
    null,
    { permissionMode: 'MEMBER' },
    new Map(),
    report,
  );

  assert.equal(category, null);
  assert.equal(channel, null);
  assert.equal(createCalls, 0);
  assert.equal(report.created.length, 0);
  assert.equal(report.warnings.length, 2);
});

test('setup aktualizuje istniejący kanał bez przenoszenia go', async () => {
  let editData;
  const existingChannel = {
    id: 'channel',
    name: 'ogloszenia',
    type: ChannelType.GuildText,
    parentId: 'inna-kategoria',
    async edit(data) {
      editData = data;
    },
  };
  const guild = {
    channels: { cache: new Collection([[existingChannel.id, existingChannel]]) },
    roles: { everyone: { id: 'everyone' } },
    members: { me: { id: 'bot' } },
  };
  const roleMap = new Map(
    [
      ROLE_KEYS.OWNER,
      ROLE_KEYS.ADMIN,
      ROLE_KEYS.MODERATOR,
      ROLE_KEYS.SUPPORT,
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
    ].map((key) => [key, { id: key }]),
  );
  const report = { created: [], updated: [], warnings: [] };

  const channel = await ensureChannel(
    guild,
    {
      name: 'ogloszenia',
      type: ChannelType.GuildText,
      topic: 'Aktualności / News',
      permissionMode: 'MEMBER',
    },
    { id: 'docelowa-kategoria' },
    { permissionMode: 'MEMBER' },
    roleMap,
    report,
  );

  assert.equal(channel, existingChannel);
  assert.equal(Object.hasOwn(editData, 'parent'), false);
  assert.equal(editData.topic, 'Aktualności / News');
  assert.equal(report.created.length, 0);
});

test('setup może utworzyć wyłącznie kanał oznaczony jako dozwolony', async () => {
  let createData;
  const guild = {
    channels: {
      cache: new Collection(),
      async create(data) {
        createData = data;
        return { id: 'gameloop-info', name: data.name, type: data.type };
      },
    },
    roles: { everyone: { id: 'everyone' } },
    members: { me: { id: 'bot' } },
  };
  const roleMap = new Map(
    [
      ROLE_KEYS.OWNER,
      ROLE_KEYS.ADMIN,
      ROLE_KEYS.MODERATOR,
      ROLE_KEYS.SUPPORT,
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
    ].map((key) => [key, { id: key }]),
  );
  const report = { created: [], updated: [], warnings: [] };

  const channel = await ensureChannel(
    guild,
    {
      name: 'o-gameloop',
      type: ChannelType.GuildText,
      topic: 'GameLoop info',
      permissionMode: 'MEMBER',
      createIfMissing: true,
    },
    { id: 'start' },
    { permissionMode: 'MEMBER' },
    roleMap,
    report,
  );

  assert.equal(channel.name, 'o-gameloop');
  assert.equal(createData.parent, 'start');
  assert.equal(createData.topic, 'GameLoop info');
  assert.deepEqual(report.created, ['kanał o-gameloop']);
  assert.equal(report.warnings.length, 0);
});
