import assert from "node:assert/strict";
import {
  authorForBot,
  botIdFromRow,
  canSeeHiddenBots,
  filterHiddenBots,
  isHiddenBotIdentity,
  isOwnChatMessage,
  readEmbeddedBot,
  redactBotMentions,
  withBotAuthor,
} from "./bot-visibility.ts";

const owner = { role: "admin", isSuperAdmin: true };
const regularAdmin = { role: "admin", isSuperAdmin: false };
const collaborator = { role: "collaborator", isSuperAdmin: false };
const member = { role: "user", isSuperAdmin: false };

assert.equal(canSeeHiddenBots(owner), true);
assert.equal(canSeeHiddenBots(regularAdmin), false);
assert.equal(canSeeHiddenBots(collaborator), false);
assert.equal(canSeeHiddenBots(member), false);
assert.equal(canSeeHiddenBots({ role: "admin" }), false);
assert.equal(canSeeHiddenBots(null), false);
assert.equal(canSeeHiddenBots(undefined), false);

const people = [
  { id: "1", username: "ali", displayName: "Ali" },
  { id: "2", username: "wpbot", displayName: "wpbot" },
  { id: "3", username: "sara", displayName: "Sara" },
];

assert.deepEqual(
  filterHiddenBots(people, regularAdmin).map((person) => person.username),
  ["ali", "sara"],
);
assert.deepEqual(
  filterHiddenBots(people, collaborator).map((person) => person.username),
  ["ali", "sara"],
);
assert.equal(filterHiddenBots(people, owner).length, 3);

const channels = [
  { slug: "general", name: "General", kind: "channel" },
  { slug: "wpbot", name: "wpbot", kind: "bot" },
  { slug: "design", name: "Design", kind: "group" },
];
assert.deepEqual(
  filterHiddenBots(channels, regularAdmin).map((channel) => channel.slug),
  ["general", "design"],
);
assert.equal(filterHiddenBots(channels, owner).length, 3);

assert.equal(isHiddenBotIdentity({ channelKind: "bot", channelName: "wpbot" }), true);
assert.equal(isHiddenBotIdentity({ kind: "channel", name: "General" }), false);
assert.equal(isHiddenBotIdentity({ username: "WPBot" }), true);

const inbox = [
  { channelName: "General", channelKind: "channel", preview: "hello @wpbot today" },
  { channelName: "wpbot", channelKind: "bot", preview: "assistant" },
];
const visibleInbox = filterHiddenBots(inbox, member);
assert.equal(visibleInbox.length, 1);
assert.equal(visibleInbox[0]?.channelName, "General");
assert.equal(redactBotMentions(visibleInbox[0]?.preview ?? "", member), "hello  today");
assert.equal(redactBotMentions("ping @wpbot", owner), "ping @wpbot");
assert.equal(redactBotMentions("ping @WPBot please", regularAdmin), "ping  please");

assert.equal(botIdFromRow({ bot_id: "11111111-1111-1111-1111-111111111111" }), "11111111-1111-1111-1111-111111111111");
assert.equal(botIdFromRow({ bot_id: null }), null);
assert.equal(botIdFromRow({ bot_id: "" }), null);
assert.equal(botIdFromRow({ botId: "abc" }), "abc");
assert.equal(botIdFromRow(undefined), null);

const embedded = readEmbeddedBot({
  bot_id: "bot-1",
  bot: { id: "bot-1", username: "wpbot", display_name: "wpbot" },
});
assert.equal(embedded?.displayName, "wpbot");
assert.equal(embedded?.username, "wpbot");
assert.equal(embedded?.avatarUrl, null);
assert.equal(readEmbeddedBot({ bot_id: "bot-1", bot: [{ id: "bot-1", username: "wpbot", display_name: "Helper" }] })?.displayName, "Helper");

const wpbot = { id: "bot-1", username: "wpbot", displayName: "wpbot", avatarUrl: null as string | null };
assert.equal(authorForBot(wpbot, owner).displayName, "wpbot");
assert.equal(authorForBot(wpbot, regularAdmin).displayName, "");
assert.equal(authorForBot(wpbot, regularAdmin).username, "");
assert.equal(authorForBot({ ...wpbot, avatarUrl: "https://example.com/bot.png" }, owner).avatarUrl, "https://example.com/bot.png");

const reply = {
  userId: "owner-1",
  botId: "bot-1",
  author: { displayName: "", username: "", avatarUrl: null },
};
assert.equal(isOwnChatMessage(reply, "owner-1"), false);
assert.equal(isOwnChatMessage({ userId: "owner-1", botId: null }, "owner-1"), true);
assert.equal(isOwnChatMessage({ userId: "other", botId: null }, "owner-1"), false);

const bots = new Map([[wpbot.id, wpbot]]);
const shown = withBotAuthor(reply, bots, owner);
assert.equal(shown.author?.displayName, "wpbot");
assert.equal(shown.author?.username, "wpbot");
assert.equal(shown.botId, "bot-1");

const hiddenReply = withBotAuthor(
  { ...reply, author: { displayName: "wpbot", username: "wpbot", avatarUrl: null } },
  new Map(),
  regularAdmin,
);
assert.equal(hiddenReply.author?.displayName, "");
assert.equal(hiddenReply.botId, "bot-1");

const human = withBotAuthor(
  { userId: "owner-1", botId: null, author: { displayName: "Arka", username: "arka", avatarUrl: "https://example.com/a.png" } },
  bots,
  owner,
);
assert.equal(human.author?.displayName, "Arka");
assert.equal(human.author?.avatarUrl, "https://example.com/a.png");

console.log("wpbot visibility: pass");
