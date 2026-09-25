import assert from 'node:assert/strict';
import test from 'node:test';
import { PermissionFlagsBits } from 'discord.js';
import {
  ROLE_KEYS,
  categories,
  channels,
  roles,
  selfAssignableRoles,
} from '../src/config.js';

test('klucze i nazwy ról są unikalne', () => {
  assert.equal(new Set(roles.map((role) => role.key)).size, roles.length);
  assert.equal(new Set(roles.map((role) => role.name)).size, roles.length);
});

test('klucze kategorii i kanałów są unikalne', () => {
  assert.equal(new Set(categories.map((category) => category.key)).size, categories.length);
  assert.equal(new Set(channels.map((channel) => channel.key)).size, channels.length);
});

test('każdy kanał wskazuje istniejącą kategorię', () => {
  const categoryKeys = new Set(categories.map((category) => category.key));
  for (const channel of channels) {
    assert.ok(categoryKeys.has(channel.category), `${channel.key} ma nieznaną kategorię`);
  }
});

test('role wybierane przyciskiem nie mają uprawnień administracyjnych', () => {
  const unsafe = new Set([
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
  ]);

  for (const role of selfAssignableRoles) {
    assert.equal(role.permissions.some((permission) => unsafe.has(permission)), false, role.name);
  }
});

test('panel ról mieści się w limicie komponentów Discorda', () => {
  assert.ok(selfAssignableRoles.length <= 25);
});

test('rola weryfikacyjna nie jest dostępna w panelu ról', () => {
  const verifiedRole = roles.find((role) => role.key === ROLE_KEYS.MEMBER);
  assert.equal(verifiedRole.name, 'Zweryfikowany');
  assert.equal(verifiedRole.selfAssignable, undefined);
  assert.equal(selfAssignableRoles.includes(verifiedRole), false);
});

test('przed weryfikacją publiczny jest tylko kanał weryfikacji', () => {
  const startCategory = categories.find((category) => category.key === 'START');
  const verification = channels.find((channel) => channel.key === 'VERIFICATION');
  const remainingStartChannels = channels.filter(
    (channel) => channel.category === 'START' && channel.key !== 'VERIFICATION',
  );

  assert.equal(startCategory.permissionMode, 'MEMBER');
  assert.equal(verification.permissionMode, 'VERIFICATION');
  assert.ok(remainingStartChannels.every((channel) => channel.permissionMode === 'MEMBER'));
});

test('czaty językowe wymagają odpowiednich ról językowych', () => {
  const polishChat = channels.find((channel) => channel.key === 'CHAT_PL');
  const englishChat = channels.find((channel) => channel.key === 'CHAT_GB');

  assert.equal(polishChat.permissionMode, 'LANGUAGE_POLISH');
  assert.equal(englishChat.permissionMode, 'LANGUAGE_ENGLISH');
});
