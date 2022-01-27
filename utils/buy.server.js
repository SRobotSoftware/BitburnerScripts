import UtilsCore from 'utils/utils.core.js'

/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
export async function main(ns) {
    const config = {
        global: {
        },
        prog: {
            name: 'Buy Server',
            cycleTime: 0,
            cycleLimit: 1,
            host: ns.getHostname(),
            cycleCount: 0,
            status: true,
        },
    }
    const utils = new UtilsCore(ns, config)
    const maximumRAM = ns.getPurchasedServerMaxRam()
    let ram = maximumRAM
    let cost = ns.getPurchasedServerCost(ram)
    const money = ns.getServerMoneyAvailable('home')
    const homeRAM = ns.getServerMaxRam('home')
    const oldServers = ns.getPurchasedServers()
    const largestRAM = oldServers
        .map(x => ns.getServerMaxRam(x))
        .sort()
        .reverse()[0] || 1
    while (cost > money && ram > homeRAM * 2 && ram > largestRAM * 2) {
        ram /= 2
        cost = ns.getPurchasedServerCost(ram)
    }
    const append = ram === maximumRAM ? '' : `
    ---
    Next RAM: ${utils.formatBytes(ram * 2)}
    Next Cost: ${utils.formatCost(cost * 2)} (${utils.formatPercent(money / (cost * 2))})`
    utils.tlog(`
    Home RAM: ${utils.formatBytes(homeRAM)}
    Owned RAM: ${utils.formatBytes(largestRAM)}
    Purchase RAM: ${utils.formatBytes(ram)}
    Cost: ${utils.formatCost(cost)} (${utils.formatPercent(money / cost)})${append}`)
    if (cost < money && await ns.prompt('Purchase Server?')) {
        const target = ns.purchaseServer('cepha', ram)
        // if (target === '') return null
        // if (oldServers.length === 0) ns.scriptKill('manager_threaded.ns', 'home')
        // else oldServers.forEach(x => {
        //     ns.killall(x)
        //     ns.deleteServer(x)
        // })
        // await ns.scp('manager_threaded.ns', 'home', target)
        // await ns.scp('threaded_hack.ns', 'home', target)
        // await ns.scp('threaded_grow.ns', 'home', target)
        // await ns.scp('threaded_weaken.ns', 'home', target)
        // ns.exec('manager_threaded.ns', target, 1)
        // ns.tail('manager_threaded.ns', target)
    }
}