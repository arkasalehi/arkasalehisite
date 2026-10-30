import assert from "node:assert/strict";
import {
  canSeeHiddenBots,
  filterHiddenBots,
  isHiddenBotIdentity,
  redactBotMentions,
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

console.log("wpbot visibility: pass");
