import assert from 'node:assert/strict';
import test from 'node:test';
import { commandData } from '../src/commands.js';
import { isValidImageUrl } from '../src/embedCommand.js';

test('komenda /embed jest zarejestrowana jako administracyjna', () => {
  const command = commandData.find((item) => item.name === 'embed');

  assert.ok(command);
  assert.ok(command.default_member_permissions);
  assert.deepEqual(
    command.options.filter((option) => option.required).map((option) => option.name),
    ['kanal', 'tytul', 'tresc'],
  );
});

test('walidacja akceptuje tylko adresy HTTP i HTTPS', () => {
  assert.equal(isValidImageUrl('https://example.com/obraz.png'), true);
  assert.equal(isValidImageUrl('http://example.com/obraz.jpg'), true);
  assert.equal(isValidImageUrl('ftp://example.com/plik.png'), false);
  assert.equal(isValidImageUrl('to nie jest adres'), false);
  assert.equal(isValidImageUrl(null), true);
});
