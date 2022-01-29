import UtilsCore from 'utils/utils.core.js'

/** @param {NS} ns **/
/** @param {import("..").NS} ns */
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
            hashUpgrades: [
                "Sell for Money",
                "Sell for Corporation Funds",
                "Reduce Minimum Security",
                "Increase Maximum Money",
                "Improve Studying",
                "Improve Gym Training",
                "Exchange for Corporation Research",
                "Exchange for Bladeburner Rank",
                "Exchange for Bladeburner SP",
                "Generate Coding Contract",
            ],
        },
        prog: {
            name: 'Hacknet 2.0 Daemon',
            cycleTime: 1000,
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
        while (ns.hacknet.spendHashes('Sell for Money')) {}
        while (ns.hacknet.purchaseNode() >= 0) {}

        const servers = (new Array(ns.hacknet.numNodes()))
            .fill()
            .map((_, i) => ({ i, ...ns.hacknet.getNodeStats(i)}))
        const hashes = {
            capacity: ns.hacknet.hashCapacity(),
            count: ns.hacknet.numHashes().toFixed(2),
            ratio: utils.formatPercent(ns.hacknet.numHashes() / ns.hacknet.hashCapacity()),
            rate: servers.reduce((p, c) => p+=c.production, 0).toFixed(2),
        }

        servers.sort((a, b) => a.cache - b.cache)
        while (servers.some(x => ns.hacknet.upgradeCache(x.i, 1))) {}

        servers.sort((a, b) => a.cores - b.cores)
        while (servers.some(x => ns.hacknet.upgradeCore(x.i, 1))) {}

        servers.sort((a, b) => a.level - b.level)
        while (servers.some(x => ns.hacknet.upgradeLevel(x.i, 1))) {}

        servers.sort((a, b) => a.ram - b.ram)
        while (servers.some(x => ns.hacknet.upgradeRam(x.i, 1))) {}

        servers.sort((a, b) => a.i - b.i)
        servers.forEach(x => {
            delete x.name
            delete x.timeOnline
            delete x.totalProduction
            delete x.ramUsed
        })

        const ttc = Math.ceil(4 / hashes.rate)
        hashes.ttc = utils.formatSec(ttc)
        hashes['$/s'] = utils.formatCost(Math.floor(1e6 / ttc))
        hashes.rate = hashes.rate + '/s'
        
        ns.clearLog()
        const hashesTable = new utils.TableHelper(utils, Object.keys(hashes), 'Hashes')
        hashesTable.data = [Object.keys(hashes).map(x => hashes[x])]
        hashesTable.print()
        
        const serverTable = new utils.TableHelper(utils, Object.keys(servers[0]), 'Hacknet Servers')
        serverTable.data = servers.map(x => Object.keys(x).map(y => {
            if (y === 'production') return x[y].toFixed(3)
            return x[y]
        }))
        serverTable.print()
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

    try {
        await init()
        // cycleCount here is wasted as you can get it from config
        // but for-of is the cleanest way to iterate our generator
        for await (const cycleCount of cycleGen()) {
            await program()
            if (config.prog.status) config.prog.status = config.prog.cycleLimit > 0 ? config.prog.cycleCount < config.prog.cycleLimit : true
            await ns.asleep(config.prog.cycleTime)
        }
        teardown()
    } catch (error) {
        utils.log(error.toString())
        teardown(true)
    } finally {
        ns.atExit(() => {})
        ns.exit()
    }
}