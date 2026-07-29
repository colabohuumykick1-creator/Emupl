import assert from 'node:assert/strict';
import test from 'node:test';
import { Collection } from 'discord.js';
import { ROLE_KEYS, roles } from '../src/config.js';
import { starterMessages, verifyMember } from '../src/setupGuild.js';

function roleMap() {
  return new Map(
    [
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
      ROLE_KEYS.NEWS,
      ROLE_KEYS.EVENTS,
    ].map((key) => [key, `<@&${key}>`]),
  );
}

test('panel weryfikacji ma trzy bezpieczne opcje językowe', () => {
  const panel = starterMessages(roleMap()).find(
    (message) => message.channelKey === 'VERIFICATION',
  );
  const embed = panel.embeds[0].toJSON();
  const component = panel.components[0].toJSON();

  assert.equal(panel.marker, 'setup:verification:v1');
  assert.equal(panel.pin, true);
  assert.match(embed.title, /Secure Verification/);
  assert.equal(component.components.length, 3);
  assert.deepEqual(
    component.components.map((button) => button.custom_id),
    [
      'emuplcoom-verify:POLISH',
      'emuplcoom-verify:ENGLISH',
      'emuplcoom-verify:BOTH',
    ],
  );
});

test('weryfikacja nadaje rolę członka i wybraną rolę językową', async () => {
  const memberSpec = roles.find((role) => role.key === ROLE_KEYS.MEMBER);
  const polishSpec = roles.find((role) => role.key === ROLE_KEYS.POLISH);
  const configuredRoles = [
    { id: 'member-role', name: memberSpec.name, managed: false, editable: true },
    { id: 'polish-role', name: polishSpec.name, managed: false, editable: true },
  ];
  let addedRoleIds;
  let deferred = false;
  let reply;
  const member = {
    roles: {
      cache: new Collection(),
      async add(roleIds) {
        addedRoleIds = roleIds;
      },
    },
  };
  const interaction = {
    customId: 'emuplcoom-verify:POLISH',
    user: {
      id: 'user',
      createdTimestamp: Date.now() - 60_000,
      toString: () => '<@user>',
    },
    guild: {
      roles: { cache: new Collection(configuredRoles.map((role) => [role.id, role])) },
      members: { fetch: async () => member },
      channels: { cache: new Collection() },
    },
    async deferReply() {
      deferred = true;
    },
    async editReply(payload) {
      reply = payload;
    },
  };

  await verifyMember(interaction);

  assert.equal(deferred, true);
  assert.deepEqual(addedRoleIds, ['member-role', 'polish-role']);
  assert.match(reply.embeds[0].toJSON().title, /Verification complete/);
});
