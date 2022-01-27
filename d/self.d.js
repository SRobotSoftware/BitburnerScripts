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
            factions: [
                { name: 'CyberSec', server: 'CSEC' },
                { name: 'Tian Di Hui' },
                { name: 'Netburners' },
                { name: 'Sector-12' },
                { name: 'Chongqing' },
                { name: 'New Tokyo' },
                { name: 'Ishima' },
                { name: 'Aevum' },
                { name: 'Volhaven' },
                { name: 'NiteSec', server: 'avmnite-02h' },
                { name: 'The Black Hand', server: 'I.I.I.I' },
                { name: 'BitRunners', server: 'run4theh111z' },
                { name: 'ECorp' },
                { name: 'MegaCorp' },
                { name: 'KuaiGong International' },
                { name: 'Four Sigma' },
                { name: 'NWO' },
                { name: 'Blade Industries' },
                { name: 'OmniTek Incorporated' },
                { name: 'Bachman & Associates' },
                { name: 'Clarke Incorporated' },
                { name: 'Fulcrum Secret Technologies' },
                { name: 'Slum Snakes' },
                { name: 'Tetrads' },
                { name: 'Silhouette' },
                { name: 'Speakers for the Dead' },
                { name: 'The Dark Army' },
                { name: 'The Syndicate' },
                { name: 'The Covenant' },
                { name: 'Daedalus' },
                { name: 'Illuminati' },
            ],
            darkweb: [
                { name: 'BruteSSH.exe', hl: 50, cost: 500e3 },
                { name: 'FTPCrack.exe', hl: 100, cost: 1500e3 },
                { name: 'relaySMTP.exe', hl: 250, cost: 5e6 },
                { name: 'HTTPWorm.exe', hl: 500, cost: 30e6 },
                { name: 'SQLInject.exe', hl: 750, cost: 250e6 },
                { name: 'AutoLink.exe', hl: 25, cost: 1e6 },
                { name: 'ServerProfiler.exe', hl: 75, cost: 500e3 },
                { name: 'DeepscanV1.exe', hl: 75, cost: 500e3 },
                { name: 'DeepscanV2.exe', hl: 400, cost: 5e9 },
            ],
        },
        prog: {
            name: 'Self Upgrade Daemon',
            cycleTime: 1000,
            cycleLimit: 0,
            host: ns.getHostname(),
            cycleCount: 0,
            status: true,
        },
    }

    const utils = new UtilsCore(ns, config)
    const utilsN = new UtilsNetwork(ns)

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
        ns.stopAction()
    }

    ns.atExit(() => teardown(true))

    /********
     * Main *
     ********/
    const cmp = (a, b) => (a > b) - (a < b)

    const program = async () => {
        const player = ns.getPlayer()
        const bitnode = player.bitNodeN
        const tor = player.tor
        let hl = ns.getHackingLevel()
        let money = ns.getServerMoneyAvailable('home')

        let cycle = 0
        while (ns.fileExists(`/data/game.log.${bitnode}.${cycle + 1}.txt`)) cycle++
        const gameLog = `/data/game.log.${bitnode}.${cycle}.txt`

        config.global.data = JSON.parse(ns.read(gameLog))

        // Join Factions
        player.factions.forEach(x => {
            const exists = config.global.factions.find(y => x === y.name)
            if (exists) exists.joined = true
            else config.global.factions.push({ name: x, joined: true })
        })
        ns.checkFactionInvitations().forEach(x => {
            utils.log(`Joining faction ${x}...`, 'info', null)
            ns.joinFaction(x)
            config.global.factions.find(y => y.name === x).joined = true
        })
        const factionsToBackdoor = config.global.factions.filter(x => !x?.joined && x?.server)
        for (let faction of factionsToBackdoor) {
            if (ns.hasRootAccess(faction.server)) {
                const server = ns.getServer(faction.server)
                if (!server.backdoorInstalled) {
                    utils.log(`Installing backdoor on ${faction.server}...`, 'info', null)
                    await utilsN.backdoor(faction.server)
                    faction.joined = true
                } else faction.joined = true
            }
        }

        // Purchase TOR router
        if (!tor && money >= 200e3) {
            utils.log('Purchasing TOR Router...', 'info', null)
            ns.purchaseTor()
        }

        // Build Prog library
        // ns.purchaseProgram()
        // ns.createProgram()
        config.global.darkweb.forEach(x => x.purchased = ns.fileExists(x.name, 'home'))

        if (!config.global.darkweb.every(x => x.purchased)) {
            config.global.darkweb.filter(x => !x.purchased)
            .sort((a, b) => cmp(a.cost, b.cost) || cmp(a.hl, b.hl))
            .forEach(x => {
                if (tor && money >= x.cost) {
                    utils.log(`Purchasing prog ${x.name}...`, 'info', null)
                    ns.purchaseProgram(x.name)
                }
                else if (hl >= x.hl && !ns.isBusy()) {
                    utils.log(`Creating prog ${x.name}...`)
                    ns.createProgram(x.name)
                }
            })
            if (ns.isBusy() && config.prog.cycleCount % (60) === 0 || config.prog.cycleCount === 1) ns.stopAction()
            // Do crime while waiting for all progs
            if (!ns.isBusy()) {
                config.global.data.crimes.forEach(x => {
                    x.chance = ns.getCrimeChance(x.name)
                    x.moneySec = x.money / x.time
                })
                const crimes = config.global.data.crimes
                    .sort((a, b) => b.moneySec - a.moneySec)
                
                const bestCrime = crimes.filter(x => x.chance >= 0.5 && x.hacking_exp > 0)[0] || crimes[crimes.length - 1]

                utils.log(`Committing ${bestCrime.name} ${utils.formatPercent(bestCrime.chance)} for ${utils.formatCost(bestCrime.money)} | ${utils.formatMs(bestCrime.time)} ${utils.formatCost(bestCrime.moneySec)}/s...`)
                ns.commitCrime(bestCrime.name)
            }
        } else {
            // All progs purchased, work on faction rep
            config.global.factions.filter(x => x?.joined)
                .forEach(x => {
                    const existingAugs = ns.getOwnedAugmentations(true)
                    const augs = ns.getAugmentationsFromFaction(x.name)
                        .filter(y => !existingAugs.includes(y) && !y.includes('NeuroFlux'))
                    if (augs.length === 0) return
                    const augStats = augs.map(y => ({
                        name: y,
                        price: ns.getAugmentationPrice(y),
                        rep: ns.getAugmentationRepReq(y),
                        pre: ns.getAugmentationPrereq(y),
                    })).sort((a, b) => cmp(a.pre.length, b.pre.length) || cmp(a.rep, b.rep) || cmp(a.price, b.price))
                    const aug = augStats[0]
                    const rep = ns.getFactionRep(x.name)
                    money = ns.getServerMoneyAvailable('home')
                    const pre = aug.pre ? aug.pre.every(j => existingAugs.includes(j)) : true
                    if (rep >= aug.rep && money >= aug.price && pre) {
                        utils.log(`Purchasing ${aug.name} from ${x.name}...`, 'info', null)
                        ns.purchaseAugmentation(x.name, aug.name)
                    } else {
                        if (!ns.isBusy()) {
                            utils.log(`Working for ${x.name}...`, 'info')
                            ns.workForFaction(x.name, 'Hacking', false)
                        }
                        else if (config.prog.cycleCount % (60 * 5) === 0 || config.prog.cycleCount === 1) {
                            utils.log('Stopping to check progress...', 'info')
                            ns.stopAction()
                        }
                    }
                })
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