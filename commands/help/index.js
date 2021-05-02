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

const { resolve } = require('path');

const resolveLocal = resolve.bind(null, __dirname);

const Commands = require('../../src/commands');

const commands = new Commands();
const commandsDesc = require('../../config/commandDesc.json');

function selfArgs(_, message, sentObject, cb) {
  sentObject.embed.description = commandsDesc.help;

  if (typeof sentObject === 'function') return sentObject(null, sentObject, message.channel);
  return cb(null, sentObject, message.channel);
}

function noArgs(_, message, sentObject, cb) {
  const commandReturns = [];
  const helpCommands = commands.all();
  // Ignore special case
  helpCommands.delete('_');

  if (typeof sentObject.embed.fields !== 'object') sentObject.embed.fields = [];

  sentObject.embed.fields.push({
    name: '\'mcstatus <url | ip>\'',
    value: '\'mcstatus mc.hypixel.net\' or \'mcstatus 127.0.0.1:30\'',
  });

  for (const key of helpCommands.keys()) {
    commandReturns.push((() => new Promise((resolve) => resolve({
      name: `${key}`,
      value: commandsDesc[key],
    }))
    )());
  }

  Promise.all(commandReturns)
    .then((fieldObjects) => {
      for (const fieldObject of fieldObjects) { sentObject.embed.fields.push(fieldObject); }

      cb(null, sentObject, message.channel);
    });
}

function otherArgs(messageArgs, message, prototype, cb) {
  if (!commands.current.has(messageArgs[3])) {
    return noArgs(
      ['mcstatus help', 'mcstatus', 'help'], message, prototype, cb,
    );
  }

  const func = commands.current.get(messageArgs[3]);

  return func(...arguments);
}

function help(args, message, { content, embed, prefix }, cb) {
  if (typeof arguments[2] === 'function') cb = arguments[2];
  if (!prefix) prefix = require('../../config/guildInfo.json')[''].prefix;

  const prototype = {
    content: content || `*'${prefix} <\\*ip or name\\*>' tells you if that Minecraft server is up*`,
    embed: embed || {
      color: 0xFFD500,
      title: `Help ~ ${args.slice(3).join(' ')}`,
      footer: {
        text: `'*${prefix} help <command>*'`,
      },
    },
  };

  // Each manages their own output; the cb is the returnHandler in ./index.js
  if (args[3] === 'help') {
    selfArgs(args, message, prototype, cb);
  } else if (!args[3]) {
    noArgs(args, message, prototype, cb);
  } else {
    otherArgs(args, message, prototype, cb);
  }
}

module.exports = help;
