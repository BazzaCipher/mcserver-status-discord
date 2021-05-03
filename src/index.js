// Dependencies

const env = require('dotenv');
const { createServer } = require('http');
const { Client } = require('discord.js');
const { appendFileSync } = require('fs');
const { resolve } = require('path');

const { log, error } = console;

const resolveLocal = resolve.bind(null, __dirname);

const { getGuildInfo } = require('./guildInfo');
const Commands = require('./commands');

// Configuration files
const config = require('../config/config.json');

// Runtime variables

const commands = new Commands(true);
const client = new Client();

// Function declarations

function exitHandler(err) {
  if (err instanceof Error) error(err);
  else log(`Exiting with code ${err}`);

  client.destroy();
  process.exit();
}

function returnHandler(err, message, channel) {
  if (!channel && !message.channel) {
    return new Error('No channel specified');
  }
  const nchannel = channel || message.channel;

  if (!message) {
    nchannel.send('');
    return new Error('No message');
  }
  if (err) error(`\x1b[31mError ${err}\x1b[0m`);

  nchannel.stopTyping();

  return nchannel.send(message);
}

client.once('ready', () => {
  commands.all();

  log(`\x1b[34;1m${config.name}\x1b[0m is now \x1b[32monline\x1b[0m`);
});
client.once('error', (e) => {
  log(`Client returned error '${e.message}'`);
  process.exit(1);
});

// Every hour

// setInterval(() => {
//     commands.reload()
// }, 3600000)

// client.on("guildCreate", guild => {
//     let channelID;
//     let channels = guild.channels;
//     channelLoop:
//     for (let c of channels) {
//         let channelType = c[1].type;
//         if (channelType === "text") {
//             channelID = c[0];
//             break channelLoop;
//         }
//     }

//     let channel = bot.channels.get(guild.systemChannelID || channelID);
//     channel.send(`Thanks for inviting me into this server!`);
// });

// Init

env.config();

client.on('message', (message) => {
  const { channel, guild, content } = message;
  const args = [message.content.toLowerCase(),
    ...message.content.split(' ').map((e) => e.toLowerCase())];
  const currentCommands = commands.current;

  if (message.author.id === client.user.id) return;

  if (!guild) {
    log(`${new Date().toString()} | @ ${message.author.username} - \x1b[32m${content}\x1b[0m`);

    if (args[2] === 'help') { currentCommands.get('help')(args.slice(0, 3), message, returnHandler); return; }
    if (!args[3]) { currentCommands.get('_')(args, message, returnHandler); return; }

    returnHandler(null, {
      content: 'Add me to your server! ^-^',
      embed: {
        author: {
          name: config.name,
          url: `https://discordapp.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot`,
        },
        title: 'Add me to your server ! ^-^',
        description: 'It\'s just me ;-;',
      },
    }, message.channel);
    return;
  }

  if (args[1] !== getGuildInfo(guild.id).prefix) { return; }
  // Check write permission
  //

  log(`${new Date().toString()} | #${message.channel.name} @ ${guild.id} - \x1b[32m${content}\x1b[0m`);
  appendFileSync(resolveLocal('../logs/error.log'),
    `${new Date().toString()} | #${message.channel.name} @ ${guild.id} - ${content}\r\n`);

  /*
     * Post-filter
    */

  channel.startTyping();
  log('Passing through switch');

  /* ---- */

  let options = {};

  // Remember to pass args, message, and [options]
  log(`Reading from content: ${args}`);
  switch (args[2]) {
    case 'setting':
    case 'settings':
    case 'set': // Both logging and setting
    case 'unset': // Both logging and unsetting
      if (args[2] === 'unset') options.unset = true;
      currentCommands.get('set')(args, message, options, returnHandler);
      break;

    case 'help':
    case 'localhost':
    case '127.0.0.1':
    case undefined:
    case '?':
      options = { prefix: getGuildInfo(guild.id).prefix };
      currentCommands.get('help')(args, message, options, returnHandler);
      break;

    default:
      // Special case, modifies message post-send
      currentCommands.get('_')(args, message, options, returnHandler);
      break;
  }
});

// Exit handling

// CTRL-C
process.on('SIGINT', exitHandler);

// KILLALL
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);

// UNCAUGHTEXCEPTION
process.on('uncaughtException', exitHandler);

// Post handling

createServer((_, res) => res.end('ok'))
  .listen(process.env.PORT || 3000);

client.login(process.env.CLIENT_TOKEN);
