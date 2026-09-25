import assert from 'node:assert/strict';
import test from 'node:test';
import { Collection } from 'discord.js';
import { removeStarterMessage } from '../src/setupGuild.js';

test('przenoszenie usuwa tylko oznaczoną wiadomość własnego bota', async () => {
  let botMessageDeleted = false;
  let userMessageDeleted = false;
  const markerEmbed = { footer: { text: 'EMUPLCOOM • setup:faq:v1' } };
  const channel = {
    name: 'faq',
    client: { user: { id: 'bot' } },
    messages: {
      async fetch() {
        return new Collection([
          [
            'user-message',
            {
              author: { id: 'user' },
              embeds: [markerEmbed],
              async delete() {
                userMessageDeleted = true;
              },
            },
          ],
          [
            'bot-message',
            {
              author: { id: 'bot' },
              embeds: [markerEmbed],
              async delete() {
                botMessageDeleted = true;
              },
            },
          ],
        ]);
      },
    },
  };
  const report = { created: [], updated: [], warnings: [] };

  await removeStarterMessage(channel, 'setup:faq:v1', report);

  assert.equal(botMessageDeleted, true);
  assert.equal(userMessageDeleted, false);
  assert.deepEqual(report.updated, ['przeniesiono wiadomość z #faq']);
});
