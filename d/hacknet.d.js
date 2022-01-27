import UtilsCore from 'utils/utils.core.js'

// THIS NEEDS SO MUCH CLEANUP WOW

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
            hn: {
                current: {},
                desired: {
                    nodes: -1,
                    level: -1,
                    ram: -1,
                    cores: -1,
                },
            },
        },
        prog: {
            name: 'Hacknet Daemon',
            cycleTime: 10,
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

        const hnMaximums = {
            nodes: 100,
            level: 200,
            ram: 64,
            cores: 16,
        }

        Object.assign(config.global.hn.desired, hnMaximums, JSON.parse(ns.args?.[0] || '{}'))
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
     const findCheapestUpgradeIndexAndCost = (network, param, upgradeCostMethod, currentFunds) => {
        const foo = network
            .filter(x => x[param] < config.global.hn.desired[param])
            .map(x => {
                const reg = new RegExp(/hacknet-node-(\d+)/)
                const index = reg.exec(x.name)[1]
                const result = {
                    index,
                    val: upgradeCostMethod(index, 1),
                }
                return result
            })
            .reduce((p, c) => (c.val < p[1]) ? [c.index, c.val] : p, [-1, currentFunds])
        return (foo[0] < 0) ? { cost: -1, index: -1 } : { cost: foo[1], index: foo[0] }
    }
    
    const process = () => {
        const network = utils.hn.getNetwork()
        const money = utils.getCurrentFunds()
        const nodePurchaseCost = ns.hacknet.getPurchaseNodeCost()
        const nodePurchasable = (nodePurchaseCost >= money || network.length >= config.global.hn.desired.nodes) ? -1 : nodePurchaseCost
        const prices = [
            { param: 'nodes', cost: nodePurchasable, purchaseMethod: ns.hacknet.purchaseNode },
            { param: 'level', ...findCheapestUpgradeIndexAndCost(network, 'level', ns.hacknet.getLevelUpgradeCost, money), purchaseMethod: ns.hacknet.upgradeLevel },
            { param: 'ram', ...findCheapestUpgradeIndexAndCost(network, 'ram', ns.hacknet.getRamUpgradeCost, money), purchaseMethod: ns.hacknet.upgradeRam },
            { param: 'cores', ...findCheapestUpgradeIndexAndCost(network, 'cores', ns.hacknet.getCoreUpgradeCost, money), purchaseMethod: ns.hacknet.upgradeCore },
        ]
            .filter(x => x.cost > 0)
            .sort((a,b) => a.cost - b.cost)
        if (prices.length) {
            // we can purchase something!
            const cheapestUpgrade = prices[0]
            if (cheapestUpgrade.param === 'nodes') cheapestUpgrade.purchaseMethod()
            else cheapestUpgrade.purchaseMethod(cheapestUpgrade.index, 1)
        }
    }
    const getCurrentStatusStr = net => net.reduce((p, c, i) => `${p}
    Node: ${utils.leftPad(i, 3)}  Level: ${utils.leftPad(c.level, 3)}  RAM: ${utils.leftPad(c.ram, 2)}  Cores: ${utils.leftPad(c.cores, 2)}`, '')

    const printStatus = (net, config) => {
        ns.clearLog()
        ns.print(`Desired Hacknet:
    Node: ${utils.leftPad(config.nodes, 3)}  Level: ${utils.leftPad(config.level, 3)}  RAM: ${utils.leftPad(config.ram, 2)}  Cores: ${utils.leftPad(config.cores, 2)}`)
        ns.print(`Current Hacknet:${getCurrentStatusStr(net)}`)
    }

    const program = async () => {
        process()
        printStatus(utils.hn.getNetwork(), config.global.hn.desired)
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