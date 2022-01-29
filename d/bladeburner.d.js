import UtilsCore from 'utils/utils.core.js'

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
            gym: 'powerhouse gym',
            minimumStats: 100,
            minimumStamina: 40,
            staminaPercent: {
                high: 0.95,
                low: 0.6,
            },
            restingAction: {
                type: 'general',
                name: 'Hyperbolic Regeneration Chamber',
            },
            skillCaps: {
                'Tracer': 10,
                'Cloak': 25,
                'Short-Circuit': 25,
                'Overclock': 90,
            },
            chaosLimit: 50,
            blopThresh: 0.55,
            activityThresh: 0.33,
            cityNames: ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"],
        },
        prog: {
            name: 'Bladeburner Daemon',
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

        config.global.blops = ns.bladeburner.getBlackOpNames()
        config.global.upgrades = ns.bladeburner.getSkillNames()
        config.global.activities = {
            'general': ns.bladeburner.getGeneralActionNames(),
            'contracts': ns.bladeburner.getContractNames(),
            'operations': ns.bladeburner.getOperationNames(),
        }

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
        const player = ns.getPlayer()

        if (!ns.bladeburner.joinBladeburnerDivision()) {
            utils.log('Pre-Bladeburner Training...')
            if (player.strength < config.global.minimumStats) ns.gymWorkout(config.global.gym, 'strength', false)
            else if (player.defense < config.global.minimumStats) ns.gymWorkout(config.global.gym, 'defense', false)
            else if (player.dexterity < config.global.minimumStats) ns.gymWorkout(config.global.gym, 'dexterity', false)
            else if (player.agility < config.global.minimumStats) ns.gymWorkout(config.global.gym, 'agility', false)
            return false
        }

        const [currentStamina, maxStamina] = ns.bladeburner.getStamina()

        // New recruit, train to 40 stamina
        if (maxStamina < config.global.minimumStamina) {
            utils.log('Bladeburner Initial Training...')
            return ns.bladeburner.startAction('general', 'Training')
        }

        // Grind
        const staminaLow = Math.ceil(maxStamina * config.global.staminaPercent.low)
        const staminaHigh = Math.floor(maxStamina * config.global.staminaPercent.high)
        const currentAction = ns.bladeburner.getCurrentAction()

        if (currentStamina <= staminaLow && currentAction.name !== config.global.restingAction.name) {
            utils.log('Starting rest')
            ns.bladeburner.startAction(config.global.restingAction.type, config.global.restingAction.name)
            return false
        }
        else if (currentStamina >= staminaHigh && currentAction.name === config.global.restingAction.name) {
            utils.log('Finished resting')
            ns.bladeburner.stopBladeburnerAction()
        }

        const highestPop = config.global
            .cityNames.map(x => ({ name: x, pop: ns.bladeburner.getCityEstimatedPopulation(x) }))
            .sort((a, b) => b.pop - a.pop)
        
        if (highestPop[0].name !== ns.bladeburner.getCity()) ns.bladeburner.switchCity(highestPop[0].name)

        // Purchase upgrades
        const upgrades = [
            'Blade\'s Intuition',
            'Cloak',
            'Short-Circuit',
            'Digital Observer',
            'Tracer',
            'Overclock',
            'Reaper',
            'Evasive System',
            'Datamancer',
            'Cyber\'s Edge',
            'Hands of Midas',
            'Hyperdrive',
        ]

        const upgradesMap = upgrades
            .map(x => ({
                name: x,
                rank: ns.bladeburner.getSkillLevel(x),
            }))
            .sort((a, b) => a.cost - b.cost)

        upgradesMap.unshift(upgradesMap.splice(upgradesMap.findIndex(x => x === 'Hyperdrive'), 1)[0])
        upgradesMap.unshift(upgradesMap.splice(upgradesMap.findIndex(x => x === 'Overclock'), 1)[0])

        while (upgradesMap.some(x => (x.rank >= config.global.skillCaps?.[x.name]) ? false : ns.bladeburner.upgradeSkill(x.name))) {}

        // When Chaos is over 50 do some stealth retirement
        const chaos = ns.bladeburner.getCityChaos(ns.bladeburner.getCity())
        if (chaos >= 50) ns.bladeburner.startAction('operation', 'Stealth Retirement Operation')

        // If pop is <= 1e9 swap cities?
        // const pop = ns.bladeburner.getCityEstimatedPopulation(player.city)
        // Find a new city to go to...
        // if (pop <= 1e9) ns.travelToCity('foo')

        // Check for Blops
        if (currentAction.type === 'BlackOp' || currentAction.name === config.global.restingAction.name) return false
        const currentRank = ns.bladeburner.getRank()
        const blop = config.global.blops
            .map(blop => ({
                name: blop,
                successChance: ns.bladeburner.getActionEstimatedSuccessChance('BlackOp', blop),
                requiredRanks: ns.bladeburner.getBlackOpRank(blop),
            }))
            .sort((a, b) => a.requiredRanks - b.requiredRanks)
            .filter(x => x.requiredRanks <= currentRank && x.successChance[0] >= config.global.blopThresh)
            .find(x => ns.bladeburner.startAction('BlackOp', x.name))

        if (blop) {
            utils.log(`Executing ${blop.name}...`)
            return false
        }

        // Check for Activities
        const remapActivities = a => config.global.activities[a].map(x => {
            const rep = ns.bladeburner.getActionRepGain(a, x)
            const time = ns.bladeburner.getActionTime(a, x) / 1000
            const successChance = ns.bladeburner.getActionEstimatedSuccessChance(a, x).reduce((p, c) => p+=c, 0) / 2
            return {
                name: x,
                type: a,
                successChance,
                rep,
                time,
                repGain: rep / time * successChance,
            }
        })
        
        let activities = [
            ...remapActivities('general'),
            ...remapActivities('operations'),
            ...remapActivities('contracts'),
        ]


       activities = activities
            .filter(x => x && x.repGain >= 0)
            .sort((a, b) => b.repGain - a.repGain)
        
        activities.unshift(activities.splice(activities.findIndex(x => x.name === 'Assassination'), 1)[0])

        const activity = activities.find(x => x.successChance >= config.global.activityThresh)

        if (activity && activity?.name !== currentAction.name) {
            utils.log(`Executing ${activity.name}
    ${utils.formatPercent(activity.successChance)} | ${Math.floor(activity.rep)} | ${utils.formatSec(activity.time)} | ${activity.repGain.toFixed(2)}/s`)
            ns.bladeburner.startAction(activity.type, activity.name)
            return false
        }

        if (currentAction.type === 'Idle') {
            utils.log('No Tracking available, Training...')
            ns.bladeburner.startAction('general', 'Training')
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