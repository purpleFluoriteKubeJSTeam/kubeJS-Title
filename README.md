# 🎖️ KubeJS-Title 

一个基于 KubeJS 的 Minecraft 服务器称号系统，使用队伍（Team）机制实现。支持热重载、颜色自定义、管理指令与玩家自选。

---

## ✨ 特性

- ✅ 使用原版 `/team` 机制，兼容性良好
- ✅ 称号独立 JSON 配置文件，无需重启服务器即可热重载
- ✅ 支持称号颜色自定义
- ✅ 玩家可使用指令自由切换已拥有的称号
- ✅ 管理员可随时增删称号
- ✅ 聊天消息自动附加称号前缀
- ✅ 兼容 MCDR 插件（可配置关闭）

---

## 📦 安装要求

- **Minecraft**：1.20 
- **Mod 加载器**：Forge / Fabric(未经过测试)
- **KubeJS**：6.0+

---

## 📁 文件结构

```
kubejs/
└── server_scripts/
    ├── title.js          # 主脚本
    └── title.json        # 称号配置文件
```

---

## 🚀 快速开始

### 1️⃣ 放置脚本
将 `title.js` 放入 `kubejs/server_scripts/` 目录下。

### 2️⃣ 初始配置
首次运行时需要手动创建 `title.json`

### 3️⃣ 加载脚本
在游戏内执行 `/kubejs reload server_scripts` 或重启服务器。

### 4️⃣ 添加第一个称号
管理员（OP 等级 ≥2）执行：
```
/settitle add vip "[VIP]"
```
带颜色版本：
```
/settitle add vip "[VIP]" gold
```

---

## 📖 指令说明

> 所有指令均需前缀 `/settitle`，部分需要管理员权限（OP 等级 2）。

### 👤 玩家指令（权限等级 0）

| 指令                       | 说明              |
| ------------------------ | --------------- |
| `/settitle list`         | 查看所有可用称号列表      |
| `/settitle select <称号键>` | 选择一个已拥有的称号      |
| `/settitle clear`        | 清除当前称号（不显示任何前缀） |

### 🛠️ 管理员指令（权限等级 ≥2）

| 指令                            | 说明                      |
| ----------------------------- | ----------------------- |
| `/settitle add <键> <显示文本>`    | 添加新称号（无颜色）              |
| `/settitle add <键> <文本> <颜色>` | 添加带颜色的称号                |
| `/settitle remove <键>`        | 删除一个称号                  |
| `/settitle reload`            | 从 `title.json` 重新加载称号列表 |
| `/settitle cleanteams`        | 清理未被使用的空队伍              |

---

## 🎨 称号配置（title.json）

配置文件为一个 JSON 对象，键名为称号唯一标识（**不可使用中文和纯数字**），值为实际显示的文本

```json
{
  "vip": "&a[VIP]",
  "mvp": "&b[MVP]",
  "admin": "&c&l[Admin]"
}
```

### 颜色代码对照表

| 颜色名           | 代码   | 颜色  | 颜色名            | 代码   | 颜色  |
| ------------- | ---- | --- | -------------- | ---- | --- |
| `black`       | `§0` | 黑色  | `dark_gray`    | `§8` | 深灰  |
| `dark_blue`   | `§1` | 深蓝  | `blue`         | `§9` | 蓝色  |
| `dark_green`  | `§2` | 深绿  | `green`        | `§a` | 绿色  |
| `dark_aqua`   | `§3` | 深青  | `aqua`         | `§b` | 青色  |
| `dark_red`    | `§4` | 深红  | `red`          | `§c` | 红色  |
| `dark_purple` | `§5` | 深紫  | `light_purple` | `§d` | 浅紫  |
| `gold`        | `§6` | 金色  | `yellow`       | `§e` | 黄色  |
| `gray`        | `§7` | 灰色  | `white`        | `§f` | 白色  |

---

## 🔧 高级功能

### 热重载
修改 `title.json` 后，执行 `/settitle reload` 即可生效，无需重启服务器。

### MCDR 兼容
脚本默认将 `!!` 开头的消息视为外部命令，发送时不附加称号前缀，并保持原格式。  
若不需要此兼容逻辑，可删除 `PlayerEvents.chat` 中的 `mcdrCommand` 判断部分。

---

## 📜 开源许可

本项目采用 **MIT License** 开源，您可自由使用、修改、分发，但需保留原始版权声明。

---

## 🙏 致谢

- [KubeJS](https://kubejs.com/) 提供强大的脚本扩展能力
- @ [lostegoist](https://github.com/lostegoist) 提供的测试环境
- 紫莹石机械动力服务器的玩家们提供的宝贵建议

---

## 📧 联系与反馈

若发现问题或有改进建议，欢迎通过以下方式联系：
- 提交 GitHub Issue
- 致信我的个人邮箱
---
本称号系统最初为 **机械动力 (Create)** 主题服务器 **紫莹石机械动力服务器** 开发
如果你对机械动力、自动化流水线以及充满工业美学的原版拓展感兴趣，欢迎加入我们，体验技术与创造的碰撞！
> 🌐 **服务器信息**  
>  版本：`1.20.1forge`  
>  审核群：`512686683`  
>  宣传视频：[bilibili](https://www.bilibili.com/video/BV1dqDuB1EPU/)
