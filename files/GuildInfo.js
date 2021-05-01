/**
 * A simple read-write guildinfo thing. May expand into a MySQL or SQLite DB
 */

const { writeFileSync } = require('fs');
const { resolve } = require('path');

const path = resolve(__dirname, '../config/guildinfo.json');

const getGuildInfo = function (guildid = true) {
  const guildInfo = require(path);

  if (guildid === true) { return guildInfo; }

  return !guildInfo[guildid] ? guildInfo._default : guildInfo[guildid];
};

const writeGuildInfo = function (guildid, property, value = '') {
  const info = getGuildInfo(true);

  if (!property) return new Error('Property cannot be undefined');
  if (!info._default[property]) return new Error(`Property '${property}' doesn't exist`);

  info[guildid] = getGuildInfo(guildid);
  info[guildid][property] = value;

  writeFileSync(path, JSON.stringify(info, null, 4), 'utf8');

  console.log(`For guild \x1b[32m'${guildid}'\x1b[0m, writing '${value}' to '${property}'`);

  return path;
};

module.exports = {
  getGuildInfo,
  writeGuildInfo,
};
