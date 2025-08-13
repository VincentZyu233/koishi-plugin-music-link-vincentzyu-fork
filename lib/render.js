"use strict";

 const fs = require('node:fs');
 const path = require('node:path');

 /**
  * 音乐列表图片渲染模块
  * 用于生成歌曲列表的图片截图
  */

 // 图片样式常量
 const IMAGE_STYLE_MAP = {
     ORIGIN_BLACK_WHITE: 'ORIGIN_BLACK_WHITE',
     MODERN_SOURCE_HANS_SERIF: 'MODERN_SOURCE_HANS_SERIF',
 };

 /**
  * 生成原始黑白样式的HTML内容
  * @param {string} listText - 歌曲列表HTML文本
  * @param {Object} config - 配置对象
  * @returns {string} HTML内容
  */
 function generateOriginBlackWhiteHtml(listText, config) {
     const textBrightness = config.darkMode ? 255 : 0;
     const backgroundBrightness = config.darkMode ? 0 : 255;
     const textColor = `rgb(${textBrightness},${textBrightness},${textBrightness})`;
     const backgroundColor = `rgb(${backgroundBrightness},${backgroundBrightness},${backgroundBrightness})`;
     
     // 匹配并修改歌曲序号格式
     const formattedListText = listText.replace(/(\d+)\./g, (match, p1) => {
         const number = parseInt(p1, 10);
         return `<b style="font-size: 1.2em; font-weight: bold;">${number.toString().padStart(2, '0')}.</b>`;
     });

     return `
 <!DOCTYPE html>
 <html lang="zh">
 <head>
 <title>music</title>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <style>
 body {
 margin: 0;
 font-family: PingFang SC, Hiragino Sans GB, Microsoft YaHei, SimSun, sans-serif;
 font-size: 16px;
 background: ${backgroundColor};
 color: ${textColor};
 }
 #song-list {
 padding: 5px;
 display: inline-block;
 max-width: fit-content;
 white-space: pre-wrap;
 word-break: break-word;
 }
 </style>
 </head>
 <body>
 <div id="song-list">${formattedListText}</div>
 </body>
 </html>
 `;
 }

 /**
  * 生成现代思源宋体样式的HTML内容
  * @param {string} listText - 歌曲列表HTML文本
  * @param {Object} config - 配置对象
  * @returns {string} HTML内容
  */
 function generateModernSourceHansSerifHtml(listText, config) {
     // 读取 package.json 获取版本信息
     const pkg = JSON.parse(
         fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
     );
     const version = pkg.version;
     const repositoryUrl = pkg.repository?.url || '';
      
     // 生成当前时间戳
     const now = new Date();
     const timestamp = now.getFullYear().toString() +
         (now.getMonth() + 1).toString().padStart(2, '0') +
         now.getDate().toString().padStart(2, '0') + '-' +
         now.getHours().toString().padStart(2, '0') +
         now.getMinutes().toString().padStart(2, '0') +
         now.getSeconds().toString().padStart(2, '0');
      
     // 读取字体文件并转换为base64
     const fontPath = path.join(__dirname, '..', 'assets', 'SourceHanSerifSC-Medium.otf');
     let fontBase64 = '';
     try {
         if (fs.existsSync(fontPath)) {
             const fontBuffer = fs.readFileSync(fontPath);
             fontBase64 = fontBuffer.toString('base64');
         }
     } catch (error) {
         console.error('读取字体文件失败:', error);
     }
      
     // 读取背景图片并转换为base64
     let backgroundImageBase64 = '';
     let imageFormat = 'jpeg';
     try {
         if (config.backgroundImagePath && fs.existsSync(config.backgroundImagePath)) {
             const imageBuffer = fs.readFileSync(config.backgroundImagePath);
             backgroundImageBase64 = imageBuffer.toString('base64');
             const ext = path.extname(config.backgroundImagePath).toLowerCase();
             if (ext === '.png') imageFormat = 'png';
             else if (ext === '.webp') imageFormat = 'webp';
             else if (ext === '.gif') imageFormat = 'gif';
             else imageFormat = 'jpeg';
         }
         console.log(`背景图片路径: ${config.backgroundImagePath}`)
     } catch (error) {
         console.error('读取背景图片失败:', error);
     }
      
     const backgroundStyle = backgroundImageBase64
         ? `background-image: url(data:image/${imageFormat};base64,${backgroundImageBase64});`
         : `background-color: #f0f2f5;`;

     // 匹配并修改歌曲序号格式
     const formattedListText = listText.replace(/(\d+)\./g, (match, p1) => {
         const number = parseInt(p1, 10);
         return `<b style="font-size: 1.2em; font-weight: bold;">${number.toString().padStart(2, '0')}.</b>`;
     });
      
     return `
 <!DOCTYPE html>
 <html lang="zh">
 <head>
 <title>music</title>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <style>
 ${fontBase64 ? `@font-face{font-family:'SourceHanSerifSC-Medium';src:url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');font-weight:normal;font-style:normal;font-display:swap;}` : ''}
 body {
     font-family: ${fontBase64 ? "'SourceHanSerifSC-Medium'," : ''} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
     margin: 0;
     padding: 13vh 3vw 3vh 3vw; /* 增大四周空隙到8% */
     background-size: cover;
     background-position: center center;
     background-repeat: no-repeat;
     position: relative;
     box-sizing: border-box;
     display: flex;
     justify-content: center;
     align-items: flex-start;
     perspective: 1000px; /* 添加透视效果 */
     ${backgroundStyle}
 }
 .card {
     background: rgba(255, 255, 255, 0.225);
     backdrop-filter: blur(13px) saturate(180%);
     -webkit-backdrop-filter: blur(13px) saturate(180%);
     border-radius: 32px;
     box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3),
                 0 0 0 1px rgba(255, 255, 255, 0.25),
                 inset 0 0 20px rgba(255, 255, 255, 0.5);
     padding: 3vh 3vw; /* 增加卡片内部间距 */
     width: 90%; /* 减小宽度以增加四周空隙 */
     max-width: 90%;
     margin: 0 auto;
     height: auto;
     box-sizing: border-box;
     border: 1px solid rgba(255, 255, 255, 0.3);
     color: #212121;
     position: relative;
     z-index: 2;
     overflow: visible;
     transform: perspective(1000px) rotateX(-0deg) rotateY(0deg) translateY(0px); /* 添加倾斜透视效果，顶部更大底部更小 */
     transform-origin: center center; /* 以矩形几何中心（对角线交点）为变换原点 */
     transition: transform 0.3s ease; /* 平滑过渡效果 */
 }
 #song-list {
     font-size: 18px;
     line-height: 1.6;
     color: #212121;
     text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
     white-space: pre-wrap;
     word-break: break-word;
 }
 .version-info {
     position: fixed;
     top: 1.3px;
     left: 1.3px;
     font-size: 18px;
     line-height: 1.3;
     color: rgba(10, 10, 10, 0.8);
     text-align: left;
     z-index: 1000;
     pointer-events: none;
     font-family: monospace;
     text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
     font-weight: 900;
 }
 ${config.darkMode ? `
 body.dark .card {
     background: rgba(0, 0, 0, 0.6);
     backdrop-filter: blur(15px) saturate(189%); /* 降低模糊程度，让背景更清晰 */
     -webkit-backdrop-filter: blur(15px) saturate(189%); /* 降低模糊程度，让背景更清晰 */
     border: 1px solid rgba(70, 70, 70, 0.6);
     color: #f0f0f0;
     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95), /* 保持原有阴影 */
                 0 0 0 1px rgba(70, 70, 70, 0.4), /* 保持原有内嵌描边 */
                 inset 0 0 20px rgba(255, 255, 255, 0.2); /* 新增发光内阴影 */
 }
 body.dark #song-list {
     color: #f0f0f0;
     text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
 }
 body.dark .version-info {
     color: rgba(180, 180, 180, 0.8);
     text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
 }
 ` : ''}
 </style>
 </head>
 <body${config.darkMode ? ' class="dark"' : ''}>
     <div class="card">
         <div id="song-list">${formattedListText}</div>
     </div>
     <div class="version-info">
         <div>generated by koishi plugin: music-link-vincentzyu-fork</div>
         <div>version: \t ${version}</div>
         <div>date_time: \t ${timestamp}</div>
         <div>repo_url: \t ${repositoryUrl}</div>
     </div>
 </body>
 </html>
 `;
 }

 /**
  * 生成歌曲列表图片
  * @param {Object} pptr - Puppeteer实例
  * @param {string} listText - 歌曲列表HTML文本
  * @param {Object} config - 配置对象，包含darkMode、imageStyle等设置
  * @param {Object} logger - 日志记录器
  * @param {string} imageStyle - 图片样式，可选值：ORIGIN_BLACK_WHITE, MODERN_SOURCE_HANS_SERIF
  * @returns {Promise<Buffer>} 图片二进制数据
  */
 async function generateSongListImage(pptr, listText, config, logger, imageStyle) {
     let html;
     const style = imageStyle || config.imageStyle || IMAGE_STYLE_MAP.ORIGIN_BLACK_WHITE;
      
     switch (style) {
         case IMAGE_STYLE_MAP.MODERN_SOURCE_HANS_SERIF:
             html = generateModernSourceHansSerifHtml(listText, config);
             break;
         case IMAGE_STYLE_MAP.ORIGIN_BLACK_WHITE:
         default:
             html = generateOriginBlackWhiteHtml(listText, config);
             break;
     }
       
     const page = await pptr.browser.newPage();
     await page.setContent(html);

     let screenshot;
     let clipRect;

     switch (style) {
         case IMAGE_STYLE_MAP.ORIGIN_BLACK_WHITE:
             // 截图 #song-list 元素，并应用缩放
             clipRect = await page.evaluate(() => {
                 const songList = document.getElementById('song-list');
                 const rect = songList.getBoundingClientRect();
                 return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
             });
             screenshot = await page.screenshot({
                 clip: clipRect,
                 encoding: 'binary',
                 // 设置 deviceScaleFactor 替代 CSS 中的 transform
                 deviceScaleFactor: 1.3
             });
             break;

         case IMAGE_STYLE_MAP.MODERN_SOURCE_HANS_SERIF:
             // 截图 body 元素，因为 body 包含了 padding，可以提供留白
             clipRect = await page.evaluate(() => {
                 const body = document.querySelector('body');
                 const rect = body.getBoundingClientRect();
                 return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
             });

             screenshot = await page.screenshot({
                 clip: clipRect,
                 encoding: 'binary'
             });
             break;
          
         default:
             // 默认情况下，截取整个 body 的有效内容区域
             clipRect = await page.evaluate(() => {
                 const body = document.querySelector('body');
                 const rect = body.getBoundingClientRect();
                 return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
             });
             screenshot = await page.screenshot({
                 clip: clipRect,
                 encoding: 'binary'
             });
             break;
     }
      
     await page.close();
     return screenshot;
 }

 /**
  * 日志信息记录函数
  * 支持两种调用方式：
  * 1. logInfo(message, message2, config, logger) - 新的方式
  * 2. logInfo(message, message2) - 兼容旧的调用方式（需要在apply函数中设置全局变量）
  * @param {string} message - 主要消息
  * @param {string} message2 - 可选的附加消息或null
  * @param {Object} config - 配置对象（可选）
  * @param {Object} logger - 日志记录器（可选）
  */
 function logInfo(message, message2, config, logger) {
     if (arguments.length <= 2) {
         if (typeof global !== 'undefined' && global._musicPluginConfig && global._musicPluginLogger) {
             config = global._musicPluginConfig;
             logger = global._musicPluginLogger;
         } else {
             return;
         }
     }
      
     if (config && config.loggerinfo && logger) {
         if (message2) {
             logger.info(`${message}${message2}`);
         } else {
             logger.info(message);
         }
     }
 }

 module.exports = {
     generateSongListImage,
     logInfo
 };