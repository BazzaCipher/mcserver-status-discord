/**
 * Command class which determines the commands and returns an appropriate Map
 */

const { resolve } = require('path')
const { readdirSync } = require('fs')

class Commands {

    /**
     * 
     * @param {boolean} delayLoad - Whether to reload the function immediately
     */
    constructor(delayLoad) {

        if (!delayLoad) this.reload()

    }

    /**
     * reload - Used internally to reload the commands
     */
    reload () {
        const root = resolve(__dirname, '../commands/')
        const subCommands = new Map
        const folders = readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory())
        // Load index
    
        subCommands.set('_', require(resolve(root, 'index.js')))
    
        for (let folder of folders) {
            subCommands.set(folder.name, require(resolve(root, folder.name)))
        }

        return this.current = subCommands
    }

    /**
     * 
     * @param {boolean} noReload - Recheck the available commands
     */
    all (noReload) {
        if (!noReload) this.reload()

        return this.current
    }

}

module.exports = Commands