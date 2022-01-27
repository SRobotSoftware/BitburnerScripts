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
            corporation: 'Cephalocorp',
            divisions: {
                agro: 'CephaloCrop',
                tobacco: 'CephaBacco',
            },
            cities: ['Aevum', 'Chongqing', 'Sector-12', 'New Tokyo', 'Ishima', 'Volhaven'],
            dataFile: '/data/corp.txt',
        },
        prog: {
            name: 'Corporation Daemon',
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

        
        config.global.data = ns.fileExists(config.global.dataFile)
            ? JSON.parse(ns.read(config.global.dataFile))
            : {
                agro: {
                    advert: 0,
                },
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
        const corp = ns.corporation.getCorporation()

        // SETUP BEGIN

        // Create Corporation
        if (!corp) return ns.corporation.createCorporation(config.global.corporation, false)

        const agroCorpName = config.global.divisions.agro
        const agroExists = corp.divisions.find(x => x.name === agroCorpName)

        // Create Agriculture Division
        if (!agroExists) return ns.corporation.expandIndustry('Agriculture', agroCorpName)

        const agro = ns.corporation.getDivision(agroCorpName)

        // Buy Smart Supply
        if (!ns.corporation.hasUnlockUpgrade('Smart Supply')) {
            const cost = ns.corporation.getUnlockUpgradeCost('Smart Supply')
            if (cost <= corp.funds) {
                ns.corporation.unlockUpgrade('Smart Supply')
                corp.funds -= cost
            }
            else return false
        } 

        // Expand Offices
        // need 6 offices,
        const expandInto = config.global.cities.filter(x => !agro.cities.includes(x))
        expandInto = expandInto.filter(x => {
            const cost = ns.corporation.getExpandCityCost(x)
            if (cost >= corp.funds) return true
            ns.corporation.expandCity(x)
            return false
        })

        if (expandInto.length) return false

        // Hire 3 Employees per office (1xOps, 1xEng, 1xBus)
        const offices = config.global.cities.map(x => ns.corporation.getOffice(agroCorpName, x))
        for (const office in offices) {
            while (x.employees.length < 3) {
                x.employees.push(ns.corporation.hireEmployee(agroCorpName, office.loc))
            }
            await ns.corporation.setAutoJobAssignment(agroCorpName, office.loc, 'Unassigned', 3)
            await ns.corporation.setAutoJobAssignment(agroCorpName, office.loc, 'Operations', 1)
            await ns.corporation.setAutoJobAssignment(agroCorpName, office.loc, 'Engineer', 1)
            await ns.corporation.setAutoJobAssignment(agroCorpName, office.loc, 'Management', 1)
        }

        // Purchase 1 AdVert.Inc (how to track this?)
        if (ns.corporation.getHireAdVertCount() === 0) {
            if (ns.corporation.getHireAdVertCost() > corp.funds) return false
            ns.corporation.hireAdVert(agroCorpName)
        }

        // Upgrade Storage to 300 per office (two upgrades)
        for (const office in offices) {
            if (!ns.corporation.hasWarehouse(agroCorpName, office.loc))
                ns.corporation.purchaseWarehouse(agroCorpName, office.loc)

            const warehouse = ns.corporation.getWarehouse(agroCorpName, office.loc)

            while (warehouse.size < 300)
                ns.corporation.upgradeWarehouse(agroCorpName, office.loc)

            ns.corporation.setSmartSupply(agroCorpName, office.loc, true)
        }

        // Start selling Plants and Food MAX@MP
        for (const office in offices) {
            ns.corporation.sellMaterial(agroCorpName, office.loc, 'Plants', 'MAX', 'MP')
            ns.corporation.sellMaterial(agroCorpName, office.loc, 'Food', 'MAX', 'MP')
        }
        
        // SETUP END


        // GROW BEGIN

        // Purchase FocusWires -> Neural Accelerators -> Speech Processors -> Injectors -> Smart Factories
        // 1x each and repeat once
        const upgrades = ['FocusWires']
        upgrades.forEach(x => {
            if (ns.corporation.getUpgradeLevel(x) < 1 && ns.corporation.getUpgradeLevelCost(x) <= corp.funds) 
                ns.corporation.levelUpgrade(x)
        })

        upgrades.forEach(x => {
            if (ns.corporation.getUpgradeLevel(x) < 2 && ns.corporation.getUpgradeLevelCost(x) <= corp.funds) 
                ns.corporation.levelUpgrade(x)
        })

        // Each Office gets 125 Hardware, 75 AI Cores, 27000 Real Estate
        for (const office in offices) {
            
        }

        // Wait for employee morale/happiness/energy to hit 99.998+

        // Find Investors >= $210b

        // Upgrade Offices to 9 Employees each (management is odd one out)

        // Upgrade Smart Factories and Smart Storage to 10 each

        // Upgrade Warehouses 7 more times (2k storage)

        // Each Office gets 2675 Hardware, 96 Robots, 2445 AI Cores, 119400 Real Estate

        // Find Investors >= $5t

        // Upgrade Warehouses 9 more times (3.8k storage)

        // Each Office gets 6500 Hardware, 630 Robots, 3750 AI Cores, 84000 Real Estate

        // Production Multiplier should be over 500 now

        // GROW END


        // PRODUCT BEGIN

        // Create Tobacco Division

        // Expand into Aevum first, then all cities

        // Upgrade office in Aevum to 30 Employees, 6x of each type

        // Other offices get 9 Employees in GROW configuration

        // Develop 1st Product spend $1e9 on Design and Marketing

        // While corp cash > $3t => invest in Wilson Analytics up to level 14

        // Level FocusWires, Neural Accelerators, Speech Processors, Injectors all to 20

        // Spend on AdVert.Inc until 36k Awareness and 27k Popularity

        // Sell product MAX@MP*i until you're not selling everything then back off one

        // Begin product v2

        // Begin product v3

        // Upgrade Aevum to 60 employees

        // Invest for >= $800t

        // PRODUCT END


        // INVESTMENT START

        // ABMP - Always Be Making Products
        // Never buy research items unless you have double the cost
        // Buy and use TA.II ignore TA.I

        // Priorities
        // 1. Buy Wilson Analytics
        // 2. Upgrade size at Aevum +15 OR buy AdVert.Inc (whichever is cheaper)
        // 3. Upgrade size at other cities, but maintain Aevum at 60+ than the next highest

        // This section is finished you lose the ability to invest

        // INVESTMENT END

        
        // MAINTENANCE START

        // Go Public
        // Skim dividends off the top
        
        // 1. ABMP
        // 2. Upgrade Aevum +15 (cap at 300) OR AdVert.Inc (whichever is cheaper)
        // 3. Upgrade size on other cities, but maintain Aevum at 60+ than the next highest (cap at 240)

        // MAINTENANCE END
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