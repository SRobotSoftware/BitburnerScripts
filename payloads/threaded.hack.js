/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
export async function main(ns) {
    const target = ns.args[0]
    await ns.hack(target, { threads: ns.args[1], stock: ns.args[2] || false })
}