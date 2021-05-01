// Dependencies

const { Client } = require('discord.js');
const { appendFileSync } = require('fs');
const { resolve } = require('path');

const resolveLocal = resolve.bind(null, __dirname);

const { getGuildInfo } = require(resolveLocal('./files/GuildInfo.js'));
const Commands = require(resolveLocal('./files/Commands.js'));

// Configuration files
const config = require(resolveLocal('./config/config.json'));

// Runtime variables

const commands = new Commands(true);
const client = new Client();

// Function declarations

const exitHandler = function (err) {
  if (err instanceof Error) console.error(err);
  else console.log(`Exiting with code ${err}`);

  client.destroy();
  process.exit();
};

const returnHandler = function (err, message, channel) {
  if (!process.argv.includes('-v') || !process.argv.includes('--verbose')) { message.content = null; }

  if (!channel && !message.channel) {
    return new Error('No channel specified');
  }
  channel = channel || message.channel;

  if (!message) return channel.send('');
  if (err) console.error(`\x1b[31mError ${err}\x1b[0m`);

  channel.stopTyping();

  return channel.send(message);
};

client.once('ready', () => {
  commands.all();

  console.log(`\x1b[34;1m${config.name}\x1b[0m is now \x1b[32monline\x1b[0m`);
});
client.once('error', (e) => {
  console.log(`Client returned error '${error.message}'`);
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

client.on('message', (message) => {
  const { guild, content } = message;
  const args = [message.content.toLowerCase(),
    ...message.content.split(' ').map((e) => e.toLowerCase())];
  const currentCommands = commands.current;

  if (message.author.id === client.user.id) return;

  if (!guild) {
    console.log(`${new Date().toString()} | @ ${message.author.username} - \x1b[32m${content}\x1b[0m`);

    if (args[2] === 'help') { return currentCommands.get('help')(args.slice(0, 3), message, returnHandler); }
    if (!args[3]) { return currentCommands.get('_')(args, message, returnHandler); }

    return returnHandler(null, {
      content: 'Add me to your server! ^-^',
      embed: {
        author: {
          name: config.name,
          url: `https://discordapp.com/oauth2/authorize?client_id=${config.id}&scope=bot`,
        },
        title: 'Add me to your server ! ^-^',
        description: 'It\'s just me ;-;',
      },
    }, message.channel);
  }

  if (args[1] !== getGuildInfo(guild.id).prefix) { return; }
  // Check write permission
  //

  console.log(`${new Date().toString()} | #${message.channel.name} @ ${guild.id} - \x1b[32m${content}\x1b[0m`);
  appendFileSync(resolveLocal('./logs/error.log'),
    `${new Date().toString()} | #${message.channel.name} @ ${guild.id} - ${content}\r\n`);

  /*
     * Post-filter
    */

  // channel.startTyping()
  console.log('Passing through switch');

  /* ---- */

  let options = {};

  // Remember to pass args, message, and [options]
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

client.login(config.token);
