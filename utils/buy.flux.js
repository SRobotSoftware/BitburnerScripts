import UtilsCore from 'utils/utils.core.js'

/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
export async function main(ns) {
    const utils = new UtilsCore(ns)
    ns.disableLog('ALL')
    ns.clearLog()
    const player = ns.getPlayer()
    const augs = ns.getOwnedAugmentations(true)
    const factions = player.factions.map(x => ({
        name: x,
        augs: ns.getAugmentationsFromFaction(x).filter(y => !augs.includes(y)),
        rep: ns.getFactionRep(x),
    }))

    const faction = factions
        .filter(x => x.augs.length === 0)
        .sort((a, b) => utils.compare(b.rep, a.rep))?.[0]?.name

    if (!faction) return ns.alert('No NeuroFlux Governors are currently available')

    let i = 0
    const purchase = await ns.prompt('Purchase NeuroFlux Governors?')
    while (purchase && ns.purchaseAugmentation(faction, 'NeuroFlux Governor')) i++
    utils.log(`Purchased ${i} NeuroFlux Governors`, 'info', null)
    if (!purchase) ns.exit()

    const install = await ns.prompt(`Install ${ns.getOwnedAugmentations(true).length - ns.getOwnedAugmentations().length} augmentations?`)
    if (!install) ns.exit()
    const confirm = await ns.prompt('Are you sure?')
    if (install && confirm) ns.installAugmentations('player.d.js')
}