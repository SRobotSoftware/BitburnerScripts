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
        // ╒ ═ ╕ ╡ ╞
        // ─ ┼ │ ┌ ┬ ┐ └ ┴ ┘ ├ ┬ ┤
        constructor(utils, headers = [], title) {
            this.title = title
            this.utils = utils
            this.headers = headers
            this.dividers = {
                title: {
                    l: '╒',
                    le: '╡',
                    r: '╕',
                    re: '╞',
                    c: '═',
                },
                top: {
                    l: '┌',
                    c: '┬',
                    r: '┐',
                },
                mid: {
                    l: '├',
                    c: '┼',
                    r: '┤',
                },
                bot: {
                    l: '└',
                    c: '┴',
                    r: '┘',
                },
                row: '─',
                col: '│',
            }
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
        getDividerStr(left = '├', divider = '┼', right = '┤') {
            const res = this.utils.leftPad('', this.getHeaderStr().length, this.dividers.row).split('')
            res[0] = left
            this.getHeaderStr().split('').forEach((x, i, a) => {
                if (i === 0 || i === a.length - 1) return null
                if (x === this.dividers.col) res[i] = divider
            })
            res[res.length - 1] = right
            return res.join('')
        }
        getTitle() {
            const len = this.getHeaderStr().length
            let res = [this.dividers.title.l, this.dividers.title.le, ...this.title.split(''), this.dividers.title.re, this.dividers.title.r]
            while (res.length < len) {
                res.splice(-1, 0, this.dividers.title.c)
            }
            return (res.length > len) ? '' : `${res.join('')}\n`
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
                    p += ` %${opts?.pre || ''}${c}${opts?.post || 's'} ${this.dividers.col}`
                    return p
                }, `${this.dividers.col}`)
        }
        clear() {
            this.data = []
        }
        print() {
            const formatStr = this.getFormatStr()
            let str = ''
            if (this.title) str += this.getTitle()
            str += `${this.getDividerStr(this.dividers.top.l, this.dividers.top.c, this.dividers.top.r)}`
            str += `\n${this.utils.ns.sprintf(formatStr, ...this.headers.map(x => x?.str))}`
            str += `\n${this.getDividerStr(this.dividers.mid.l, this.dividers.mid.c, this.dividers.mid.r)}`
            this.data.forEach((x, i) => str += `\n${this.utils.ns.sprintf(formatStr, ...this.data[i])}`)
            str += `\n${this.getDividerStr(this.dividers.bot.l, this.dividers.bot.c, this.dividers.bot.r)}`
            this.utils.ns.print(str)
        }
    }
}