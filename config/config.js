const argv = require('yargs').argv;

module.exports = {
    forceCache: 1, //强制缓存
    cacheTime: 60, //强制缓存的声明时间
    xieCache: 1, //协商缓存是否开启

    port: argv.port || 8000, //网站的端口号
    root: argv.root || process.cwd(), //网站的根目录
};