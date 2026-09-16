import assert from 'node:assert/strict';
import test from 'node:test';
import { ChannelType, Collection, PermissionFlagsBits } from 'discord.js';
import { ROLE_KEYS } from '../src/config.js';
import { unlockVerifiedChannels } from '../src/setupGuild.js';

function permissions(viewChannel, connect = false) {
  return {
    has(permission) {
      if (permission === PermissionFlagsBits.ViewChannel) return viewChannel;
      if (permission === PermissionFlagsBits.Connect) return connect;
      return false;
    },
  };
}

test('audyt odblokowuje ręcznie dodane kanały dla roli Zweryfikowany', async () => {
  const edits = [];
  const makeChannel = ({ id, name, parentId, type, view = false, connect = false }) => ({
    id,
    name,
    parentId,
    type,
    permissionsFor() {
      return permissions(view, connect);
    },
    permissionOverwrites: {
      async edit(role, overwrite) {
        edits.push({ id, role, overwrite });
      },
    },
  });
  const guild = {
    channels: {
      cache: new Collection([
        [
          'rekrutacja',
          makeChannel({
            id: 'rekrutacja',
            name: 'rekrutacja',
            parentId: 'community',
            type: ChannelType.GuildText,
          }),
        ],
        [
          'ticket',
          makeChannel({
            id: 'ticket',
            name: 'ticket',
            parentId: 'emulators',
            type: ChannelType.GuildText,
          }),
        ],
        [
          'voice',
          makeChannel({
            id: 'voice',
            name: 'Dodatkowy głosowy',
            parentId: 'voice-category',
            type: ChannelType.GuildVoice,
          }),
        ],
        [
          'visible',
          makeChannel({
            id: 'visible',
            name: 'ogolny',
            parentId: 'community',
            type: ChannelType.GuildText,
            view: true,
          }),
        ],
        [
          'verification',
          makeChannel({
            id: 'verification',
            name: 'weryfikacja',
            parentId: 'start',
            type: ChannelType.GuildText,
          }),
        ],
        [
          'english',
          makeChannel({
            id: 'english',
            name: 'chat-gb',
            parentId: 'community',
            type: ChannelType.GuildText,
          }),
        ],
        [
          'staff',
          makeChannel({
            id: 'staff',
            name: 'ekipa-chat',
            parentId: 'staff-category',
            type: ChannelType.GuildText,
          }),
        ],
      ]),
    },
  };
  const verifiedRole = { id: 'verified' };
  const roleMap = new Map([[ROLE_KEYS.MEMBER, verifiedRole]]);
  const categoryMap = new Map([
    ['START', { id: 'start' }],
    ['COMMUNITY', { id: 'community' }],
    ['EMULATORS', { id: 'emulators' }],
    ['SUPPORT', { id: 'support' }],
    ['VOICE', { id: 'voice-category' }],
    ['STAFF', { id: 'staff-category' }],
  ]);
  const channelMap = new Map([
    ['VERIFICATION', { id: 'verification' }],
    ['CHAT_GB', { id: 'english' }],
  ]);
  const report = { created: [], updated: [], warnings: [] };

  await unlockVerifiedChannels(guild, categoryMap, channelMap, roleMap, report);

  assert.deepEqual(
    edits.map((edit) => edit.id),
    ['rekrutacja', 'ticket', 'voice'],
  );
  assert.deepEqual(edits[0].overwrite, { ViewChannel: true });
  assert.deepEqual(edits[1].overwrite, { ViewChannel: true });
  assert.deepEqual(edits[2].overwrite, { ViewChannel: true, Connect: true });
  assert.ok(edits.every((edit) => edit.role === verifiedRole));
  assert.equal(report.updated.length, 3);
});
