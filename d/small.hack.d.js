import UtilsCore from 'utils/utils.core.js'

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
        },
        prog: {
            name: 'Monothreaded Low-GB Hack',
            cycleTime: 0,
            cycleLimit: 0,
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

        config.global.target = ns.args[0] || 'n00dles'
        config.global.serverMinSec = ns.getServerMinSecurityLevel(config.global.target) + 3
        config.global.serverMaxMoney = ns.getServerMaxMoney(config.global.target)
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
        const target = config.global.target
        while (ns.getServerMoneyAvailable(target) > config.global.serverMaxMoney * 0.1) {
            await ns.hack(target)
        }
        while (ns.getServerSecurityLevel(target) > config.global.serverMinSec) {
            await ns.weaken(target)
        }
        while (ns.getServerMoneyAvailable(target) < config.global.serverMaxMoney) {
            await ns.grow(target)
        }
        while (ns.getServerSecurityLevel(target) > config.global.serverMinSec) {
            await ns.weaken(target)
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