import assert from 'node:assert/strict';
import test from 'node:test';
import { Collection } from 'discord.js';
import { resolveGuild } from '../src/guildResolver.js';

test('używa skonfigurowanego serwera, gdy identyfikator jest prawidłowy', async () => {
  const configuredGuild = { id: '123', name: 'EMUPLCOOM' };
  const client = {
    guilds: {
      cache: new Collection([[configuredGuild.id, configuredGuild]]),
      async fetch(id) {
        assert.equal(id, configuredGuild.id);
        return configuredGuild;
      },
    },
  };

  assert.equal(await resolveGuild(client, configuredGuild.id), configuredGuild);
});

test('przy jednym serwerze zastępuje nieaktualne GUILD_ID', async () => {
  const availableGuild = { id: '456', name: 'PL EMULATOR CENTER' };
  const warnings = [];
  const client = {
    guilds: {
      cache: new Collection([[availableGuild.id, availableGuild]]),
      async fetch() {
        const error = new Error('Unknown Guild');
        error.code = 10004;
        throw error;
      },
    },
  };

  const result = await resolveGuild(client, 'nieaktualne-id', (message) =>
    warnings.push(message),
  );

  assert.equal(result, availableGuild);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /PL EMULATOR CENTER \(456\)/);
});

test('nie zgaduje serwera, gdy bot jest na kilku serwerach', async () => {
  const originalError = new Error('Unknown Guild');
  const client = {
    guilds: {
      cache: new Collection([
        ['1', { id: '1', name: 'Pierwszy' }],
        ['2', { id: '2', name: 'Drugi' }],
      ]),
      async fetch() {
        throw originalError;
      },
    },
  };

  await assert.rejects(resolveGuild(client, 'nieaktualne-id'), originalError);
});
