"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.usage = exports.inject = exports.name = void 0;
const { Schema, Logger, h } = require("koishi");
const { readFileSync } = require('fs')
const { resolve } = require('path')
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const url = require('node:url');
const { generateSongListImage, logInfo } = require('./render');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const name = 'music-link';
const inject = {
    required: ['http', "i18n"],
    optional: ['puppeteer'],
};
const logger = new Logger('music-link');

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
)

const usage = `
<h1>Koishi 插件：music-link-vincentzyu-fork</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>
<h3>原始仓库: <a href="https://github.com/shangxueink/koishi-shangxue-apps/tree/main/plugins/music-link" target="_blank">https://github.com/shangxueink/koishi-shangxue-apps/tree/main/plugins/music-link</a></h3>

<p>插件使用问题 / Bug反馈 / 插件开发交流，欢迎加入QQ群：<b>259248174</b></p>

<hr>

<details>
<summary><h3>使用方法 (点击展开)</h3></summary>

<p>安装并配置插件后，使用下述命令搜索和下载音乐：</p>
<hr>

<h3>使用api.injahow.cn网站搜索网易云音乐</h3>
<pre><code>网易点歌 [歌曲名称/歌曲ID]</code></pre>
<p><b>(很推荐)</b> api.injahow.cn 网站，API请求快速且稳定，无需 puppeteer 服务，推荐QQ官方机器人使用此后端，使用这个后端VIP歌曲只能听45秒，但这个指令还有一个后端可以都听。很好用哦<b>仅支持网易云音乐</b>，可以通过歌曲名称或歌曲ID进行搜索。</p>
<hr>

<h3>使用api.dragonlongzhu.cn网站API搜索音乐</h3>
<pre><code>龙珠搜索 [keywords]</code></pre>
<p><b>(一般推荐)</b> api.dragonlongzhu.cn 网站的点歌API。支持多平台音乐搜索。</p>
<hr>

</details>

---

<h3>如何返回语音/视频/群文件消息</h3>
<p>可以修改对应指令的<code>返回字段表</code>中的 <code>下载链接</code> 对应的 <code>字段发送类型</code> 字段，

把 <code>text</code> 更改为 <code>audio</code> 就是返回 语音，

改为 <code>video</code> 就是返回 视频消息，

改为 <code>file</code> 就是返回 群文件。</p>
<hr>

<p>⚠️需要注意的是，当配置返回格式为音频/视频的时候，请自行检查是否安装了 <code>silk</code>、<code>ffmpeg</code> 等服务。</p>
<p>⚠️如果你选择了 <code>file</code> 类型，请确保平台支持！目前仅实测了 <code>onebot</code> 平台的部分协议端支持！</p>
<hr>

<h3>使用 <code>-n 1</code> 直接返回内容</h3>
<p>在使用命令时，可以通过添加 <code>-n 1</code> 选项直接返回指定序号的歌曲内容。这对于快速获取特定歌曲非常有用。</p>
<p>例如，使用以下命令可以直接获取第一首歌曲的详细信息：</p>
<pre><code>歌曲搜索 -n 1 蔚蓝档案</code></pre>


---
| 后端推荐度 |               名称                | 备注  |
| :--------: | :-------------------------------: | :---: |
|   **ⅰ**    | \`api.injahow.cn\` (歌曲搜索) | 较高  |
|   **ⅱ**    |   \`dev.iw233.cn\` (音乐搜索器)   | 中等  |
|  *......*  |               其他                | 中等  |
|   **ⅳ**    | \`星之阁API\` (下载音乐/酷狗音乐) | 较低  |

---

目前基本QQ音乐都死翘翘了 （腾讯太小气了
`;



const command6_return_data_Field_default = [
    {
        "data": "name",
        "describe": "歌曲名称",
        "type": "text"
    },
    {
        "data": "id",
        "describe": "歌曲ID",
        "type": "text"
    },
    {
        "data": "artist",
        "describe": "歌手",
        "type": "text"
    },
    {
        "data": "url",
        "describe": "下载链接",
        "type": "text"
    },
    {
        "data": "pic",
        "describe": "封面链接",
        "type": "image"
    },
    {
        "data": "lrc",
        "describe": "歌词",
        "type": "text",
        "enable": false
    }
];

const command8_return_QQdata_Field_default = [
    {
        "data": "title",
        "describe": "歌曲名称",
        "type": "text"
    },
    {
        "data": "singer",
        "describe": "歌手",
        "type": "text"
    },
    {
        "data": "cover",
        "describe": "封面",
        "type": "image"
    },
    {
        "data": "link",
        "describe": "歌曲链接",
        "type": "text",
        "enable": false
    },
    {
        "data": "url",
        "describe": "下载链接",
        "type": "text"
    },
    {
        "data": "lyric",
        "describe": "歌词",
        "type": "text",
        "enable": false
    }
];

const platformMap = {
    '网易云': 'netease',
    'QQ': 'tencent',
    '酷我': 'kuwo',
    'Tidal': 'tidal',
    'Qobuz': 'qobuz',
    '喜马FM': 'ximalaya',
    '咪咕': 'migu',
    '酷狗': 'kugou',
    '油管': 'ytmusic',
    'Spotify': 'spotify',
};

const IMAGE_STYLE_MAP = {
    ORIGIN_BLACK_WHITE: 'ORIGIN_BLACK_WHITE',
    MODERN_SOURCE_HANS_SERIF: 'MODERN_SOURCE_HANS_SERIF',
}


