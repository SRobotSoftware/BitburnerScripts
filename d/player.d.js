import UtilsCore from 'utils/utils.core.js'

class Daemon {
    constructor(script, args = {}, host = 'home', threads = 1) {
        this.script = script
        this.args = args
        this.host = host
        this.threads = threads
    }
    pid = 0
    get sargs() {
        return JSON.stringify(this.args)
    }
}

/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
export async function main(ns) {
    /******************************************************************************************************
     * Configuration                                                                                      *
     * -------------------------------------------------------------------------------------------------- *
     *       name:  The name of your program, used in toasts and logs                                     *
     *  cycleTime:  Measured in ms, the game UI updates every second so lower than 1000 may not be useful *
     *              Note that the actual cycle will likely be slightly longer due to async functions      *
     *              This is just how long to wait before starting the next call to main()                 *
     * cycleLimit:  Set to 0 for no limit                                                                 *
     *                                                                                                    *
     * Place custom global vars in config.global to avoid cluttering the prog object                      *
     ******************************************************************************************************/
    const config = {
        global: {
            daemons: new Map()
        },
        prog: {
            name: 'Player Daemon',
            cycleTime: 0,
            cycleLimit: 1,
            host: ns.getHostname(),
            cycleCount: 0,
            status: true,
        },
    }

    const utils = new UtilsCore(ns, config)

    /*****************************************
     * Initialization - Runs once on startup *
     *****************************************/
    const init = async () => {
        ns.disableLog('ALL')
        ns.clearLog()
        ns.tail()
        const startupMsg = `${config.prog.name} has started`
        ns.toast(startupMsg)
        utils.log(startupMsg)

        config.global.daemons.set('network.d', new Daemon('network.d.js'))
        config.global.daemons.set('hacknet.d', new Daemon('hacknet.d.js')) // needs configuration and cleanup
        config.global.daemons.set('hack.d', new Daemon('threaded.hack.d.js'))
        // config.global.daemons.get('hack.d').values().sargs = JSON.stringify({ lowRamMode: true })
    }

    /*********************************************
     * Teardown - Note that this cannot be async *
     *********************************************/
    const teardown = (unexpected = false) => {
        const shutDownMsg = `${config.prog.name} has shut down${unexpected ? ' unexpectedly' : ''}`
        ns.toast(shutDownMsg, unexpected ? 'error' : 'warning')
        utils.log(shutDownMsg)
    }

    ns.atExit(() => teardown(true))

    /********
     * Main *
     ********/
    const program = async () => {
        // player.d starts up and monitors a collection of other daemons
        // All player.d managed daemons should accept a single argument as a JSON string
        for (const d of config.global.daemons.values()) {
            let isRunning = ns.getRunningScript(d.script, d.host, d.sargs)
            if (isRunning === null) {
                d.pid = (d.host === config.prog.host) ? ns.run(d.script, d.threads, d.sargs) : ns.exec(d.script, d.host, d.threads, d.sargs)
            } else d.pid = isRunning.pid

            utils.log(`${d.script} ${d.host}:${d.pid} ${d.sargs}`)
        }
    }

    /***************************************************************************************************
     * Execution - Do not make changes here, instead make changes in setup(), program() and teardown() *
     ***************************************************************************************************/
    // I use a generator function to try and keep things clean with async/await
    // Also generators are just neat
    const cycleGen = async function* () {
        while (config.prog.status)
            yield ++config.prog.cycleCount
    }

    await init()
    // cycleCount here is wasted as you can get it from config
    // but for-of is the cleanest way to iterate our generator
    for await (const cycleCount of cycleGen()) {
        await program()
        config.prog.status = config.prog.cycleLimit > 0 ? config.prog.cycleCount < config.prog.cycleLimit : true
        await ns.asleep(config.prog.cycleTime)
    }
    teardown()
    ns.atExit(() => {})
}