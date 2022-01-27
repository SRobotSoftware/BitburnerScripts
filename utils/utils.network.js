import UtilsCore from 'utils/utils.core.js'

export default class UtilsNetwork {
    constructor(ns, config = {}) {
        this.ns = ns
        this.config = config
        this.utilsC = new UtilsCore(ns, config)
    }
    
    getAllServersAsSet(target = 'home', serverSet, lastVisitedServer = 'home') {
        if (!serverSet) serverSet = new Set()
        this.ns.scan(target)
            .forEach(server => {
                if (serverSet.has(server) || server === lastVisitedServer) return null
                serverSet.add(server)
                this.getAllServersAsSet(server, serverSet, target)
        })
        return serverSet
    }

    getAllServersAsMap(target = 'home', serverMap) {
        if (!serverMap) serverMap = new Map()
        const neighbors = this.ns.scan(target)
        if (!serverMap.has(target)) serverMap.set(target, neighbors)
        neighbors.forEach(server => {
            if (!serverMap.has(server)) this.getAllServersAsMap(server, serverMap)
        })
        return serverMap
    }

    getAllServers() {
       return Array.from(this.getAllServersAsSet())
    }

    nukeServer(target) {
        let server
        try {
            server = this.ns.getServer(target)
        } catch {
            return false
        }

        const playerHl = this.ns.getHackingLevel()
        if (server.requireHackingSkill > playerHl) return false

        const progs = {
            ssh: this.ns.fileExists('BruteSSH.exe'),
            ftp: this.ns.fileExists('FTPCrack.exe'),
            smtp: this.ns.fileExists('relaySMTP.exe'),
            http: this.ns.fileExists('HTTPWorm.exe'),
            sql: this.ns.fileExists('SQLInject.exe'),
        }

        const availablePorts = Object.keys(progs).filter(x => progs[x])

        if (server.numOpenPortsRequired > availablePorts) return false
        if (!server.sshPortOpen && progs.ssh) this.ns.brutessh(target)
        if (!server.ftpPortOpen && progs.ftp) this.ns.ftpcrack(target)
        if (!server.smtpPortOpen && progs.smtp) this.ns.relaysmtp(target)
        if (!server.httpPortOpen && progs.http) this.ns.httpworm(target)
        if (!server.sqlPortOpen && progs.sql) this.ns.sqlinject(target)

        this.ns.nuke(target)
        return this.ns.hasRootAccess(target)
    }

    connect(target) {
        const servers = this.getAllServersAsMap()
        if (!servers.has(target)) return false
        const host = this.ns.getHostname()

        // TODO: I don't know how I made this work, please refactor
        const conn = (currentServer, alreadyVisited = []) => {
            return servers.get(currentServer)
                .filter(x => !alreadyVisited.includes(x))
                .map(x => {
                    alreadyVisited.push(x)
                    if (x === target) return [x]
                    const foo = conn(x, alreadyVisited)
                    return foo.length ? [x, foo] : []
                }).filter(x => x.length).flat(Infinity)
        }

        const path = conn(host, [host])
        path.forEach(x => this.ns.connect(x))
        return true
    }

    async backdoor(target) {
        const servers = this.getAllServersAsMap()
        if (!servers.has(target)) return false
        const host = this.ns.getCurrentServer()

        // TODO: As above, this doesn't make sense but it works for now, fix it
        const conn = (currentServer, alreadyVisited = []) => {
            return servers.get(currentServer)
                .filter(x => !alreadyVisited.includes(x))
                .map(x => {
                    alreadyVisited.push(x)
                    if (x === target) return [x]
                    const foo = conn(x, alreadyVisited)
                    return foo.length ? [x, foo] : []
                }).filter(x => x.length).flat(Infinity)
        }

        const path = conn(host, [host])
        path.forEach(x => this.ns.connect(x))
        await this.ns.installBackdoor()
        path.reverse().forEach(x => this.ns.connect(x))
        this.ns.connect(host)
        return true
    }
}