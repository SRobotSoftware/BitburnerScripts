import UtilsCore from 'utils/utils.core.js'
import UtilsNetwork from 'utils/utils.network.js'

/** @param {NS} ns **/
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
            script: 'payloads/share.payload.js'
        },
        prog: {
            name: 'Share Daemon',
            cycleTime: 1000,
            cycleLimit: 0,
            host: ns.getHostname(),
            cycleCount: 0,
            status: true,
        },
    }

    const utils = new UtilsCore(ns, config)
    const utilsN = new UtilsNetwork(ns, config)

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
        const availableServers = ns.getPurchasedServerLimit() - ns.getPurchasedServers().length
        if (availableServers === 0) return config.prog.status = false
        const money = ns.getServerMoneyAvailable('home')
        let ram = ns.getPurchasedServerMaxRam()
        // while (ns.getPurchasedServerCost(ram) > money) ram/=2
        if (money < ns.getPurchasedServerCost(ram)) return;
        const server = ns.purchaseServer('Cepha', ram)
        
        if (server === '') return config.prog.status = false

        await ns.scp(config.global.script, server)

        const availableRAM = ns.getServerMaxRam(server)
        const cost = ns.getScriptRam(config.global.script)
        let threads = 1
        while (cost * threads < availableRAM) threads++
        ns.exec(config.global.script, server, threads)
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
        if (config.prog.status) config.prog.status = config.prog.cycleLimit > 0 ? config.prog.cycleCount < config.prog.cycleLimit : true
        await ns.asleep(config.prog.cycleTime)
    }
    teardown()
    ns.atExit(() => {})
}