const Config = Schema.intersect([
    Schema.object({
        enableReplySonglist: Schema.boolean().default(false).description("开启后 发送歌单消息的时候 会回复触发指令的消息"),
        waitTimeout: Schema.natural().role('s').description('允许用户返回选择序号的等待时间').default(45),
        exitCommand: Schema.string().default('0, 不听了').description('退出选择指令，多个指令间请用逗号分隔开'), // 兼容中文逗号、英文逗号
        menuExitCommandTip: Schema.boolean().default(false).description('是否在歌单内容的后面，加上退出选择指令的文字提示'),
    }).description('基础设置'),

    Schema.object({
        imageMode: Schema.boolean().default(true).description('开启后返回图片歌单（需要puppeteer服务），关闭后返回文本歌单（部分指令必须使用puppeteer）'),
        darkMode: Schema.boolean().default(true).description('是否开启暗黑模式（黑底菜单）'),
        backgroundImagePath: Schema.string().default(path.resolve(__dirname, '../assets/mahiro_mihari.png')).description(`背景图片路径. 仅对${IMAGE_STYLE_MAP.MODERN_SOURCE_HANS_SERIF}生效`),
        imageStyle: Schema.union([
            Schema.const(IMAGE_STYLE_MAP.ORIGIN_BLACK_WHITE).description('原始_黑白'),
            Schema.const(IMAGE_STYLE_MAP.MODERN_SOURCE_HANS_SERIF).description('现代_思源宋体'),
        ]).role('radio').description('图片样式'),
        addCoverInImage: Schema.boolean().default(true).description('是否在图片歌单中添加封面. 只对command6和8生效'),

    }).description('图片歌单设置'),

    Schema.object({
        serverSelect: Schema.union([
            Schema.const('command6').description('command6：`api.injahow.cn`网站       （API 请求快 + 稳定 推荐QQ官方机器人使用）      （网易云）'),
            Schema.const('command8').description('command8：`api.dragonlongzhu.cn` 龙珠API  （多平台音乐）'),
        ]).role('radio').default("command6").description('选择使用的后端<br>➣ 推荐度：`api.injahow.cn`  ≥ `music.gdstudio.xyz` ≥ `dev.iw233.cn` ≥ `api.dragonlongzhu.cn` > `星之阁API`'),
    }).description('后端选择'),
    Schema.union([

        Schema.object({
            serverSelect: Schema.const('command6'),
            command6: Schema.string().default('网易点歌').description('`网易点歌`的指令名称<br>输入歌曲ID，返回歌曲'),
            command6_searchList: Schema.number().default(20).min(1).max(100).description('歌曲搜索的列表长度。返回的候选项个数。不建议超过50，可能超过最长文本长度/让图片渲染、发送、加载时间变长'),
            maxDuration: Schema.natural().description('歌曲最长持续时间，单位为：秒').default(900),
            command6_useProxy: Schema.boolean().experimental().description('是否使用 Apifox Web Proxy 代理请求（适用于海外用户）').default(false),
            command6_usedAPI: Schema.union([
                Schema.const('api.injahow.cn').description('（稳定）黑胶只能30秒的`api.injahow.cn`后端（适合官方bot）'),
                Schema.const('meting.jmstrand.cn').description('（推荐）稳定性未知、全部可听的`meting.jmstrand.cn`后端').experimental(),
                Schema.const('api.qijieya.cn').description('（推荐）稳定性未知、全部可听的`api.qijieya.cn`后端').experimental(),
                Schema.const('metingapi.nanorocky.top').description('(不推荐 文件很大) 稳定性未知、无损音质、全部可听的`meting.jmstrand.cn`后端').experimental(),
            ]).description("选择 获取音乐直链的后端API").default("api.qijieya.cn"),
            command6_return_data_Field: Schema.array(Schema.object({
                data: Schema.string().description('返回的字段'),
                describe: Schema.string().description('对该字段的中文描述'),
                type: Schema.union([
                    Schema.const('text').description('文本（text）'),
                    Schema.const('image').description('图片（image）'),
                    Schema.const('audio').description('语音（audio）'),
                    Schema.const('video').description('视频（video）'),
                    Schema.const('file').description('文件（file）'),
                ]).description('字段发送类型'),
                enable: Schema.boolean().default(true).description('是否启用'),
            })).role('table').description('歌曲返回信息的字段选择<br>[➣ 点我查看该API返回内容示例](http://music.163.com/api/search/get/web?csrf_token=hlpretag=&hlposttag=&s=蔚蓝档案&type=1&offset=0&total=true&limit=10)').default(command6_return_data_Field_default),
        }).description('`网易点歌`返回设置'),

        Schema.object({
            serverSelect: Schema.const('command8').required(),
            command8: Schema.string().default('龙珠搜索').description('龙珠API的指令名称'),
            // command8_wyyQuality: Schema.number().default(1).description('QQ音乐默认下载音质。`找不到对应音质，会自动使用标准音质`<br>1(标准音质)/2(极高音质)/3(无损音质)/4(Hi-Res音质)/5(高清环绕声)/6(沉浸环绕声)/7(超清母带)'),
            command8_searchList: Schema.number().default(20).min(1).max(100).description('歌曲搜索的列表长度。返回的候选项个数。不建议超过50，可能超过最长文本长度/让图片渲染、发送、加载时间变长'),

            command8_return_QQdata_Field: Schema.array(Schema.object({
                data: Schema.string().description('返回的字段'),
                describe: Schema.string().description('对该字段的中文描述'),
                type: Schema.union([
                    Schema.const('text').description('文本（text）'),
                    Schema.const('image').description('图片（image）'),
                    Schema.const('audio').description('语音（audio）'),
                    Schema.const('video').description('视频（video）'),
                    Schema.const('file').description('文件（file）'),
                ]).description('字段发送类型'),
                enable: Schema.boolean().default(true).description('是否启用')
            })).role('table').default(command8_return_QQdata_Field_default).description('音乐歌曲返回信息的字段选择<br>[➣ 点我查看该API返回内容示例](https://api.dragonlongzhu.cn/api/joox/juhe_music.php?msg=%E8%94%9A%E8%93%9D%E6%A1%A3%E6%A1%88&type=json&br=1&num=20&n=1)'),
        }).description('龙珠API返回设置'),

        Schema.object({
        }).description('↑ 请选择后端服务 ↑'),
    ]),

    Schema.object({
        enablemiddleware: Schema.boolean().description("是否自动解析JSON音乐卡片").default(false),
        middleware: Schema.boolean().description("`enablemiddleware`是否使用前置中间件监听<br>`中间件无法接受到消息可以考虑开启`").default(false),
        used_id: Schema.number().default(1).min(0).max(10).description("在歌单里默认选择的序号<br>范围`0-10`，无需考虑11-20，会自动根据JSON卡片的平台选择。若音乐平台不匹配 则在搜索项前十个进行选择。"),
    }).description('JSON卡片解析设置'),

    Schema.object({
        isfigure: Schema.boolean().default(false).description("`图片、文本`元素 使用合并转发，其余单独发送<br>`仅支持 onebot 适配器` 其他平台开启 无效").experimental(),
        isuppercase: Schema.boolean().default(false).description("将链接域名进行大写置换，仅适用于qq官方平台").experimental(),
        data_Field_Mode: Schema.union([
            Schema.const('text').description('富媒体置底：文字 > 图片 > 语音 ≥ 视频 ≥ 文件 （默认）'),
            Schema.const('image').description('仅图片置顶的 富媒体置底：图片 > 文字 ≥ 语音 ≥ 视频 ≥ 文件 （仅官方机器人考虑使用）'),
            Schema.const('raw').description('严格按照 `command_return_data_Field` 表格的顺序 （严格按照配置项表格的上下顺序）'),
        ]).role('radio').default("text").description('对 `command*_return_data_Field`配置项 排序的控制<br>优先级越高，顺序越靠前<br>[➣点我查看此配置项 效果预览图](https://i0.hdslb.com/bfs/article/6e8b901f9b9daa57f082bf0cece36102312276085.png)'),
        renameTempFile: Schema.boolean().default(false).description('是否对`临时音频文件`以`歌曲名称`重命名<br>否则会使用hash值为名称<br>（仅在部分协议端的`h.file`方法下见效）').experimental(),
        deleteTempTime: Schema.number().default(20).description('对于`file`类型的`Temp`临时文件的删除时间<br>若干`秒`后 删除下载的本地临时文件').experimental(),
    }).description('高级进阶设置'),

    Schema.object({
        loggerinfo: Schema.boolean().default(false).description('日志调试开关'),
    }).description('调试模式'),
]);

