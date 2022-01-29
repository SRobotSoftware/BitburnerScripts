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
            crimes: [
                {
                    "difficulty": 0.05,
                    "karma": 0.1,
                    "kills": 0,
                    "money": 15000,
                    "name": "Shoplift",
                    "time": 2000,
                    "type": "shoplift",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 0,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 1,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 0,
                    "hacking_exp": 0,
                    "strength_exp": 0,
                    "defense_exp": 0,
                    "dexterity_exp": 2,
                    "agility_exp": 2,
                    "charisma_exp": 0,
                    "intelligence_exp": 0
                },
                {
                    "difficulty": 0.2,
                    "karma": 0.5,
                    "kills": 0,
                    "money": 400000,
                    "name": "Rob Store",
                    "time": 60000,
                    "type": "rob a store",
                    "hacking_success_weight": 0.5,
                    "strength_success_weight": 0,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 2,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 0,
                    "hacking_exp": 30,
                    "strength_exp": 0,
                    "defense_exp": 0,
                    "dexterity_exp": 45,
                    "agility_exp": 45,
                    "charisma_exp": 0,
                    "intelligence_exp": 0.375
                },
                {
                    "difficulty": 0.2,
                    "karma": 0.25,
                    "kills": 0,
                    "money": 36000,
                    "name": "Mug",
                    "time": 4000,
                    "type": "mug someone",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 1.5,
                    "defense_success_weight": 0.5,
                    "dexterity_success_weight": 1.5,
                    "agility_success_weight": 0.5,
                    "charisma_success_weight": 0,
                    "hacking_exp": 0,
                    "strength_exp": 3,
                    "defense_exp": 3,
                    "dexterity_exp": 3,
                    "agility_exp": 3,
                    "charisma_exp": 0,
                    "intelligence_exp": 0
                },
                {
                    "difficulty": 0.3333333333333333,
                    "karma": 1.5,
                    "kills": 0,
                    "money": 800000,
                    "name": "Larceny",
                    "time": 90000,
                    "type": "commit larceny",
                    "hacking_success_weight": 0.5,
                    "strength_success_weight": 0,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 1,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 0,
                    "hacking_exp": 45,
                    "strength_exp": 0,
                    "defense_exp": 0,
                    "dexterity_exp": 60,
                    "agility_exp": 60,
                    "charisma_exp": 0,
                    "intelligence_exp": 0.75
                },
                {
                    "difficulty": 1,
                    "karma": 0.5,
                    "kills": 0,
                    "money": 120000,
                    "name": "Deal Drugs",
                    "time": 10000,
                    "type": "deal drugs",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 0,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 2,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 3,
                    "hacking_exp": 0,
                    "strength_exp": 0,
                    "defense_exp": 0,
                    "dexterity_exp": 5,
                    "agility_exp": 5,
                    "charisma_exp": 10,
                    "intelligence_exp": 0
                },
                {
                    "difficulty": 0.5,
                    "karma": 0.1,
                    "kills": 0,
                    "money": 4500000,
                    "name": "Bond Forgery",
                    "time": 300000,
                    "type": "forge corporate bonds",
                    "hacking_success_weight": 0.05,
                    "strength_success_weight": 0,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 1.25,
                    "agility_success_weight": 0,
                    "charisma_success_weight": 0,
                    "hacking_exp": 100,
                    "strength_exp": 0,
                    "defense_exp": 0,
                    "dexterity_exp": 150,
                    "agility_exp": 0,
                    "charisma_exp": 15,
                    "intelligence_exp": 3
                },
                {
                    "difficulty": 2,
                    "karma": 1,
                    "kills": 0,
                    "money": 600000,
                    "name": "Traffick Arms",
                    "time": 40000,
                    "type": "traffick illegal arms",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 1,
                    "defense_success_weight": 1,
                    "dexterity_success_weight": 1,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 1,
                    "hacking_exp": 0,
                    "strength_exp": 20,
                    "defense_exp": 20,
                    "dexterity_exp": 20,
                    "agility_exp": 20,
                    "charisma_exp": 40,
                    "intelligence_exp": 0
                },
                {
                    "difficulty": 1,
                    "karma": 3,
                    "kills": 1,
                    "money": 45000,
                    "name": "Homicide",
                    "time": 3000,
                    "type": "commit homicide",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 2,
                    "defense_success_weight": 2,
                    "dexterity_success_weight": 0.5,
                    "agility_success_weight": 0.5,
                    "charisma_success_weight": 0,
                    "hacking_exp": 0,
                    "strength_exp": 2,
                    "defense_exp": 2,
                    "dexterity_exp": 2,
                    "agility_exp": 2,
                    "charisma_exp": 0,
                    "intelligence_exp": 0
                },
                {
                    "difficulty": 8,
                    "karma": 5,
                    "kills": 0,
                    "money": 1600000,
                    "name": "Grand Theft Auto",
                    "time": 80000,
                    "type": "commit grand theft auto",
                    "hacking_success_weight": 1,
                    "strength_success_weight": 1,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 4,
                    "agility_success_weight": 2,
                    "charisma_success_weight": 2,
                    "hacking_exp": 0,
                    "strength_exp": 20,
                    "defense_exp": 20,
                    "dexterity_exp": 20,
                    "agility_exp": 80,
                    "charisma_exp": 40,
                    "intelligence_exp": 0.8
                },
                {
                    "difficulty": 5,
                    "karma": 6,
                    "kills": 0,
                    "money": 3600000,
                    "name": "Kidnap",
                    "time": 120000,
                    "type": "kidnap someone for ransom",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 1,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 1,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 1,
                    "hacking_exp": 0,
                    "strength_exp": 80,
                    "defense_exp": 80,
                    "dexterity_exp": 80,
                    "agility_exp": 80,
                    "charisma_exp": 80,
                    "intelligence_exp": 1.3
                },
                {
                    "difficulty": 8,
                    "karma": 10,
                    "kills": 1,
                    "money": 12000000,
                    "name": "Assassination",
                    "time": 300000,
                    "type": "assassinate a high-profile target",
                    "hacking_success_weight": 0,
                    "strength_success_weight": 1,
                    "defense_success_weight": 0,
                    "dexterity_success_weight": 2,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 0,
                    "hacking_exp": 0,
                    "strength_exp": 300,
                    "defense_exp": 300,
                    "dexterity_exp": 300,
                    "agility_exp": 300,
                    "charisma_exp": 0,
                    "intelligence_exp": 3.25
                },
                {
                    "difficulty": 18,
                    "karma": 15,
                    "kills": 0,
                    "money": 120000000,
                    "name": "Heist",
                    "time": 600000,
                    "type": "pull off the ultimate heist",
                    "hacking_success_weight": 1,
                    "strength_success_weight": 1,
                    "defense_success_weight": 1,
                    "dexterity_success_weight": 1,
                    "agility_success_weight": 1,
                    "charisma_success_weight": 1,
                    "hacking_exp": 450,
                    "strength_exp": 450,
                    "defense_exp": 450,
                    "dexterity_exp": 450,
                    "agility_exp": 450,
                    "charisma_exp": 450,
                    "intelligence_exp": 6.5
                },
            ]
        },
        prog: {
            name: 'Crime Daemon',
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
        ns.stopAction()
    }

    ns.atExit(() => teardown(true))

    /********
     * Main *
     ********/
    const program = async () => {
        if (!ns.isBusy()) {
            config.global.crimes.forEach(x => {
                x.chance = ns.getCrimeChance(x.name)
                x.moneySec = x.money / (x.time / 1000)
            })
            const crimes = config.global.crimes
                .sort((a, b) => b.moneySec - a.moneySec)
            
            const bestCrime = crimes.filter(x => x.chance >= 0.5 && x.hacking_exp > 0)[0] || crimes[crimes.length - 1]
        
            utils.log(`Committing ${bestCrime.name} ${utils.formatPercent(bestCrime.chance)} for ${utils.formatCost(bestCrime.money)} | ${utils.formatMs(bestCrime.time)} ${utils.formatCost(bestCrime.moneySec)}/s...`)
            ns.commitCrime(bestCrime.name)
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