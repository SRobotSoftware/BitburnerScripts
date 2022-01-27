export default class UtilsCore {
    constructor(ns, config = {}) {
        this.ns = ns
        this.config = config
    }

    // String utils
    leftPad(s, n, t = ' ') {
        while (String(s).length < n) s = `${t}${s}`
        return s
    }
    rightPad(s, n, t = ' ') {
        while (String(s).length < n) s = `${s}${t}`
        return s
    }
    formatBytes(x) {
        return this.ns.nFormat(x * 1024 * 1024 * 1024, '0ib')
    }
    formatCost(x) {
        return this.ns.nFormat(x, '$0.00a')
    }
    formatPercent(x) {
        return this.ns.nFormat(x, '0%')
    }
    formatMs(x) {
        const hrs = Math.floor(x / (1000*60*60))
        const min = Math.floor(x / (1000*60)) % 60
        const sec = Math.floor(x / 1000) % 60
        return `${this.leftPad(hrs, 2, 0)}:${this.leftPad(min, 2, 0)}:${this.leftPad(sec, 2, 0)}`
    }
    formatSec(x) {
        const hrs = Math.floor(x / (60*60))
        const min = Math.floor(x / 60) % 60
        const sec = x % 60
        return `${this.leftPad(hrs, 2, 0)}:${this.leftPad(min, 2, 0)}:${this.leftPad(sec, 2, 0)}`
    }

    // Logging utils
    log(t, toastLevel = null, toastDuration = 2000) {
        const now = new Date(Date.now())
        let str = ''
        str += `${this.leftPad(now.getHours(), 2, 0)}:`
        str += `${this.leftPad(now.getMinutes(), 2, 0)}:`
        str += `${this.leftPad(now.getSeconds(), 2, 0)}:`
        str += `${this.leftPad(now.getMilliseconds(), 3, 0)} `
        str += this.config?.prog?.cycleCount >= 0 ? `C${this.config.prog.cycleCount} ` : ''
        str += typeof(t) === 'object' ? JSON.stringify(t) : t
        this.ns.print(str)
        if (toastLevel) this.ns.toast(`${this.ns.getScriptName()}: ${t}`, toastLevel, toastDuration)
    }
    tlog(t) {
        const now = new Date(Date.now())
        const cycle = this.config?.prog?.cycleCount >= 0 ? ` C${this.config.prog.cycleCount}` : ''
        this.ns.tprint(`${this.leftPad(now.getHours(), 2, 0)}:${this.leftPad(now.getMinutes(), 2, 0)}:${this.leftPad(now.getSeconds(), 2, 0)}:${this.leftPad(now.getMilliseconds(), 3, 0)}${cycle} ${t}`)
    }

    // Func utils
    compare(a, b) {
        return (a > b) - (a < b)
    }

    initLog() {
        this.ns.disableLog('ALL')
        this.ns.clearLog()
        this.ns.tail()
    }

    TableHelper = class {
        // ─ │ ┌ ┐ └ ┘ ├ ┬ ┤ ┴
        constructor(utils, headers = [], rowDivider = '-', columnDivider = '|') {
            this.utils = utils
            this.headers = headers
            this.rowDivider = rowDivider
            this.columnDivider = columnDivider
            this.data = []
        }
        prepHeader(str, pre = '', post = 's') {
            return {
                str,
                pre,
                post,
            }
        }
        set headers(headers) {
            this._headers = headers.map(x => typeof x === 'string' ? this.prepHeader(x) : x)
        }
        get headers() {
            return this._headers
        }
        getHeaderStr() {
            return this.utils.ns.sprintf(this.getFormatStr(), ...this.headers.map(x => x?.str))
        }
        getDividerStr() {
            return this.utils.leftPad('', this.getHeaderStr().length, this.rowDivider)
        }
        getDataStr(r) {
            return this.utils.ns.sprintf(this.getFormatStr(), ...this.data[r])
        }
        getFormatStr() {
            return this.data.slice()
                .map(row => row.map(cell => (cell + '').length))
                .reduce((p, c) => p.map((cell, i) => Math.max(cell, c[i])),
                    this.headers.slice().map(x => (x.str + '').length))
                .reduce((p, c, i) => {
                    const opts = this.headers[i]
                    p += ` %${opts?.pre || ''}${c}${opts?.post || 's'} ${this.columnDivider}`
                    return p
                }, `${this.columnDivider}`)
        }
        clear() {
            this.data = []
        }
        print() {
            const formatStr = this.getFormatStr()
            const divider = this.getDividerStr()
            let str = `${divider}`
            str += `\n${this.utils.ns.sprintf(formatStr, ...this.headers.map(x => x?.str))}`
            str += `\n${divider}`
            this.data.forEach((x, i) => str += `\n${this.utils.ns.sprintf(formatStr, ...this.data[i])}`)
            str += `\n${divider}`
            this.utils.ns.print(str)
        }
    }
}