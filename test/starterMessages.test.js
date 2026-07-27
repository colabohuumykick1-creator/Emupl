import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLE_KEYS } from '../src/config.js';
import { starterMessages } from '../src/setupGuild.js';

function embedTextLength(embed) {
  return (
    (embed.title?.length ?? 0) +
    (embed.description?.length ?? 0) +
    (embed.footer?.text?.length ?? 0) +
    (embed.author?.name?.length ?? 0) +
    (embed.fields ?? []).reduce(
      (total, field) => total + field.name.length + field.value.length,
      0,
    )
  );
}

test('przewodnik GameLoop mieści się w limitach wiadomości Discorda', () => {
  const roleMap = new Map(
    [
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
      ROLE_KEYS.NEWS,
      ROLE_KEYS.EVENTS,
    ].map((key) => [key, `<@&${key}>`]),
  );
  const guide = starterMessages(roleMap).find(
    (message) => message.channelKey === 'GAMELOOP_INFO',
  );

  assert.ok(guide);
  assert.ok(guide.embeds.length <= 10);

  let totalLength = 0;
  for (const builder of guide.embeds) {
    const embed = builder.toJSON();
    assert.ok((embed.title?.length ?? 0) <= 256);
    assert.ok((embed.description?.length ?? 0) <= 4096);
    assert.ok((embed.fields?.length ?? 0) <= 25);
    for (const field of embed.fields ?? []) {
      assert.ok(field.name.length <= 256);
      assert.ok(field.value.length <= 1024, field.name);
    }
    totalLength += embedTextLength(embed);

    for (const field of embed.fields ?? []) {
      if (field.value.includes('🇵🇱') && field.value.includes('🇬🇧')) {
        assert.ok(
          field.value.includes('\n\n🇬🇧'),
          `${field.name} nie ma odstępu między wersjami językowymi`,
        );
      }
    }
  }

  assert.ok(totalLength <= 6000);
});

test('regulamin ma odstęp między polską i angielską wersją każdego punktu', () => {
  const roleMap = new Map(
    [
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
      ROLE_KEYS.NEWS,
      ROLE_KEYS.EVENTS,
    ].map((key) => [key, `<@&${key}>`]),
  );
  const rules = starterMessages(roleMap).find((message) => message.channelKey === 'RULES');
  const embed = rules.embeds[0].toJSON();
  const languageSeparators = embed.description.match(/\n\n🇬🇧/g) ?? [];

  assert.equal(languageSeparators.length, 10);
  assert.ok(embed.description.length <= 4096);
  assert.ok(embedTextLength(embed) <= 6000);
});

test('FAQ jest przenoszone do kanału o-gameloop', () => {
  const roleMap = new Map(
    [
      ROLE_KEYS.MEMBER,
      ROLE_KEYS.POLISH,
      ROLE_KEYS.ENGLISH,
      ROLE_KEYS.NEWS,
      ROLE_KEYS.EVENTS,
    ].map((key) => [key, `<@&${key}>`]),
  );
  const messages = starterMessages(roleMap);
  const faq = messages.find((message) => message.marker === 'setup:faq:v1');
  const guide = messages.find((message) => message.channelKey === 'GAMELOOP_INFO');
  const guideJson = guide.embeds[0].toJSON();
  const links = guideJson.fields.find((field) => field.name.includes('Oficjalne linki')).value;

  assert.equal(faq.channelKey, 'GAMELOOP_INFO');
  assert.deepEqual(faq.previousChannelKeys, ['FAQ']);
  assert.match(links, /\[GameLoop 32-bit\]\(https:\/\/down\.gameloop\.com\/.+\.exe\)/);
  assert.match(links, /\[GameLoop 64-bit\]\(https:\/\/down\.gameloop\.com\/.+\.exe\)/);
});
