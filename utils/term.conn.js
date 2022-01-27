import UtilsNetwork from 'utils/utils.network.js'

/** @param {NS} ns **/
export async function main(ns) {
    const utilsN = new UtilsNetwork(ns)
    utilsN.connect(ns.args[0])
}