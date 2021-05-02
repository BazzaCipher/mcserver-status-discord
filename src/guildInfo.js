/**
 * A simple read-write guildinfo thing. May expand into a MySQL or SQLite DB
 */

const { writeFileSync, readFileSync } = require('fs');
const { resolve } = require('path');

const guildInfoPath = resolve(__dirname, '../config/guildInfo.json');

function getGuildInfo(guildid = true) {
  const guildInfo = JSON.parse(readFileSync(guildInfoPath));

  if (guildid === true) { return guildInfo; }

  return !guildInfo[guildid] ? guildInfo[''] : guildInfo[guildid];
}

function writeGuildInfo(guildid, property, value = '') {
  const info = getGuildInfo(true);

  if (!property) return new Error('Property cannot be undefined');
  if (!info[''][property]) return new Error(`Property '${property}' doesn't exist`);

  info[guildid] = getGuildInfo(guildid);
  info[guildid][property] = value;

  writeFileSync(guildInfoPath, JSON.stringify(info, null, 4), 'utf8');

  console.log(`For guild \x1b[32m'${guildid}'\x1b[0m, writing '${value}' to '${property}'`);

  return guildInfoPath;
}

module.exports = {
  getGuildInfo,
  writeGuildInfo,
};
