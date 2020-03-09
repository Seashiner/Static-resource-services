const http = require('http');
const urlTool = require('url');
const fs = require('fs');
const ejs = require('ejs');
const mimes = require('./mimes/mimes');
const zlib = require('zlib');
const etag = require('etag');
const config = require('./config/config');
const openBrowser = require('./libs/open');
const bopn = require('better-opn');


class Server{

    constructor(options){
        this.config = Object.assign(config, options);
    }

    run(){
        //创建服务
        const server = http.createServer((request, response) => {
            let pathname = decodeURI(urlTool.parse(request.url).pathname);
            let root = this.config.root;
            let filePath = root + pathname;
            if (pathname === '/favicon.ico') {
                return
            }
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    response.statusCode = '404';
                    console.log(err);
                    response.end('<h1>404 Not Fount</h1>')
                } else {
                    if (stats.isDirectory()) {
                        fs.readdir(filePath, (err, data) => {
                            if (err) throw err;
                            response.setHeader('content-type', 'text/html;charset=utf-8');
                            ejs.renderFile(__dirname + '/views/directory.ejs', {
                                files: data,
                                pathname: pathname
                            }, (err, data) => {
                                if (err) {
                                    response.end(err)
                                } else {
                                    response.end(data)
                                }
                            });
                        })
                    } else if (stats.isFile()) {

                        //配置
                        // let config = {
                        //     forceCache: 0, //强制缓存
                        //     cacheTime: 60, //强制缓存的声明时间
                        //     xieCache: 0 //协商缓存是否开启
                        // };

                        if (config.xieCache) {
                            //判断缓存
                            //提取 If-None-Match   If-Modified-Since
                            let etagId = request.headers['if-none-match'];
                            let modifyTime = request.headers['if-modified-since'];

                            //比对
                            if (etagId === etag(stats) || modifyTime === stats.mtime.toUTCString()) {
                                response.statusCode = 304;
                                response.end('');
                                return;
                            }
                        }


                        //筛选出文件后缀
                        let suffix = pathname.split('.').pop();
                        // 判断 mimes 中是否包含后缀属性
                        if (mimes[suffix]) {
                            response.setHeader('content-type', 'mimes[suffix]')
                        } else {
                            // text/plain表示不按照任何模板解析，原文呈现
                            response.setHeader('content-type', 'text/plain;charset=utf-8')
                        }
                        //获取请求头中的压缩方式
                        let encodings = request.headers['accept-encoding'];

                        fs.readFile(filePath, (err, data) => {
                            if (err) throw err;
                            if (config.forceCache) {
                                //写入强制缓存 , 最大失效 60s
                                response.setHeader('cache-control', 'max-age =' + config.cacheTime);
                            }

                            //写入协商缓存
                            //生成当前资源的 Etag
                            let id = etag(stats);
                            //生成当前的资源的最后修改时间  Last-modified ,需要用 toUTCString 方法转换格式
                            let lastModified = stats.mtime.toUTCString();

                            if (config.xieCache) {
                                //设置响应头
                                response.setHeader('Etag', id);
                                response.setHeader('Last-modified', lastModified);
                            }

                            //判断获取的请求头中的压缩方式是否包含gzip
                            if (encodings.indexOf('gzip') !== -1) {
                                //设置相应头
                                response.setHeader('content-encoding', 'gzip');
                                //压缩数据
                                zlib.gzip(data, (err, data) => {
                                    if(err) throw err;
                                    response.end(data)
                                })
                            }

                        })
                    }
                }

            });

        });

        //启动服务
        server.listen(config.port, () => {
            console.log(`端口${this.config.port}启动成功 ... ...`);
            //自动打开浏览器
            // openBrowser('http://127.0.0.1:' + config.port);
            bopn('http://127.0.0.1:' + this.config.port);
        });
    }
}

module.exports = Server;