/**
 * 验证并下载字体文件
 * @param ctx Koishi Context 实例
 * @returns Promise<void>
 */
async function validateAssets(ctx) {
    const assetsDir = path.join(__dirname, '..', 'assets');
    
    // 确保assets目录存在
    if (!existsSync(assetsDir)) {
        mkdirSync(assetsDir, { recursive: true });
    }
    
    const assetConfigs = [
        {
            filename: 'LXGWWenKaiMono-Regular.ttf',
            downloadUrl: 'https://gitee.com/vincent-zyu/koishi-plugin-music-link-vincentzyu-fork/releases/download/fonts/LXGWWenKaiMono-Regular.ttf',
            type: 'font'
        },
        {
            filename: 'SourceHanSerifSC-Medium.otf',
            downloadUrl: 'https://gitee.com/vincent-zyu/koishi-plugin-music-link-vincentzyu-fork/releases/download/fonts/SourceHanSerifSC-Medium.otf',
            type: 'font'
        },
        {
            filename: 'mahiro_mihari.png',
            downloadUrl: 'https://gitee.com/vincent-zyu/koishi-plugin-music-link-vincentzyu-fork/releases/download/bg/mahiro_mihari.png',
            type: 'image'
        }
    ];
    
    for (const assetConfig of assetConfigs) {
        const assetPath = path.join(assetsDir, assetConfig.filename);
        
        // 检查资源文件是否存在
        if (!existsSync(assetPath)) {
            logger.info(`${assetConfig.type === 'font' ? '字体' : '图片'}文件 ${assetConfig.filename} 不存在，开始下载...`);
            
            try {
                // 下载资源文件
                const response = await ctx.http.get(assetConfig.downloadUrl, { responseType: 'arraybuffer' });
                const assetBuffer = Buffer.from(response);
                
                // 保存资源文件
                writeFileSync(assetPath, assetBuffer);
                logger.info(`${assetConfig.type === 'font' ? '字体' : '图片'}文件 ${assetConfig.filename} 下载完成`);
            } catch (error) {
                logger.error(`下载${assetConfig.type === 'font' ? '字体' : '图片'}文件 ${assetConfig.filename} 失败: ${error.message}`);
            }
        } else {
            logger.debug(`${assetConfig.type === 'font' ? '字体' : '图片'}文件 ${assetConfig.filename} 已存在`);
        }
    }
}

