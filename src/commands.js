/**
 * Command class which determines the commands and returns an appropriate Map
 */

const { resolve } = require('path');
const { readdirSync } = require('fs');
const requireDir = require('require-dir');
const { getGuildInfo } = require('./guildInfo');
const commands = require('../commands');

function reload() {
  const root = resolve(__dirname, '../commands/');
  const subCommands = new Map();
  const folders = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory());

  // Load index
  subCommands.set('_', commands);

  Object.keys(folders).forEach((folder) => {
    const obj = requireDir(resolve('../commands', folder.name), {
      noCache: true,
      recurse: true,
    });

    subCommands.set(folder.name, obj.index || {
      _: ((args, message, opts, cb) => {
      // Default unimplemented error function which will be the fallback
      // as defined and used in index.js
        const { content, embed, prefix } = opts;

        cb({
          content: content || `*'${args[2]}' is unimplemented*`,
          embed: embed || {
            color: 0xFFD500,
            title: `Error: Couldn't find command '*${args[2]}*'`,
            footer: {
              text: `'*${prefix || getGuildInfo('').prefix} help <command>*'`,
            },
          },
        });
      }),
    });
  });

  return subCommands;
}

function all() {
  return reload();
}

module.exports = {
  all,
};
