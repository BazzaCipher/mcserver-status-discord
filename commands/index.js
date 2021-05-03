/**
 * This is the primary function of this bot.
 *
 * Accepts hostname or ip
 */

const stringify = require('json-stringify-safe');
const { readFileSync, appendFileSync } = require('fs');
const { ping } = require('tcp-ping');
const { get } = require('https');
const { MessageEmbed } = require('discord.js');
const { resolve } = require('path');

const resolveLocal = resolve.bind(null, __dirname);

const moment = require('moment');

const endpoint = 'https://api.mcsrvstat.us/2/';

function formatNotFound(object, prototypeEmbed) {
  return prototypeEmbed
    .setAuthor(`${prototypeEmbed.title} | Offline`, 'attachment://red-circle.png')
    .setColor(14493440)
    .setTitle('Server unresponsive')
    .setDescription(`Tested **${object.hostname || object.ip}** : ${object.port}`)
    .attachFiles({
      name: 'red-circle.png',
      attachment: readFileSync(resolveLocal('../files/red-circle.png')),
    });
}

function formatFound(object, prototypeEmbed) {
  prototypeEmbed
    .setAuthor(`${prototypeEmbed.title}  |  Online`, 'attachment://green-circle.png')
    .setColor(56688)
    .setTitle(object.motd.clean)
    .attachFiles({
      name: 'green-circle.png',
      attachment: readFileSync(resolveLocal('../files/green-circle.png')),
    })
    .setDescription(object.version)
    .addField('Players', `**${object.players.online}**/${object.players.max} (${
      (100 * (object.players.online / object.players.max)).toFixed(2)}%)`, true)
    .addField('Latency', '...', true);

  if (object.software) prototypeEmbed.addField('Software', object.software);

  return prototypeEmbed;
}

// https://api.mcsrvstat.us/
function formatMain(object, prototypeEmbed = new MessageEmbed()) {
  // Must be able to handle both cases
  if (typeof object !== 'object' || !(prototypeEmbed instanceof MessageEmbed)) {
    console.log('\x1b[31mInternal Server Error: Invalid object or embed\x1b[0m');
    appendFileSync(resolveLocal('../logs/error.log'),
      `${new Date().toString()} | ${stringify(object, null, 4)} && ${stringify(prototypeEmbed, null, 4)}`);
    return { title: 'Whoops! Internal server error' };
  }

  prototypeEmbed
    .setTitle(`${object.hostname || object.ip}${object.port === 25565 ? '' : `:${object.port}`}`)
    .setFooter('Courtesy of https://mcsrvstat.us/',
      'https://mcsrvstat.us/img/minecraft.png');

  if (object.online) {
    return formatFound(object, prototypeEmbed);
  }
  return formatNotFound(object, prototypeEmbed);
}

function mcstatus(messageArgs, message, options, cb) {
  const ncb = cb || options;
  const { channel, content } = message;

  get(endpoint + messageArgs[2], (response) => {
    let res = '';

    response.setEncoding('utf8');

    response.on('data', (data) => { res += data; });

    response.on('error', () => {
      ncb(null, 'It seems something has failed on our end :(. We\'re already working on a solution', channel);
      appendFileSync(resolveLocal('../logs/error.log'), new Date().toString()
                + stringify(response, (key, val) => {
                  if (key === 'data') console.log(val, val instanceof Array);
                  if (key === 'data' && val instanceof Array) return `[${val.join(', ')}]`;
                  return val;
                }, 4));
      console.error(`\x1b[31mReceived ${response.statusMessage} from '${endpoint}${messageArgs[2]}'\x1b[0m`);
    });

    response.once('end', () => {
      if (res.startsWith('429')) {
        channel.send(`\`${messageArgs[2]}\` isn't a valid external IP or name`);
        return console.log(`Rejected \x1b[33m${content}\x1b[0m`);
      }

      let matches;
      const jsonres = JSON.parse(res);
      const sentObject = {};

      sentObject.content = `\`${jsonres.hostname || jsonres.ip}\` is **${jsonres.online ? 'online' : 'offline'}**`;

      sentObject.embed = formatMain(
        jsonres,
        new MessageEmbed({
          timestamp: moment().toISOString(),
          thumbnail: {},
        }),
      );

      if (jsonres.icon) {
        matches = jsonres.icon.match(/data:(\w+\/(\w+));base64,(.+)/);
        // [1] MIME-Type [2] Extension [3] Base-64 image data

        sentObject.embed.thumbnail.url = `attachment://icon.${matches[2]}`;
        sentObject.embed.files.push({
          name: `icon.${matches[2]}`,
          attachment: Buffer.from(matches[3], 'base64'),
        });
      }

      channel.send(sentObject)
        .then((lastMessage) => {
          if (!jsonres.online) return;

          // Edit to show latency
          ping({
            address: jsonres.hostname || jsonres.ip,
            port: jsonres.port,
            attempts: 20,
          }, (err, data) => {
            if (err) throw new Error(`Error when pinging ${jsonres.hostname || jsonres.ip}`);
            lastMessage.embeds[0].fields.splice(
              lastMessage.embeds[0].fields.findIndex((e) => e.name.toLowerCase() === 'latency'),
              1,
              {
                name: 'Latency',
                value: data.avg,
                inline: true,
              },
            );
          });
        })
        .finally(() => { channel.stopTyping(); });
    });
  });
}

module.exports = mcstatus;
