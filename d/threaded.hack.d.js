import UtilsCore from 'utils/utils.core.js'
import UtilsNetwork from 'utils/utils.network.js'

function sCalculateHackingTime(server, player) {
    const difficultyMult = server.requiredHackingSkill * server.hackDifficulty;

    const baseDiff = 500;
    const baseSkill = 50;
    const diffFactor = 2.5;
    let skillFactor = diffFactor * difficultyMult + baseDiff;
    skillFactor /= player.hacking + baseSkill;

    const hackTimeMultiplier = 5;
    const hackingTime =
    (hackTimeMultiplier * skillFactor) /
    (player.hacking_speed_mult);

    return hackingTime * 1000;
}

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
            hackPercent: 0.9,
            securityThreshold: 3,
            scripts: {
                hack: 'payloads/threaded.hack.js',
                grow: 'payloads/threaded.grow.js',
                weaken: 'payloads/threaded.weaken.js',
            },
            servers: new Map(),
        },
        prog: {
            name: 'Threaded Hacking Daemon',
            cycleTime: 1000,
            cycleLimit: 0,
            host: ns.getHostname(),
            cycleCount: 0,
            status: true,
        },
    }

    const utils = new UtilsCore(ns, config)
    const utilsN = new UtilsNetwork(ns, config)

    class Prog {
        constructor(script, target, duration = 0, threads = 1) {
            this.script = script
            this.target = target
            this.duration = duration
            this.threads = threads
        }
        pid = -1
        started = 0
        start() {
            this.pid = ns.run(this.script, this.threads, this.target, this.threads)
            if (this.pid > 0) {
                this.started = Date.now()
            }
            return this.pid
        }
        get running() {
            return ns.isRunning(this.script, config.prog.host, this.target, this.threads)
        }
        get eta() {
            return Math.max(Math.ceil(((this.duration + this.started) - Date.now()) / 1000), 0)
        }
    }

    class Server {
        constructor(name, coresAvailable = 1, securityThreshold = 3, hackPercent = 0.9) {
            this.name = name
            this.coresAvailable = coresAvailable
            this.securityThreshold = securityThreshold
            this.hackPercent = hackPercent
            this._statusGen = function*() {
                const cycle = ['hack', 'weaken', 'grow', 'weaken']
                let i = 0
                while(true) {
                    yield cycle[i++]
                    if (i >= cycle.length) i = 0
                }
            }()
            this.nextStep = this._statusGen.next().value
            this.currentStep = 'hack'
            this.securityMin = ns.getServerMinSecurityLevel(name)
            this.securityMax = this.securityMin + securityThreshold
            this.moneyMax = ns.getServerMaxMoney(name)
            this.moneyMin = this.moneyMax * hackPercent
            this.hackTime = utils.formatMs(1)
            this.hackMoneyPerSec = 0
            this.timeAtLastHack = Date.now()
            this.timesHacked = -1
        }
        get money() {
            return ns.getServerMoneyAvailable(this.name)
        }
        get security() {
            return ns.getServerSecurityLevel(this.name)
        }
        set prog(p) {
            this._prog = p
            if (this.currentStep === 'hack') {
                const now = Date.now()
                this.hackTime = now - this.timeAtLastHack
                this.hackMoneyPerSec = this.moneyMin / Math.max(this.hackTime, 1)
                this.timeAtLastHack = now
                this.timesHacked++
            }
            this.currentStep = this.nextStep
            this.nextStep = this._statusGen.next().value
        }
        get prog() {
            return this._prog
        }
        get status() {
            const s = this._prog?.running
            return s ? 'running' : 'finished'
        }
        getWeakenThreadsNeeded() {
            let threads = 1
            const securityRequired = ns.getServerSecurityLevel(this.name) - this.securityMax
            while (ns.weakenAnalyze(threads, this.coresAvailable) < securityRequired) {
                threads++
            }
            return threads
        }
        getHackThreadsNeeded() {
            return Math.max(Math.ceil(ns.hackAnalyzeThreads(this.name, this.moneyMin)), 1)
        }
        getGrowThreadsNeeded() {
            return Math.max(Math.ceil(ns.growthAnalyze(this.name, (1 - this.hackPercent) * 100, this.coresAvailable)), 1)
        }
    }

    const printStatus = () => {
        const reg = /threaded\.(.*?).js/
        const out = []
        

        const table = new utils.TableHelper(utils)
        table.headers = [
            table.prepHeader('Server', '-', 's'),
            'Program',
            'Prog ETA',
            'Cash',
            'Cycle Time',
            '$/s',
            'Cycles',
        ]

        // still need to add this to header: utils.leftPad(config.global.servers.size, 3)
        // Also make sure you keep a log() somewhere for the cycle count
        utils.log(`
----------------------------------- ${utils.leftPad(config.global.servers.size, 3)} Servers ------------------------------------------`)

        for (const server of config.global.servers.values()) {
            if (server.moneyMin !== 0) out.push(server)
        }
        out.sort((a, b) => a.moneyMin - b.moneyMin)
            .forEach(server => {
                const script = server.prog?.script
                table.data.push([
                    server.name,
                    server.prog.pid !== 0 ? reg.exec(script)?.[1]?.toUpperCase() : '!!!!!',
                    utils.formatSec(server.prog?.eta || 0),
                    utils.formatCost(server.moneyMin),
                    utils.formatMs(server.hackTime),
                    utils.formatCost(server.hackMoneyPerSec),
                    server.timesHacked
                ])
            })
        table.print()
    }

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

        Object.keys(config.global.scripts).forEach(x => ns.scriptKill(config.global.scripts[x], config.prog.host))
    }

    ns.atExit(() => teardown(true))

    /********
     * Main *
     ********/
    const program = async () => {
        ns.clearLog()
        const player = ns.getPlayer()
        config.global.cores = ns.getServer(config.prog.host).cpuCores
        utilsN.getAllServers()
            .filter(x => !config.global.servers.has(x) && ns.hasRootAccess(x))
            .forEach(x => config.global.servers.set(x, new Server(x, config.global.cores, config.global.securityThreshold, config.global.hackPercent)))

        for (const server of config.global.servers.values()) {
            server.coresAvailable = config.global.cpuCores
            if (server.status !== 'running' && server.moneyMin !== 0) {
                if (server.prog?.pid === 0)
                    if (server.prog?.start() === 0) continue
                let duration = 0
                let threads = 0
                const step = server.nextStep
                switch (step) {
                    case 'hack':
                        threads = server.getHackThreadsNeeded()
                        duration = sCalculateHackingTime(ns.getServer(server.name), player)
                        break
                    case 'weaken':
                        threads = server.getWeakenThreadsNeeded()
                        duration = ns.getWeakenTime(server.name)
                        break
                    case 'grow':
                        threads = server.getGrowThreadsNeeded()
                        duration = ns.getGrowTime(server.name)
                        break
                    default:
                        throw new Error('Something broke!')
                }
                server.prog = new Prog(config.global.scripts[server.nextStep], server.name, duration, threads)
                server.prog.start()
            }
        }
        printStatus()
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