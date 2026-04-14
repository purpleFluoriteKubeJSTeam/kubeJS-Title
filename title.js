let TITLE_DISPLAY,TITLES
// 称号映射（文本 -> 带颜色的显示文本）
TITLE_DISPLAY = JsonIO.read("kubejs/server_scripts/title.json")

// 称号指令（不要写中文和纯数字!!!!）
TITLES = Object.keys(TITLE_DISPLAY)

// 颜色映射表
const COLOR_MAP = {
    'black': '0', 'dark_blue': '1', 'dark_green': '2', 'dark_aqua': '3',
    'dark_red': '4', 'dark_purple': '5', 'gold': '6', 'gray': '7',
    'dark_gray': '8', 'blue': '9', 'green': 'a', 'aqua': 'b',
    'red': 'c', 'light_purple': 'd', 'yellow': 'e', 'white': 'f',
};

// 颜色代码到名称的反向映射（用于将颜色代码替换为文本）
const COLOR_CODE_TO_NAME = {
    '0': 'black', '1': 'dark_blue', '2': 'dark_green', '3': 'dark_aqua',
    '4': 'dark_red', '5': 'dark_purple', '6': 'gold', '7': 'gray',
    '8': 'dark_gray', '9': 'blue', 'a': 'green', 'b': 'aqua',
    'c': 'red', 'd': 'light_purple', 'e': 'yellow', 'f': 'white',
    'k': 'obfuscated', 'l': 'bold', 'm': 'strikethrough', 'n': 'underline', 'o': 'italic', 'r': 'reset'
};

// 将颜色代码替换为文本表示的函数
function replaceColorCodes(text) {
    if (!text) return text;
    
    // 匹配Minecraft颜色代码：§后跟一个字符（0-9a-fk-or）
    return text.replace(/§([0-9a-fk-or])/gi, (match, codeChar) => {
        let lowerCode = codeChar.toLowerCase();
        let colorName = COLOR_CODE_TO_NAME[lowerCode];
        if (colorName) {
            return `[${colorName}]`;
        }
        // 如果没有找到对应的名称，保留原样（但理论上不会发生）
        return match;
    });
}

// 输出调试信息
console.log(`[称号系统] 初始化完成，共有 ${TITLES.length} 个称号`)

// 清理空队伍函数
function cleanupEmptyTeams(server) {
    console.log(`[称号系统] 开始清理空队伍...`);
    let usedTeams = new Set();
    
    // 收集在线玩家正在使用的队伍名（即他们的称号键）
    if (server.players) {
        server.players.forEach(player => {
            let titleKey = player.persistentData.selectedTitle;
            if (titleKey && TITLES.includes(titleKey)) {
                usedTeams.add(titleKey);
                console.log(`[称号系统] 玩家 ${player.name} 使用队伍: ${titleKey}`);
            }
        });
    }
    
    // 遍历所有可能的队伍名（即所有称号键）
    let removedCount = 0;
    TITLES.forEach(teamName => {
        if (!usedTeams.has(teamName)) {
            // 尝试删除空队伍
            let result = server.runCommandSilent(`team remove ${teamName}`);
            if (result) {
                console.log(`[称号系统] 成功删除空队伍: ${teamName}`);
                removedCount++;
            } else {
                // 队伍可能不存在，这是正常的
                console.log(`[称号系统] 队伍 ${teamName} 可能不存在或删除失败`);
            }
        }
    });
    
    console.log(`[称号系统] 清理完成，删除了 ${removedCount} 个空队伍`);
}

// 热重载函数
function reloadTitles() {
    try {
        let newData = JsonIO.read("kubejs/server_scripts/title.json");
        if (typeof newData === 'object' && newData !== null) {
            TITLE_DISPLAY = newData;
            TITLES = Object.keys(TITLE_DISPLAY);
            console.log(`[称号系统] 重载成功，共 ${TITLES.length} 个称号`);
            return true;
        } else {
            throw new Error("JSON 内容不是有效对象");
        }
    } catch (e) {
        console.error("[称号系统] 重载失败", e);
        return false;
    }
}

// 添加颜色函数
function applyColor(text, colorName) {
    const lowerName = colorName.toLowerCase();
    const code = COLOR_MAP[lowerName];
    if (code) {
        return '§' + code + text;
    }
    // 如果颜色名称无效，返回原文本（可改为返回带警告的文本，或直接抛出异常）
    return text;
}

// 颜色补全
function suggestColors(builder) {
    Object.keys(COLOR_MAP).forEach(color => builder.suggest(color));
    return builder.buildFuture();
}

// 自动补全函数
function suggestTitles(builder) {
    TITLES.forEach(title => builder.suggest(title));
    return builder.buildFuture();
}

