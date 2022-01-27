/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
export async function main(ns) {
    ns.clearLog()
    ns.tail()
    const player = ns.getPlayer()
    const bitnode = player.bitNodeN
    let gameLog = `/data/game.log.${bitnode}.0.txt`
    let data = {}

    if (!ns.fileExists(gameLog)) {
        // First cyle of the new run
        data.player = player
        data.crimes = [
            'shoplift',
            'rob store',
            'mug someone',
            'larceny',
            'deal drugs',
            'bond forgery',
            'traffick illegal arms',
            'homicide',
            'grand theft auto',
            'kidnap and ransom',
            'assassinate',
            'heist',
        ].map (x => ns.getCrimeStats(x))
        ns.print('foo')

        await ns.write(gameLog, JSON.stringify(data), 'w')
    }

    let cycle = 0
    while (ns.fileExists(`/data/game.log.${bitnode}.${cycle + 1}.txt`)) cycle++
    gameLog = `/data/game.log.${bitnode}.${cycle}.txt`
    ns.print(`Reading data from: ${gameLog}`)

    data = JSON.parse(ns.read(gameLog))
    // Do things

    // Save and exit
    await ns.write(gameLog, JSON.stringify(data), 'w')
    ns.exit()
}