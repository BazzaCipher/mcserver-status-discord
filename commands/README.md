# Layout of the ./command directory

## Root

At the root of the folders is an index.js file. This is the entry point which
each package/subcommand should strive to keep consistent, typesafe and secure.
At the root of the command folder is a file which is the actual function of the bot.
of this bot. Each subcommand can be located in a subdirectory and the package.json
'main' property points to that provider. Only the top-level directories need to be
defined/accessed. Command descriptions should be updated in `commandDesc.json`.

### Further division

Every subcommand can be further divided into other commands **IF** it manages
its own file hierarchy.

```
| <subcommand>/
| index.js
| package.json
| [further dependencies]
```

## Arguments

Passed to each command are four things: `messageArgs`, `message`, [`options`] and
`callback`. The callback receives three properties, `error`, 
`message<Embed|String>` and `channel`. 

The `options` property can contain `embed` and `content` properties or any
self-defined properties.

The callback accepts three arguments: error, MessageEmbed and channel. The error
should be of type `Error`.

```
{
    messageArgs: [
        'mcstatus help', // The result of message.content
        'mcstatus',
        'help'
    ],
    message: new Discord.Message()
}
```

## Accepted format

```
{
    content: `Simple string, unlimited character length`,
    embed: {
        
    }
}
```

### Help

More information may be found in the header of each file.