/**
 * The 'help' command for the bot. This is purely informational. Assuming that
 * they ask with no subcommand, there is only one case. The description of the
 * package.json of the command is output.
 *
 * However, if there is a subcommand, this command will search for that command
 * and invoke the equivalent of 'mcstatus <command> help'. Essentially, the
 * first argument will be help.
 *
 * mcstatus help command            === mcstatus command help
 * mcstatus help command subcommand === mcstatus command subcommand help
 *
 * The equivalent of 'man'
 */

const commands = require('../../src/commands');
const commandsDesc = require('../../config/commandDesc.json');
const { getGuildInfo } = require('../../src/guildInfo');

function selfArgs(_, message, sentObject, cb) {
  const resObject = sentObject;

  resObject.embed.description = commandsDesc.help;

  if (typeof sentObject === 'function') return sentObject(null, resObject, message.channel);
  return cb(null, resObject, message.channel);
}

function noArgs(_, message, sentObject, cb) {
  const commandReturns = [];
  const helpCommands = commands.all();
  const resObject = sentObject;
  // Ignore special case
  helpCommands.delete('_');

  if (typeof resObject.embed.fields !== 'object') resObject.embed.fields = [];

  resObject.embed.fields.push({
    name: '\'mcstatus < url | ip >\'',
    value: '\'mcstatus mc.hypixel.net\' or \'mcstatus 127.0.0.1:30\'',
  });

  Array.from(helpCommands.keys()).forEach((key) => {
    commandReturns.push(new Promise((resolve) => {
      resolve({
        name: `${key}`,
        value: commandsDesc[key],
      });
    }));
  });

  Promise.all(commandReturns)
    .then((fieldObjects) => {
      fieldObjects.forEach(obj => sentObject.embed.fields.push(obj));

      cb(null, sentObject, message.channel);
    });
}

function otherArgs(messageArgs, message, prototype, cb) {
  if (!commands.all().has(messageArgs[3])) {
    return noArgs(
      ['mcstatus help', 'mcstatus', 'help'], message, prototype, cb,
    );
  }

  const func = commands.all().get(messageArgs[3]);

  return func(messageArgs, message, prototype, cb);
}

function help(args, message, opts, cb) {
  const { content, embed, prefix } = opts;
  const nPrefix = prefix || getGuildInfo('').prefix;
  const ncb = cb || opts;

  const prototype = {
    content: content || `*'${nPrefix} <\\*ip or name\\*>' tells you if that Minecraft server is up*`,
    embed: embed || {
      color: 0xFFD500,
      title: `Help ~ ${args.slice(3).join(' ') || 'All'}`,
      footer: {
        text: `'*${nPrefix} help <command>*'`,
      },
    },
  };

  // Each manages their own output; the cb is the returnHandler in ./index.js
  if (args[3] === 'help') {
    selfArgs(args, message, prototype, ncb);
  } else if (!args[3]) {
    noArgs(args, message, prototype, ncb);
  } else {
    otherArgs(args, message, prototype, ncb);
  }
}

module.exports = help;
