import UtilsCore from 'utils/utils.core.js'

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
            blopThresh: 0.5,
            activityThresh: 0.33,
            blops: [
                "Operation Typhoon",
                "Operation Zero",
                "Operation X",
                "Operation Titan",
                "Operation Ares",
                "Operation Archangel",
                "Operation Juggernaut",
                "Operation Red Dragon",
                "Operation K",
                "Operation Deckard",
                "Operation Tyrell",
                "Operation Wallace",
                "Operation Shoulder of Orion",
                "Operation Hyron",
                "Operation Morpheus",
                "Operation Ion Storm",
                "Operation Annihilus",
                "Operation Ultron",
                "Operation Centurion",
                "Operation Vindictus",
                "Operation Daedalus",
                ],
            upgrades: [
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
            ],
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

        const { currentStamina, maxStamina } = ns.bladeburner.getStamina()

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

        // Purchase upgrades
        // 100% assassination get overclock 90 
        // otherwise keep all level
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

        while (upgradesMap.some(x => {
                if (x.rank >= config.global.skillCaps?.[x]) return false
                return ns.bladeburner.upgradeSkill(x.name)
            })) {}

        // Check for Blops
        if (currentAction.type !== 'Idle' && currentAction.name !== 'Training') return false

        utils.log('Checking Blops...')
        const blop = config.global.blops
            .map(blop => ({
                name: blop,
                successChance: ns.bladeburner.getActionEstimatedSuccessChance('blackops', blop),
            }))
            .filter(x => x.successChance[0] >= config.global.blopThresh)
            .find(x => ns.bladeburner.startAction('blackops', x.name))

        if (blop) {
            utils.log(`Executing ${blop.name}...`)
            return false
        }

        // Check for Activities
        if (currentAction.type !== 'Idle' && currentAction.name !== 'Training') return false
        
        utils.log('Checking Activities...')
        const activities = [
            { name: 'Assassination', type: 'operation', successChance: ns.bladeburner.getActionEstimatedSuccessChance('operation', 'Assassination') },
            { name: 'Raid', type: 'operation', successChance: ns.bladeburner.getActionEstimatedSuccessChance('operation', 'Raid') },
            { name: 'Bounty Hunter', type: 'contract', successChance: ns.bladeburner.getActionEstimatedSuccessChance('contract', 'Bounty Hunter') },
        ]

        const activity = activities.find(x => x.successChance[0] >= config.global.activityThresh && ns.bladeburner.startAction(x.type, x.name))

        if (activity) {
            utils.log(`Executing ${activity.name}...`)
            return false
        }

        if (currentAction.type === 'Idle' || currentAction.name === 'Training') {
            utils.log('No Activities, attempting Tracking...')
            ns.bladeburner.startAction('contract', 'Tracking')
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