function apply(ctx, config) {
    // 设置全局变量以支持render.js中的向后兼容
    global._musicPluginConfig = config;
    global._musicPluginLogger = logger;

    const tempDir = path.join(__dirname, 'temp'); // h.file的临时存储 用于解决部分协议端必须上传本地URL
    let isTempDirInitialized = false;
    const tempFiles = new Set(); // 用于跟踪临时文件路径

    ctx.on('ready', async () => {
        // 验证并下载字体文件
        await validateAssets(ctx);

        ctx.i18n.define("zh-CN", {
            commands: {
                [config.command6]: {
                    description: `网易云点歌`,
                    messages: {
                        "nopuppeteer": "没有开启puppeteer服务",
                        "nokeyword": `请输入网易云歌曲的 名称 或 ID。\n➣示例：/${config.command6} 蔚蓝档案\n➣示例：/${config.command6} 2608813264`,
                        "invalidNumber": "序号输入错误，已退出歌曲选择。",
                        "waitTime": "请在{0}秒内，\n输入歌曲对应的序号:\n➣示例：@机器人 1",
                        "waitTimeout": "输入超时，已取消点歌。",
                        "exitprompt": "已退出歌曲选择。",
                        "noplatform": "获取歌曲失败。",
                        "somerror": "解析歌曲详情时发生错误",
                        "songlisterror": "无法获取歌曲列表，请稍后再试。",
                        "maxsongDuration": "歌曲持续时间超出限制，允许的单曲最大时长为 {0} 秒。",
                    }
                },
                [config.command8]: {
                    description: `龙珠音乐`,
                    messages: {
                        "nopuppeteer": "没有开启puppeteer服务",
                        "nokeyword": `请输入歌曲相关信息。\n➣示例：/${config.command8} 蔚蓝档案`,
                        "invalidNumber": "序号输入错误，已退出歌曲选择。",
                        "waitTime": "请在{0}秒内，\n输入歌曲对应的序号:\n➣示例：@机器人 1",
                        "waitTimeout": "输入超时，已取消点歌。",
                        "exitprompt": "已退出歌曲选择。",
                        "noplatform": "获取歌曲失败。",
                        "somerror": "解析歌曲详情时发生错误",
                        "songlisterror": "无法获取歌曲列表，请稍后再试。",
                    }
                }
            }
        });

        if (config.enablemiddleware) {
            ctx.middleware(async (session, next) => {
                try {
                    // 解析消息内容
                    const messageElements = await h.parse(session.content);

                    // 遍历解析后的消息元素
                    for (const element of messageElements) {
                        // 确保元素类型为 'json' 并且有数据
                        if (element.type === 'json' && element.attrs && element.attrs.data) {
                            const jsonData = JSON.parse(element.attrs.data);
                            logInfo(JSON.stringify(jsonData, null, 2), null, config, logger);


                            // 检查是否存在 musicMeta 和 tag
                            const musicMeta = jsonData?.meta?.music || jsonData?.meta?.news; // 尝试兼容两种结构
                            const tag = musicMeta?.tag;
                            if (musicMeta && tag.includes("音乐")) {

                                const title = musicMeta.title;
                                const desc = musicMeta.desc;
                                logInfo("↡--------------中间件解析--------------↡", null, config, logger);
                logInfo(tag, null, config, logger);
                logInfo(title, null, config, logger);
                logInfo(desc, null, config, logger);
                logInfo("↟--------------中间件解析--------------↟", null, config, logger);
                                // 获取配置的指令名称
                                let command = config.serverSelect;
                                let commandName = config[command]; // 直接使用 config[command] 获取配置项的值
                                logInfo(commandName, null, config, logger);
                                if (!commandName) {
                                    commandName = '歌曲搜索'; // 默认值，以防配置项不存在
                                    logger.error(`未找到配置项 ${command} 对应的指令名称，使用默认指令名称 '歌曲搜索'`);
                                }

                                // 如果选择了 command6 并且是网易云音乐卡片
                                if (command === 'command6' && tag === '网易云音乐') {
                                    // 直接提取歌曲 ID
                                    const jumpUrl = musicMeta.jumpUrl;
                                    const match = jumpUrl?.match(/id=(\d+)/); // 使用 ?. 确保 jumpUrl 不为 null 或 undefined
                                    if (match && match[1]) {
                                        const songId = match[1];
                                        logInfo(`提取到网易云音乐 ID: ${songId}`, null, config, logger);

                                        // 执行 command6 指令
                                        await session.execute(`${commandName} ${songId}`);
                                        return; // 结束当前中间件处理
                                    } else {
                                        logger.error('未能在 jumpUrl 中找到歌曲 ID');
                                    }
                                } else {
                                    // 其他情况，按照原逻辑处理
                                    let usedId = config.used_id;

                                    if (command) {
                                        // 更通用的获取指令名称方式
                                        logInfo(`${commandName} -n ${usedId} “${title} ${desc}”`)
                                        await session.execute(`${commandName} -n ${usedId} “${title} ${desc}”`);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    ctx.logger.error(error);
                    await session.send('处理消息时出错。');
                }
                // 如果没有匹配到任何 json 数据，继续下一个中间件
                return next();
            }, config.middleware);
        }

        if (config.serverSelect === "command6") {
            ctx.command(`${config.command6} <keyword:text>`)
                .option('image_style', '-i, --image_style <image_style:number> 图片样式')
                .example("网易点歌 2608813264")
                .example("网易点歌 蔚蓝档案")
                .option('number', '-n <number:number> 歌曲序号')
                .action(async ({ session, options }, keyword) => {
                    if (!keyword) return h.text(session.text(`.nokeyword`));

                    const isSongId = /^\d+$/.test(keyword.trim());
                    const useApi = config.command6_usedAPI; // 获取用户选择的 API

                    if (isSongId && !options.number) {
                        try {
                            // 获取歌曲直链 (根据选择的 API 调整)
                            let songUrl = '';
                            if (useApi === 'api.injahow.cn') {
                                songUrl = `https://api.injahow.cn/meting/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'meting.jmstrand.cn') {
                                songUrl = `https://meting.jmstrand.cn/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'api.qijieya.cn') {
                                songUrl = `https://api.qijieya.cn/meting/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'metingapi.nanorocky.top') {
                                songUrl = `https://metingapi.nanorocky.top/?server=netease&type=url&id=${selectedSongId}`;
                            }

                            logInfo("请求 API (songUrl):", songUrl);
                            // 请求 163 API 获取歌曲详情 (用于获取歌曲名称、艺术家、图片等信息，与获取直链的 API 无关)
                            const apiBase = `http://music.163.com/api/song/detail/?id=${keyword}&ids=[${keyword}]`;
                            logInfo("请求 API (ID点歌):", apiBase);

                            let apiResponse;
                            if (config.command6_useProxy) {
                                // 使用代理请求
                                apiResponse = await requestWithProxy(apiBase);
                            } else {
                                // 直接请求
                                apiResponse = await ctx.http.get(apiBase);
                            }

                            let parsedApiResponse;
                            try {
                                parsedApiResponse = JSON.parse(apiResponse);
                            } catch (e) {
                                ctx.logger.error("JSON 解析失败:", e);
                                return h.text(session.text(`.songlisterror`));
                            }

                            if (!parsedApiResponse || parsedApiResponse.code !== 200 || !parsedApiResponse.songs || parsedApiResponse.songs.length === 0) {
                                return h.text(session.text(`.songlisterror`));
                            }

                            const songData = parsedApiResponse.songs[0];
                            if (!songData) {
                                ctx.logger.error('网易单曲点歌插件出错， 获取歌曲信息失败');
                                return h.text(session.text(`.songlisterror`));
                            }


                            // 处理歌词 (仍然使用 163 的 API)
                            let lyric = '歌词获取失败';
                            try {
                                const lyricApiUrl = `https://music.163.com/api/song/lyric?id=${keyword}&lv=1&kv=1&tv=-1`;

                                let lyricResponse;
                                if (config.command6_useProxy) {
                                    // 使用代理请求
                                    lyricResponse = await requestWithProxy(lyricApiUrl);
                                } else {
                                    // 直接请求
                                    lyricResponse = await ctx.http.get(lyricApiUrl);
                                }
                                const parsedLyricResponse = JSON.parse(lyricResponse);
                                if (parsedLyricResponse.code === 200 && parsedLyricResponse.lrc && parsedLyricResponse.lrc.lyric) {
                                    lyric = `\n${parsedLyricResponse.lrc.lyric}`;
                                } else {
                                    ctx.logger.error(`获取歌词失败: ${lyricApiUrl}，返回代码: ${parsedLyricResponse.code}`);
                                    ctx.logger.error(lyricResponse);
                                }
                            } catch (error) {
                                ctx.logger.error(`获取歌词失败:`, error);
                            }

                            const processedSongData = {
                                name: songData.name,
                                artist: songData.artists.map(artist => artist.name).join('/'),
                                url: songUrl,
                                lrc: lyric,
                                pic: songData.album.picUrl,
                                id: songData.id,
                            };
                            logInfo(processedSongData);
                            const response = generateResponse(session, processedSongData, config.command6_return_data_Field);
                            return response;
                        } catch (error) {
                            ctx.logger.error('网易单曲点歌插件出错 (ID点歌):', error);
                            return h.text(session.text(`.somerror`));
                        }
                    } else {
                        // 歌名搜索
                        try {
                            const searchApiUrl = `http://music.163.com/api/search/get/web?csrf_token=hlpretag=&hlposttag=&s=${encodeURIComponent(keyword)}&type=1&offset=0&total=true&limit=${config.command6_searchList}`;
                            logInfo("请求搜索 API:", searchApiUrl);

                            let searchApiResponse;
                            if (config.command6_useProxy) {
                                // 使用代理请求
                                searchApiResponse = await requestWithProxy(searchApiUrl);
                            } else {
                                // 直接请求
                                searchApiResponse = await ctx.http.get(searchApiUrl);
                            }

                            let parsedSearchApiResponse;
                            try {
                                parsedSearchApiResponse = JSON.parse(searchApiResponse);
                            } catch (e) {
                                ctx.logger.error("搜索结果 JSON 解析失败:", e);
                                return h.text(session.text(`.songlisterror`));
                            }
                            const searchData = parsedSearchApiResponse.result;

                            ctx.logger.info(`searchData = ${JSON.stringify(searchData)}`);

                            if (!searchData || !searchData.songs || searchData.songs.length === 0) {
                                return h.text(session.text(`.songlisterror`));
                            }

                            const songList = searchData.songs.map((song, index) => {
                                return {
                                    id: song.id,
                                    name: song.name,
                                    artists: song.artists.map(artist => artist.name).join('/'),
                                    albumName: song.album.name,
                                    duration: song.duration
                                };
                            });
                            let input = options.number;

                            if (!options.number) {
                                // ctx.logger.info(`songList = ${JSON.stringify(songList)}`);
                                const formattedList = songList.map((song, index) => `${index + 1}. ${song.name} - ${song.artists} - ${song.albumName}`).join('<br />');
                                const exitCommands = config.exitCommand.split(/[,，]/).map(cmd => cmd.trim());
                                const exitCommandTip = config.menuExitCommandTip ? `退出选择请发[${exitCommands}]中的任意内容<br /><br />` : '';
                                let quoteId = session.messageId;

                                if (config.imageMode) {
                                    const imageStyle = options.image_style ? IMAGE_STYLE_MAP[Object.keys(IMAGE_STYLE_MAP)[options.image_style - 1]] : config.imageStyle;
                                    const imageBuffer = await generateSongListImage(ctx.puppeteer, formattedList, config, logger, imageStyle, undefined);
                                    const payload = [
                                        ...( config.enableReplySonglist ? [h.quote(session.messageId)] : [] ),
                                        h.image(imageBuffer, 'image/png'),
                                        h.text(`${exitCommandTip.replaceAll('<br />', '\n')}${h.text(session.text(`.waitTime`, [config.waitTimeout]))}`),
                                    ];
                                    const msg = await session.send(payload);
                                    quoteId = msg.at(-1);
                                } else {
                                    const msg = await session.send(`${config.enableReplySonglist ? h.quote(session.messageId) : ""}${formattedList}<br /><br />${exitCommandTip}${h.text(session.text(`.waitTime`, [config.waitTimeout]))}`);
                                    quoteId = msg.at(-1);
                                }

                                input = await session.prompt(config.waitTimeout * 1000);
                                if (!input) {
                                    return `${quoteId ? h.quote(quoteId) : ''}${session.text(`.waitTimeout`)}`;
                                }
                                if (exitCommands.includes(input)) {
                                    return h.text(session.text(`.exitprompt`));
                                }
                            }

                            const serialNumber = +input;
                            if (Number.isNaN(serialNumber) || serialNumber < 1 || serialNumber > songList.length) {
                                return h.text(session.text(`.invalidNumber`));
                            }

                            const selectedSongId = songList[serialNumber - 1].id;
                            const selectedinterval = songList[serialNumber - 1].duration / 1000; // selected 的 duration 秒数
                            logInfo("音乐时长：", selectedinterval)
                            if (selectedinterval > config.maxDuration) {
                                return h.text(session.text(`.maxsongDuration`, [config.maxDuration]));
                            }
                            // 获取歌曲详情 (用于获取歌曲名称、艺术家、图片等，与获取直链的 API 无关)
                            const detailApiUrl = `http://music.163.com/api/song/detail/?id=${selectedSongId}&ids=[${selectedSongId}]`;
                            logInfo("请求歌曲详情 API:", detailApiUrl);

                            let detailApiResponse;
                            if (config.command6_useProxy) {
                                // 使用代理请求
                                detailApiResponse = await requestWithProxy(detailApiUrl);
                            } else {
                                // 直接请求
                                detailApiResponse = await ctx.http.get(detailApiUrl);
                            }
                            const detailParsedApiResponse = JSON.parse(detailApiResponse);

                            if (!detailParsedApiResponse || detailParsedApiResponse.code !== 200 || !detailParsedApiResponse.songs || detailParsedApiResponse.songs.length === 0) {
                                return h.text(session.text(`.songlisterror`));
                            }
                            const songData = detailParsedApiResponse.songs[0];


                            // 获取歌曲直链 (根据选择的 API 调整)
                            let songUrl = '';
                            if (useApi === 'api.injahow.cn') {
                                songUrl = `https://api.injahow.cn/meting/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'meting.jmstrand.cn') {
                                songUrl = `https://meting.jmstrand.cn/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'api.qijieya.cn') {
                                songUrl = `https://api.qijieya.cn/meting/?type=url&id=${selectedSongId}`;
                            } else if (useApi === 'metingapi.nanorocky.top') {
                                songUrl = `https://metingapi.nanorocky.top/?server=netease&type=url&id=${selectedSongId}`;
                            }

                            logInfo("请求 API (songUrl):", songUrl);

                            // 处理歌词 (仍然使用 163 的 API)
                            let lyric = '歌词获取失败';
                            try {
                                const lyricApiUrl = `https://music.163.com/api/song/lyric?id=${selectedSongId}&lv=1&kv=1&tv=-1`;

                                let lyricResponse;
                                if (config.command6_useProxy) {
                                    // 使用代理请求
                                    lyricResponse = await requestWithProxy(lyricApiUrl);
                                } else {
                                    // 直接请求
                                    lyricResponse = await ctx.http.get(lyricApiUrl);
                                }
                                const parsedLyricResponse = JSON.parse(lyricResponse);
                                if (parsedLyricResponse.code === 200 && parsedLyricResponse.lrc && parsedLyricResponse.lrc.lyric) {
                                    lyric = `\n${parsedLyricResponse.lrc.lyric}`;
                                } else {
                                    ctx.logger.error(`获取歌词失败: ${lyricApiUrl}，返回代码: ${parsedLyricResponse.code}`);
                                }
                            } catch (error) {
                                ctx.logger.error(`获取歌词失败:`, error);
                            }

                            const processedSongData = {
                                name: songData.name,
                                artist: songData.artists.map(artist => artist.name).join('/'),
                                url: songUrl,
                                lrc: lyric,
                                pic: songData.album.picUrl,
                                id: songData.id,
                            };
                            logInfo(processedSongData)

                            const response = generateResponse(session, processedSongData, config.command6_return_data_Field,);
                            return response;


                        } catch (error) {
                            ctx.logger.error('网易点歌插件出错 (歌名搜索):', error);
                            return h.text(session.text(`.somerror`));
                        }
                    }
                });
        }

        if (config.serverSelect === "command8") {
            ctx.command(`${config.command8} <keyword:text>`)
                .option('image_style', '-i, --image_style <image_style:number> 图片样式')
                .option('quality', '-q <value:number> 品质因数')
                .option('number', '-n <number:number> 歌曲序号')
                .action(async ({ session, options }, keyword) => {
                    if (!keyword) {
                        await session.send(h.text(session.text(".nokeyword")));
                        return;
                    }

                    let songList = [];  // 初始化歌曲列表

                    // 获取歌曲列表
                    try {
                        const searchUrl = `https://api.dragonlongzhu.cn/api/joox/juhe_music.php?msg=${encodeURIComponent(keyword)}&type=json&br=1&num=${config.command8_searchList}`;
                        logInfo(searchUrl);
                        const response = await ctx.http.get(searchUrl);

                        if (!response || !Array.isArray(response)) {
                            throw new Error(`Failed to get song list`);
                        }

                        logInfo(`response = ${JSON.stringify(response)}`);

                        // API返回的是数组，根据配置项截取长度
                        songList = response.slice(0, config.command8_searchList);
                    } catch (error) {
                        logger.error('获取龙珠音乐列表时发生错误', error);
                        return '无法获取音乐列表，请稍后再试。';
                    }

                    // 确保歌曲列表非空
                    if (songList.length === 0) {
                        return '没有找到相关歌曲。';
                    }

                    const totalSongs = songList.length;

                    // 检查是否有指定序号
                    let index = options.number;
                    if (index) {
                        index = Number(index);
                        if (Number.isNaN(index) || index < 1 || index > totalSongs) {
                            return '输入的序号无效。若要点歌请重新发起。';
                        }
                    } else {
                        // 显示歌曲列表供用户选择
                        const songListDisplay = songList.map((song, idx) => {
                            const title = song.title || '未知歌曲';
                            const singer = song.singer || '未知歌手';
                            return `${idx + 1}. ${title} -- ${singer}`;
                        });
                        ctx.logger.info(`songList = ${JSON.stringify(songList)}`);

                        const exitCommands = config.exitCommand.split(/[,，]/).map(cmd => cmd.trim());
                        const exitCommandTip = config.menuExitCommandTip ? `退出选择请发[${exitCommands}]中的任意内容\n\n` : '';
                        const promptText = `${exitCommandTip}${h.text(session.text(`.waitTime`, [config.waitTimeout]))}`;

                        // 歌曲列表消息
                        const songListMessage = songListDisplay.join('\n');

                        let quoteId = session.messageId;

                        // 判断是否使用图片模式
                        if (config.imageMode) {
                            const listText = songListMessage.replace(/\n/g, '<br />');
                            const imageStyle = options.image_style ? IMAGE_STYLE_MAP[Object.keys(IMAGE_STYLE_MAP)[options.image_style - 1]] : config.imageStyle;
                            const imageBuffer = await generateSongListImage(ctx.puppeteer, listText, config, logger, imageStyle, songList);
                            const payload = [
                                ...( config.enableReplySonglist ? [h.quote(session.messageId)] : [] ),
                                h.image(imageBuffer, 'image/png'),
                                h.text(`${promptText}`)
                            ]
                            await session.send( payload );
                        } else {
                            quoteId = await session.send(`${config.enableReplySonglist ? h.quote(session.messageId) : ''}以下是搜索结果：\n${songListMessage}\n${promptText}`);
                        }

                        // 用户回复序号
                        const songChoice = await session.prompt(config.waitTimeout * 1000);
                        if (!songChoice) {
                            return `${quoteId ? h.quote(quoteId) : ''}${session.text(`.waitTimeout`)}`;
                        }

                        // 检查是否是退出命令
                        if (exitCommands.includes(songChoice.trim())) {
                            return session.text('.exitprompt');
                        }

                        index = parseInt(songChoice, 10);
                        if (isNaN(index) || index < 1 || index > totalSongs) {
                            return '输入的序号无效。若要点歌请重新发起。';
                        }
                    }

                    // 获取选中歌曲的详细信息
                    let songDetails = null;
                    try {
                        const detailUrl = `https://api.dragonlongzhu.cn/api/joox/juhe_music.php?msg=${encodeURIComponent(keyword)}&type=json&br=1&num=${config.command8_searchList}&n=${index}`;
                        logInfo(detailUrl);
                        const detailResponse = await ctx.http.get(detailUrl);

                        if (!detailResponse) {
                            throw new Error(`Failed to get song details`);
                        }
                        const detailResponseData = detailResponse.data
                        logInfo(JSON.stringify(detailResponseData));

                        // 检查API返回状态
                        if (detailResponseData.code !== 200) {
                            throw new Error(`API返回错误: ${detailResponseData.msg || '未知错误'}`);
                        }

                        // 检查歌曲链接是否可用
                        if (!detailResponseData.url) {
                            return '歌曲链接为空，请稍后再试。';
                        }

                        // 处理歌词字段（可能为null）
                        const processedSong = {
                            ...detailResponseData,
                            lyric: detailResponseData.lyric || '暂无歌词'
                        };

                        // 生成返回结果
                        songDetails = generateResponse(session, processedSong, config.command8_return_QQdata_Field);
                    } catch (error) {
                        logger.error('获取龙珠音乐详情时发生错误', error);
                        return '无法获取歌曲详情，请稍后再试。';
                    }

                    if (!songDetails) {
                        return '无法获取歌曲详情。';
                    }

                    return songDetails;
                });
        }

        // 代理请求函数
        async function requestWithProxy(targetUrl) {
            const proxyUrl = 'https://web-proxy.apifox.cn/api/v1/request';
            logInfo(`使用${proxyUrl}代理请求${targetUrl}`)
            try {
                const response = await ctx.http.post(proxyUrl, {}, {
                    headers: {
                        'api-u': targetUrl,
                        'api-o0': 'method=GET, timings=true, timeout=3000',
                        'Content-Type': 'application/json'
                    }
                });
                return response;
            } catch (error) {
                logger.error('代理请求失败', error);
                throw error;
            }
        }

        async function ensureTempDir() {
            if (!isTempDirInitialized) {
                await fs.mkdir(tempDir, { recursive: true });
                isTempDirInitialized = true;
            }
        }

        async function downloadFile(url, songname) {
            await ensureTempDir();

            try {
                const file = await ctx.http.file(url);

                // 获取正确的文件扩展名
                const contentType = file.type || file.mime;
                logInfo(file)

                let ext = '.mp3';
                if (contentType) {
                    if (contentType.includes('audio/mpeg')) {
                        ext = '.mp3';
                    } else if (contentType.includes('audio/mp4')) {
                        ext = '.m4a';
                    } else if (contentType.includes('audio/wav')) {
                        ext = '.wav';
                    } else if (contentType.includes('audio/flac')) {
                        ext = '.flac';
                    }
                }

                let filename;
                if (config.renameTempFile && songname) {
                    // 移除非法字符
                    const safeSongname = songname.replace(/[<>:"/\\|?*\x00-\x1F\s]/g, '-').trim();
                    filename = safeSongname + ext;
                } else {
                    filename = crypto.randomBytes(8).toString('hex') + ext;
                }

                const filePath = path.join(tempDir, filename);

                // 将 ArrayBuffer 转换为 Buffer
                const buffer = Buffer.from(file.data);

                // 将文件数据写入文件系统
                await fs.writeFile(filePath, buffer);
                return filePath;
            } catch (error) {
                logger.error('文件下载失败:', error);
                return null;
            }
        }

        async function safeUnlink(filePath, maxRetries = 5, interval = 1000) {
            let retries = 0;
            while (retries < maxRetries) {
                try {
                    await fs.access(filePath); // 先检查文件是否存在
                    await fs.unlink(filePath);
                    return;
                } catch (error) {
                    if (error.code === 'ENOENT') return; // 文件不存在直接返回
                    if (error.code === 'EBUSY') {
                        retries++;
                        await new Promise(resolve => ctx.setTimeout(resolve, interval));
                    } else {
                        throw error;
                    }
                }
            }
            throw new Error(`Failed to delete ${filePath} after ${maxRetries} retries`);
        }

        async function generateResponse(session, data, platformconfig) {
            // 按类型分类存储
            const textElements = [];
            const imageElements = [];
            const mediaElements = [];
            const fileElements = [];
            const rawElements = [];

            // 用于合并转发的内容
            const figureContentElements = []; // 存储 figure 内部的元素

            // 遍历配置项，根据类型收集元素
            for (const field of platformconfig) {
                if (!field.enable) continue;

                const value = data[field.data];
                if (!value) continue;

                let element = null;
                switch (field.type) {
                    case 'text':
                        let textValue = data[field.data];

                        // 类型检查和默认值
                        if (typeof textValue === 'string') {
                            if (config.isuppercase) {
                                // 使用正则表达式匹配 URL 中的域名部分
                                textValue = textValue.replace(/(https?:\/\/)([^/]+)/, (match, protocol, domain) => {
                                    return `${protocol}${domain.toUpperCase()}`;
                                });
                            }
                        } else {
                            // 如果 textValue 不是字符串，则使用空字符串作为默认值或进行其他处理
                            textValue = textValue ? String(textValue) : ''; // 转换为字符串或使用空字符串
                            // 或者，如果 textValue 为 null 或 undefined，则不进行任何操作
                            // textValue = '';
                        }

                        element = h.text(`${field.describe}：${textValue}`);
                        textElements.push(element);
                        break;

                    case 'image':
                        element = h.image(value);
                        imageElements.push(element);
                        break;
                    case 'audio':
                        element = h.audio(value);
                        mediaElements.push(element);
                        break;
                    case 'video':
                        element = h.video(value);
                        mediaElements.push(element);
                        break;
                    case 'file':
                        try {
                            const songname = data.songname || data.title || data.name || "TempSongFileName";
                            const localFilePath = await downloadFile(value, songname);
                            if (localFilePath) {
                                element = h.file(url.pathToFileURL(localFilePath).href);
                                fileElements.push(element);
                                tempFiles.add(localFilePath);

                                // 定时删除逻辑
                                if (config.deleteTempTime > 0) {
                                    ctx.setTimeout(async () => {
                                        await safeUnlink(localFilePath).catch(() => { });
                                        logInfo(`正在执行： tempFiles.delete(${localFilePath})`)
                                        tempFiles.delete(localFilePath);
                                    }, config.deleteTempTime * 1000);
                                }
                            }
                        } catch (error) {
                            logger.error('文件处理失败:', error);
                        }
                        break;
                }
                if (config.data_Field_Mode === 'raw' && element) {
                    rawElements.push(element); // 'raw' 模式下，按配置顺序添加元素
                }
            }

            let responseElements = [];

            // 根据 data_Field_Mode 排序元素
            switch (config.data_Field_Mode) {
                case 'image':
                    responseElements = [...imageElements, ...textElements, ...mediaElements, ...fileElements];
                    break;
                case 'raw':
                    responseElements = rawElements; // 严格按照配置顺序
                    break;
                case 'text': // 默认模式
                default:
                    responseElements = [...textElements, ...imageElements, ...mediaElements, ...fileElements];
                    break;
            }

            // 如果启用了合并转发，处理文本和图片
            if (config.isfigure && (session.platform === "onebot" || session.platform === "red")) {
                logInfo(`使用合并转发，正在收集图片和文本。`);

                // 创建 figureContentElements
                for (const element of responseElements) {
                    if (element.type === 'text' || element.type === 'image' || element.type === 'img') { // 图片是 img 元素
                        const attrs = {
                            userId: session.userId,
                            nickname: session.author?.nickname || session.username,
                        };
                        figureContentElements.push(h('message', attrs, element));
                    }
                }

                // 创建 figure 元素
                const figureContent = h('figure', {
                    children: figureContentElements
                });
                logInfo(JSON.stringify(figureContent, null, 2));

                // 发送合并转发消息
                await session.send(figureContent);

                // 发送剩余的媒体和文件
                for (const element of responseElements) {
                    if (element.type === 'audio' || element.type === 'video' || element.type === 'file') {
                        await session.send(element);
                    }
                }
                return; // 结束函数，不再返回字符串
            } else {
                // 如果没有启用合并转发，按顺序发送所有元素
                responseElements = responseElements.join('\n')
                logInfo(responseElements);
                return responseElements;
            }
        }


    });

}
exports.apply = apply;
exports.Config = Config;
exports.name = name;
exports.usage = usage;
exports.inject = inject;
exports.reusable = true; // 声明可重用