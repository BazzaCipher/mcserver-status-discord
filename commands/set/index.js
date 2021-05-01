/**
 * The 'set' command. Sets settings and creates them from default
 * The 'unset' command. Removes settings and sets them to default
 *
 * It creates the default configuration entry.
 * It handles the statements 'mcstatus set <subcommand> <arguments>'
 *
 * Remember to modify the ./commands/set/deps.js isValid and coerceInput
 * switch statements, as well as the dependencies in guildinfo.json
 */

/**
 *
 * @param {array} messageArgs - Arguments from the message. Use this instead
 * @param {Message} message - Discord.Message object
 * @param {object} options - The options object
 * @param {boolean} options.unset - Whether or not to unset the specified setting
 */

const { resolve } = require('path');
const moment = require('moment');

const resolveLocal = resolve.bind(null, __dirname);

const {
  isValid, coerceInput, revertCamelcase, closestSetting,
} = require(resolveLocal('./dep.js'));
const { getGuildInfo, writeGuildInfo } = require(resolveLocal('../../files/GuildInfo.js'));

const help = function (messageArgs, message, opts, cb) {
  if (!opts.embed) { opts.embed = {}; }

  return cb(null, {
    content: 'Use set to set the settings for this bot',
    embed: {
      title: 'Help | Set',
      description: 'Set the right setting',
      footer: {
        text: `'${messageArgs[1]} settings' shows you the settings`,
      },
      color: opts.embed.color,
    },
  }, message.channel);
};

const display = function (messageArgs, message, opts, cb) {
  const { guild, channel } = message;
  const { setting, info } = opts;

  if (setting) {
    if (info.hasOwnProperty(setting)) {
      return cb(null, {
        content: `Settings | ${setting} | **${info[setting]}**`,
        embed: {
          title: `*${messageArgs.slice(3).join(' ')}*`,
          description: 'Settings',
          color: opts.embed.color,
          fields: [{
            name: info[setting],
          }],
        },
      }, channel);
    }

    cb(null, {
      content: `It seems like '${setting}' isn't valid`,
      embed: {
        title: `It seems like '${setting}' can't be found`,
      },
    }, channel);

    opts.setting = null;
    display(messageArgs, message, opts, cb);
  }

  const sentObject = {
    content: 'All of the modifiable settings',
    embed: {
      title: `*${guild.name}* | Settings`,
      description: 'All the settings, one by one',
      timestamp: moment().utcOffset(info.utcOffset),
      fields: [],
    },
  };

  for (const e in info) {
    sentObject.embed.fields.push({
      name: revertCamelcase(e),
      value: info[e],
      inline: true,
    });
  }

  return cb(null, sentObject, channel);
};

const set = function (messageArgs, message, opts, cb) {
  // Don't forget to eventually add Object.assign

  // if (message.author.client) // Set adequate permission matching
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  const { channel } = message;
  const { id } = message.guild;
  const info = getGuildInfo(id);
  const noValScore = closestSetting(info, messageArgs.slice(3, -1).join(' '), 0, true);
  const withValScore = closestSetting(info, messageArgs.slice(3).join(' '), 0, true);
  let closest;
  let prop;
  let val;
  let coercedVal;
  let output;
  if (withValScore > noValScore) {
    prop = messageArgs.slice(3).join(' ');
    closest = closestSetting(info, prop);
    val = null;
  } else {
    prop = messageArgs.slice(3, -1).join(' ');
    closest = closestSetting(info, prop);
    val = messageArgs.slice(-1).join(' ');
  }

  if (!closest) {
    opts.info = info;
    return display(...arguments);
  }

  if (opts.hasOwnProperty('content') || !val) return help(...arguments);

  if (!isValid(closest, val)) {
    return cb(null, {
      content: `'${val}' isn't valid`,
      embed: {
        title: `${revertCamelcase(closest)}`,
        description: 'Invalid value',
      },
    }, channel);
  }

  coercedVal = coerceInput(closest, val);

  if (info[closest] === coercedVal) {
    return cb(null, {
      content: `'${val}' is identical to the current value`,
      embed: {
        title: revertCamelcase(closest),
        description: 'Tell me if...',
        fields: [
          {
            name: '*This is equal to*',
            value: info[closest],
            inline: true,
          },
          {
            name: '**This**',
            value: coercedVal,
            inline: true,
          },
        ],
      },
    }, channel);
  }

  if (opts.unset) {
    coercedVal = getGuildInfo('_default')[closest];
  }

  const temp = info[closest]; // Temporary variable
  output = writeGuildInfo(id, closest, coercedVal);
  info[closest] = temp;

  if (output instanceof Error) {
    if (!(output instanceof Error)) { output = null; } // Mute client-side input errors
    cb(output, {
      content: opts.content || 'The setting is *unchanged*',
      embed: {
        title: revertCamelcase(closest),
        fields: [
          {
            name: '*Current*',
            value: info[closest],
            inline: true,
          },
          {
            name: '**Desired**',
            value: coercedVal,
            inline: true,
          },
        ],
      },
    }, channel);
  } else {
    cb(null, {
      content: 'The setting changed successfully',
      embed: {
        title: revertCamelcase(closest),
        fields: [
          {
            name: '*Previous*',
            value: info[closest],
            inline: true,
          },
          {
            name: '**Current**',
            value: coercedVal,
            inline: true,
          },
        ],
      },
    }, channel);
  }
};

module.exports = set;
