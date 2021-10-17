/**
 * Dependencies
 */

const env = require('dotenv');
const { createServer } = require('http');
const { Client, Intents, Permissions } = require('discord.js');
const { appendFileSync } = require('fs');
const { resolve } = require('path');

const { log, error } = console;

const resolveLocal = resolve.bind(null, __dirname);

const { getGuildInfo } = require('./guildInfo');
const commands = require('./commands');

// Configuration files
const config = require('../config/config.json');

/**
 * Runtime variables and other initialisations
 */

const intent = new Intents();
intent.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING);

const client = new Client({ intents: [intent] });

// Set up with process environmental variables
env.config();

/**
 * Function declarations
 */

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

client.on('messageCreate', (message) => {
  const { channel, guild, content } = message;
  const args = [message.content.toLowerCase(),
    ...message.content.split(' ').map((e) => e.toLowerCase())];
  const currentCommands = commands.all();

  // Don't respond to myself to myself to myself to myself
  if (message.author.id === client.user.id) return;

  // This is meant to occur in a DM to encourage adoption of this bot in servers
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

  /**
   * Post-init of listener
   */
  // If the prefix is not matching
  if (args[1] !== getGuildInfo(guild.id).prefix) { return; }

  // Check write permission
  if (!guild.me.permissionsIn(channel).has(Permissions.FLAGS.SEND_MESSAGES)) {
    log(`Don't have permission to send messages: ${guild.name}`);
  }

  log(`${new Date().toString()} | #${message.channel.name} @ ${guild.id} - \x1b[32m${content}\x1b[0m`);
  appendFileSync(resolveLocal('../logs/error.log'),
    `${new Date().toString()} | #${message.channel.name} @ ${guild.id} - ${content}\r\n`);

  /**
   * Post-filter
   * The rest is executing the command specified in the message content
   */

  channel.sendTyping();

  /* ---- */

  let options = {};

  /* ---- */

  // Always make sure that it's a valid URl.
  if (/[A-Za-z0-9.]\.[A-Za-z0-9.]/g.test(args[2])) {
    // Special case, modifies message post-send
    currentCommands.get('_')(args, message, options, returnHandler);
    return;
  }

  // Remember to pass args (cleaned message content), message, and [options]
  log(`Reading from content: ${args.join(', ')}`);
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
    default: // Should be an edge case when nothing they type makes sense
      options = { prefix: getGuildInfo(guild.id).prefix };
      currentCommands.get('help')(args, message, options, returnHandler);
      break;
  }
});

/**
 * Exit handling
 */

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

client.login(process.env.CLIENT_TOKEN)
  .catch((err) => {
    error('\x1b[31;1mCould not log in successfully. Exiting...\x1b[0m');
    error(err);
    error("Suggestion: set the environmental variable 'CLIENT_TOKEN' to the token provided by Discord Inc.");
    process.exit(1);
  });
