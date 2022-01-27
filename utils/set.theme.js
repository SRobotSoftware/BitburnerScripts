/** @param {NS} ns **/
export async function main(ns) {
    const themes = {
        default: '{"primarylight":"#0f0","primary":"#0c0","primarydark":"#090","successlight":"#0f0","success":"#0c0","successdark":"#090","errorlight":"#f00","error":"#c00","errordark":"#900","secondarylight":"#AAA","secondary":"#888","secondarydark":"#666","warninglight":"#ff0","warning":"#cc0","warningdark":"#990","infolight":"#69f","info":"#36c","infodark":"#039","welllight":"#444","well":"#222","white":"#fff","black":"#000","hp":"#dd3434","money":"#ffd700","hack":"#adff2f","combat":"#faffdf","cha":"#a671d1","int":"#6495ed","rep":"#faffdf","disabled":"#66cfbc","backgroundprimary":"#000","backgroundsecondary":"#000","button":"#333"}',
        bitcord: '{"primarylight":"#FFFFFF","primary":"#C3C7CC","primarydark":"#72767D","successlight":"#858C23","success":"#59731F","successdark":"#2F5B1C","errorlight":"#FF5258","error":"#ED4245","errordark":"#E12B31","secondarylight":"#AAA","secondary":"#888","secondarydark":"#666","warninglight":"#FFBA52","warning":"#EAA741","warningdark":"#D59022","infolight":"#99A1F7","info":"#848DED","infodark":"#6A75E8","welllight":"#202225","well":"#36393F","white":"#fff","black":"#202225","hp":"#ED4245","money":"#F1C40F","hack":"#2ECC71","combat":"#faffdf","cha":"#9B59B6","int":"#5865F2","rep":"#faffdf","disabled":"#1ABC9C","backgroundprimary":"#36393F","backgroundsecondary":"#2F3136","button":"#2F3136"}',
        base16TomorrowNight: '{"primarylight":"#e0e0e0","primary":"#c5c8c6","primarydark":"#b4b7b4","successlight":"#c3ca86","success":"#bcc377","successdark":"#b5bd68","errorlight":"#d68484","error":"#d17575","errordark":"#cc6666","secondarylight":"#b4b7b4","secondary":"#969896","secondarydark":"#373b41","warninglight":"#f3d18f","warning":"#f1cb81","warningdark":"#f0c674","infolight":"#9ab4cb","info":"#8dabc4","infodark":"#81a2be","welllight":"#444","well":"#222","white":"#fff","black":"#000","hp":"#d17575","money":"#f1cb81","hack":"#bcc377","combat":"#a3685a","cha":"#b294bb","int":"#8dabc4","rep":"#de935f","disabled":"#8abeb7","backgroundprimary":"#1d1f21","backgroundsecondary":"#161719","button":"#373b41"}',
        nord: '{"primarylight":"#ECEFF4","primary":"#ECEFF4","primarydark":"#ECEFF4","successlight":"#A3BE8C","success":"#A3BE8C","successdark":"#A3BE8C","errorlight":"#BF616A","error":"#BF616A","errordark":"#BF616A","secondarylight":"#ECEFF4","secondary":"#ECEFF4","secondarydark":"#ECEFF4","warninglight":"#EBCB8B","warning":"#EBCB8B","warningdark":"#EBCB8B","infolight":"#88C0D0","info":"#5E81AC","infodark":"#81A1C1","welllight":"#3B4252","well":"#2E3440","white":"#ECEFF4","black":"#3B4252","hp":"#BF616A","money":"#EBCB8B","hack":"#A3BE8C","combat":"#ECEFF4","cha":"#B48EAD","int":"#5E81AC","rep":"#faffdf","disabled":"#8FBCBB","backgroundprimary":"#2E3440","backgroundsecondary":"#2E3440","button":"#333"}',
        vscodeDark: '{"primarylight":"#E0E0BC","primary":"#CCCCAE","primarydark":"#B8B89C","successlight":"#00F000","success":"#00D200","successdark":"#00B400","errorlight":"#F00000","error":"#C80000","errordark":"#A00000","secondarylight":"#B4AEAE","secondary":"#969090","secondarydark":"#787272","warninglight":"#F08400","warning":"#F08400","warningdark":"#F08400","infolight":"#69f","info":"#36c","infodark":"#039","welllight":"#444","well":"#222","white":"#fff","black":"#1E1E1E","hp":"#dd3434","money":"#ffd700","hack":"#adff2f","combat":"#faffdf","cha":"#a671d1","int":"#6495ed","rep":"#faffdf","disabled":"#66cfbc","backgroundprimary":"#1E1E1E","backgroundsecondary":"#252525","button":"#333"}',
    }
    if (ns.args[0])
        ns.ui.setTheme(JSON.parse(themes[ns.args[0]]))
    else
        Object.keys(themes).forEach(x => ns.tprint(x))
}