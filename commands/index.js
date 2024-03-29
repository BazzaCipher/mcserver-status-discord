/**
 * This is the primary function of this bot.
 *
 * Accepts hostname or ip and returns the status of the server
 */

const stringify = require('json-stringify-safe');
const { readFileSync, appendFileSync } = require('fs');
const { pingWithPromise } = require('minecraft-ping-js');
const { get } = require('https');
const { MessageEmbed } = require('discord.js');
const { resolve } = require('path');

const { log, error } = console;

const resolveLocal = resolve.bind(null, __dirname);

const endpoint = 'https://api.mcsrvstat.us/2/';

async function getLatencyTo(opts) {
  const PING_COUNT = 20;
  const pings = [];

  for (let i = 0; i < PING_COUNT; i += 1) {
    pings.push(pingWithPromise(opts.address || opts.ip, opts.port || 25565));
  }

  const values = await Promise.all(pings);
  return (values.reduce((acc, curr) => acc + curr.ping, 0) / PING_COUNT).toFixed(1);
}

async function formatNotFound(object, newMessage) {
  const embed = newMessage.embeds[0];
  embed
    .setAuthor(`${embed.title} | Offline`, 'attachment://red-circle.png')
    .setColor(14493440)
    .setTitle('Server unresponsive')
    .setDescription(`Tested **${object.hostname || object.ip}** : ${object.port}`);

  newMessage.files.push({
    name: 'red-circle.png',
    attachment: readFileSync(resolveLocal('../files/red-circle.png')),
  });

  return newMessage;
}

async function formatFound(object, newMessage) {
  const embed = newMessage.embeds[0]; // Most messages only have one embed

  embed
    .setAuthor(`${embed.title}  |  Online`, 'attachment://green-circle.png')
    .setColor(56688)
    .setTitle(object.motd.clean.join('\r\n'))
    .setDescription(object.version)
    .addField('Players', `**${object.players.online}**/${object.players.max} (${
      (100 * (object.players.online / object.players.max)).toFixed(2)}%)`, true);

  newMessage.files.push({
    name: 'green-circle.png',
    attachment: readFileSync(resolveLocal('../files/green-circle.png')),
  });

  if (object.software) embed.addField('Software', object.software);

  embed.addField('Latency', `${await getLatencyTo({
    address: object.hostname || object.ip,
    port: object.port,
  })} ms`, true);

  return newMessage;
}

// Attempts to create a base object from the one received from remote
async function formatMain(object, newMessage) {
  const embed = newMessage.embeds.shift() || new MessageEmbed(); // Make sure it is initialized

  embed
    .setTitle(`${object.hostname || object.ip}${object.port === 25565 ? '' : `:${object.port}`}`)
    .setFooter('Courtesy of https://mcsrvstat.us/',
      'https://mcsrvstat.us/img/minecraft.png');

  // Reattach embed to new message Object
  newMessage.embeds.unshift(embed);

  // Two functions which just use different colours and formattings
  if (object.online) {
    return formatFound(object, newMessage);
  }
  return formatNotFound(object, newMessage);
}

/**
 * All this does is print a rich embed of the status of the specified minecraft server.
 * It serves as the entry point of this file and is the only thing 'exposed'.
 * @param {array} messageArgs - An array of the initial arguments; go to src/index.js for info
 * @param {object} message - Discord.js message
 * @param {object} options
 * @param {function} cb
 */
function mcstatus(messageArgs, message, options, cb) {
  const ncb = cb || options; // Shuffle options and callback in case options are not defined
  const { channel, content } = message;

  // Attempts to GET the status of the specified server by appending the two
  get(endpoint + messageArgs[2], (response) => {
    let res = '';

    response.setEncoding('utf8');

    response.on('data', (data) => { res += data; });

    response.on('error', () => {
      ncb(null, 'It seems something has failed on our end :(. We\'re already working on a solution', channel);
      appendFileSync(resolveLocal('../logs/error.log'), new Date().toString()
                + stringify(response, (key, val) => {
                  if (key === 'data') log(val, val instanceof Array);
                  if (key === 'data' && val instanceof Array) return `[${val.join(', ')}]`;
                  return val;
                }, 4));
      error(`\x1b[31mReceived ${response.statusMessage} from '${endpoint}${messageArgs[2]}'\x1b[0m`);
    });

    response.once('end', async () => {
      if (res.startsWith('429')) {
        channel.send(`\`${messageArgs[2]}\` isn't a valid external IP or name`);
        return log(`Rejected \x1b[33m${content}\x1b[0m`);
      }

      let matches;
      const jsonres = JSON.parse(res);
      let sentObject = {
        content: `\`${jsonres.hostname || jsonres.ip}\` is **${jsonres.online ? 'online' : 'offline'}**`,
        embeds: [new MessageEmbed()],
        files: [],
      };

      sentObject = await formatMain(
        jsonres,
        sentObject,
      );

      if (jsonres.icon) {
        matches = jsonres.icon.match(/data:(\w+\/(\w+));base64,(.+)/);
        // [1] MIME-Type [2] Extension [3] Base-64 image data

        sentObject.embeds[0].thumbnail = { url: `attachment://icon.${matches[2]}` };
        sentObject.files.push({
          name: `icon.${matches[2]}`,
          attachment: Buffer.from(matches[3], 'base64'),
        });
      }

      return channel.send(sentObject);
    });
  });
}

module.exports = mcstatus;