// 存储称号并更新队伍
function selectTitle(player, selected) {
    if (TITLES.includes(selected)) {
        player.persistentData.selectedTitle = selected;
        let playerName = player.getName().getString()
        const display = TITLE_DISPLAY[selected];

        player.server.runCommandSilent(`team add ${selected} "${display}"`);
        let prefixJson = JSON.stringify({ text: display });

        player.server.runCommandSilent(`team modify ${selected} prefix ${prefixJson}`);
        player.server.runCommandSilent(`team join ${selected} ${playerName}`);
        player.tell(Component.of(`§a成功将称号设置为: ${display}`));
    } else {
        player.tell(Component.of(`§c无效的称号! 可选: ${TITLES.join("、")}`));
    }
}

// 获取玩家当前显示称号（用于聊天等场景）
function getDisplayTitle(player) {
    const raw = player.persistentData.selectedTitle;
    // 如果 raw 存在且在 TITLE_DISPLAY 中有映射则返回，否则返回默认无称号文本
    const rawResult = raw && TITLE_DISPLAY[raw] ? TITLE_DISPLAY[raw] : "";
    // 对结果进行规范化（去除首尾空白字符）
    const result = rawResult.trim();
    return result; 
}

// 注册指令
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal("settitle")
            .then(Commands.literal("select")
                .then(Commands.argument("称号", Arguments.STRING.create(event))
                    .suggests((ctx, builder) => suggestTitles(builder))
                    .requires(ctx => ctx.hasPermission(0))
                    .executes(ctx => {
                        const player = ctx.source.player;
                        const selected = Arguments.STRING.getResult(ctx, "称号");
                        selectTitle(player, selected);
                        return 1;
                    })
                )
            )
            .then(Commands.literal("list")
                .requires(ctx => ctx.hasPermission(0))
                .executes(ctx => {
                    const player = ctx.source.player;
                    if (TITLES.length === 0) {
                        player.tell("§c当前没有任何可用称号!");
                        return 1;
                    }
                    player.tell("§e===== 称号列表 =====");
                    TITLES.forEach(key => {
                        const display = TITLE_DISPLAY[key];
                        // 格式：键名: 带颜色的显示文本
                        player.tell(`§7${key}: ${display}`);
                    });
                    player.tell("§e使用 /settitle select <称号> 来设置");
                    return 1;})
            )
            .then(Commands.literal("reload")
                .requires(ctx => ctx.hasPermission(2)) // 需要管理员权限（OP 2级）
                .executes(ctx => {
                    const player = ctx.source.player;
                    if (reloadTitles()) {
                        player.tell("§a称号列表已重新加载!");
                    } else {
                        player.tell("§c称号列表重新加载失败,请检查控制台日志。");
                    }
                    return 1;
                })
            )
            .then(Commands.literal("cleanteams")
                .requires(ctx => ctx.hasPermission(2)) // 需要管理员权限（OP 2级）
                .executes(ctx => {
                    const player = ctx.source.player;
                    const server = player.server;
                    cleanupEmptyTeams(server);
                    player.tell("§a已执行空队伍清理,请查看控制台日志。");
                    return 1;
                })
            )
        .then(Commands.literal("remove")
            .requires(ctx => ctx.hasPermission(2))
            .then(Commands.argument("key", Arguments.STRING.create(event))
                .suggests((ctx, builder) => suggestTitles(builder)) // 自动补全已有称号键
                .executes(ctx => {
                    let player = ctx.source.player;
                    let key = Arguments.STRING.getResult(ctx, "key");
    
                    if (!TITLES.includes(key)) {
                        player.tell(`§c称号 "${key}" 不存在！`);
                        return 1;
                    }
     
                    try {
                        // 先尝试删除对应的队伍
                        let teamRemoveResult = player.server.runCommandSilent(`team remove ${key}`);
                        if (teamRemoveResult) {
                            console.log(`[称号系统] 成功删除称号 ${key} 对应的队伍`);
                        } else {
                            console.log(`[称号系统] 称号 ${key} 对应的队伍可能不存在，或删除失败`);
                        }
                        
                        let filePath = "kubejs/server_scripts/title.json";
                        let data = JsonIO.read(filePath);
                        if (typeof data !== 'object' || data === null) data = {};
     
                        delete data[key];
                        JsonIO.write(filePath, data);
     
                        reloadTitles();
     
                        player.tell(`§a成功删除称号: ${key}`);
                    }catch (e) {
                        console.error("[称号系统] 删除称号失败: " + e);   // 用 + 拼接
                        player.tell("§c删除称号失败,请检查控制台日志。");
                    } 
                    return 1;
                })
            )
        )
        .then(Commands.literal("add")
            .requires(ctx => ctx.hasPermission(2))
            .then(Commands.argument("key", Arguments.STRING.create(event))
                .then(Commands.argument("display", Arguments.STRING.create(event))  // 改为普通 STRING
                    // 不带颜色的分支
                    .executes(ctx => {
                        let player = ctx.source.player;
                        let key = Arguments.STRING.getResult(ctx, "key");
                        let display = Arguments.STRING.getResult(ctx, "display");
     
                        // 可选：如果用户输入了带引号的字符串，Brigadier 会自动去掉引号，无需额外处理
     
                        // 键名合法性检查
                        if (/[\u4e00-\u9fa5]/.test(key)) {
                            player.tell("§c键名不能包含中文!");
                            return 1;
                        }
                        if (/^\d+$/.test(key)) {
                            player.tell("§c键名不能为纯数字!");
                            return 1;
                        }
                        if (TITLES.includes(key)) {
                            player.tell(`§c称号键 "${key}" 已存在！请先删除或使用其他键名。`);
                            return 1;
                        }
     
                        try {
                            let filePath = "kubejs/server_scripts/title.json";
                            let data = JsonIO.read(filePath);
                            if (typeof data !== 'object' || data === null) data = {};
                            data[key] = display;
                            JsonIO.write(filePath, data);
                            reloadTitles();
                            // 创建对应的队伍
                            player.server.runCommandSilent(`team add ${key} "${display}"`);
                            let prefixJson = JSON.stringify({ text: display });
                            player.server.runCommandSilent(`team modify ${key} prefix ${prefixJson}`);
                            player.tell(`§a成功添加称号: ${key} -> ${display}`);
                        } catch (e) {
                            console.error("[称号系统] 添加称号失败: " + e);
                            player.tell("§c添加称号失败,请检查控制台日志。");
                        }
                        return 1;
                    })
                    // 带颜色的分支
                    .then(Commands.argument("color", Arguments.STRING.create(event))
                        .suggests((ctx, builder) => suggestColors(builder))
                        .executes(ctx => {
                            let player = ctx.source.player;
                            let key = Arguments.STRING.getResult(ctx, "key");
                            let displayRaw = Arguments.STRING.getResult(ctx, "display");
                            let colorName = Arguments.STRING.getResult(ctx, "color");
     
                            // 应用颜色
                            let display = applyColor(displayRaw, colorName);
     
                            // 键名合法性检查
                            if (/[\u4e00-\u9fa5]/.test(key)) {
                                player.tell("§c键名不能包含中文!");
                                return 1;
                            }
                            if (/^\d+$/.test(key)) {
                                player.tell("§c键名不能为纯数字!");
                                return 1;
                            }
                            if (TITLES.includes(key)) {
                                player.tell(`§c称号键 "${key}" 已存在！请先删除或使用其他键名。`);
                                return 1;
                            }
     
                            try {
                                let filePath = "kubejs/server_scripts/title.json";
                                let data = JsonIO.read(filePath);
                                if (typeof data !== 'object' || data === null) data = {};
                                data[key] = display;
                                JsonIO.write(filePath, data);
                                reloadTitles();
                                // 创建对应的队伍
                                player.tell(`§a成功添加称号: ${key} -> ${display}`);
                            } catch (e) {
                                console.error("[称号系统] 添加称号失败: " + e);
                                player.tell("§c添加称号失败,请检查控制台日志。");
                            }
                            return 1;
                        })
                    )
                )
            )
        )
        .then(Commands.literal("clear")
                .requires(ctx => ctx.hasPermission(0))
                .executes(ctx => {
                    const player = ctx.source.player;
                    player.persistentData.selectedTitle = "empty";
                    let playerName = player.getName().getString()
                    player.server.runCommandSilent(`team leave ${playerName}`);
                    player.tell("§a已将你的称号设置为空！");
                    return 1;
                }
            )
        )
    );
});

// 构建聊天信息  
PlayerEvents.chat(event => {
    const message = event.message.trim();
    const player = event.player;
    const mcdrCommand = /^!!.*/

    const selectedTitle = player.persistentData.selectedTitle;

    if (!selectedTitle || selectedTitle === "empty") return;

    // 这里是为了兼容服务器使用的mcdr插件所做的兼容,如果不需要请删除
    if(mcdrCommand.test(message)){
        let playerName = player.getName().getString()
        const vanillaMessage = Component.of("<")
            .append(playerName)
            .append("> ")
            .append(message);
        event.server.tell(vanillaMessage);
        event.cancel();
        return
    };

    const titleRaw = getDisplayTitle(player);
    const titleComponent = Component.of(titleRaw);
    const nameComponent = Component.white(player.getName().getString());
    
    const fullMessage = Component.of("")
        .append(titleComponent)
        .append(Component.yellow(" <"))
        .append(nameComponent)
        .append(Component.yellow("> "))
        .append(Component.of(message));

    event.server.tell(fullMessage);
    event.cancel();
});