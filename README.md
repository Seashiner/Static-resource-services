# 静态资源服务
## 目标
封装一个 NPM 包，可以全局运行，可以局部安装，实现静态资源服务



## 使用教程


1. 全局安装

    ```shell script
    npm install sea-static -g
    ```

2. 默认启动

    ```
    srs  （若是局部安装，则不可以使用此命令）
    
    或者用 node 启动：
    node xxx.js  
    ```

3. 带参数启动
    ```shell script
    srs --port=8000 --root=e:/
    
    //可以运行命令行参数，来设置端口号及目录
    node xxx.js  --port=2323 --root=e:/
    ```

4. 基本使用
    ```js
    const Server = require('sea-static');
    
    const server = new Server();
    
    serven();
    ```


​    
4. 传参使用

    ```js
    const Server = require('static-server');
    //可以传参数，自定义设置port 端口号 和 root 目录;
    //不传参数默认端口号为 8000 ，目录为命令行所在目录
    const server = new Server({port:8080, root: './public'});
    
    server.run();
    ```



## 搭建过程

1、确定所在路径，判断路径下是文件还是文件夹，若是文件夹，显示出该文件夹下面的目录；若是文件，显示出文件内容。

### nodemon

自动重启 node 服务的工具

```
npm install  -g  nodemon  //安装
```

```
nodemon server.js   //使用
```

### 代码

```js
const http = require('http');
const urlTool = require('url');
const fs = require('fs');

const server = http.createServer((request,response) => {
    //这里需要用 decodeURI 方法对中文目录进行解码，否则会报错
    let pathname = decodeURI(urlTool.parse(request.url).pathname);
    let root = __dirname + '/publish';
    let filePath = root + pathname;
    if(pathname === '/favicon.ico'){
        return
    }
    fs.stat(filePath , (err , stats) => {
        if(err) {
            response.statusCode = '404';
            response.end('<h1>404 Node Not Found</h1>')
        }else{
            if(stats.isDirectory()){
                fs.readdir(filePath , (err , data) => {
                    if(err) throw err;
                    response.setHeader('content-type','text/html;charset=utf-8');
                    let content = `<h1>${pathname}</h1>
                    <ul>`;
                    for(let i = 0; i < data.length ; i++){
                        content += `<li><a href = #>${data[i]}</a></li>`
                    }
                    content += `</ul>`;
                    response.end(content)
                })
            }else if(stats.isFile()){
                fs.readFile(filePath , (err , data) => {
                    if(err) throw err;
                    response.end(data.toString())
                })
            }
        }

    });

});

server.listen(8001,() => {
    console.log('端口8001启动成功 ... ...')
});
```



2、优化代码：通过 ejs （模板引擎）将 html 分离

### ejs

官网 : https://ejs.bootcss.com

```
npm install ejs  // 安装
```

```
const ejs = require('ejs')  // 引入
```

### 代码

新建 views / directory.ejs :

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <h1>Index of <%= pathname %></h1>
    <ul>
        <% for(let i = 0 ; i < files.length ; i++){ %>
        <li><a href = '<%= pathname %><%= pathname === '/' ? '' : '/' %><%= files[i] %>'> <%= files[i] %> </a></li>
        <% } %>
    </ul>
</body>
</html>
```

server.js :

```
const http = require('http');
const urlTool = require('url');
const fs = require('fs');
const ejs = require('ejs');

const server = http.createServer((request,response) => {
    let pathname = urlTool.parse(request.url).pathname;
    let root = __dirname + '/publish';
    let filePath = root + pathname;
    if(pathname === '/favicon.ico'){
        return
    }
    fs.stat(filePath , (err , stats) => {
        if(err) {
            response.statusCode = '404';
            response.end('<h1>404 Node Not Found</h1>')
        }else{
            if(stats.isDirectory()){
                fs.readdir(filePath , (err , data) => {
                    if(err) throw err;
                    response.setHeader('content-type','text/html;charset=utf-8');
```

```js
					ejs.renderFile(__dirname + '/views/directory.ejs' , {files : data, 	pathname : pathname} , (err,data ) => {
                        if(err){
                            response.end('500')
                        }else {
                            response.end(data)
                        }
                    });
```

```
			 })
           }else if(stats.isFile()){
                fs.readFile(filePath , (err , data) => {
                    if(err) throw err;
                    response.end(data.toString())
                })
           }
        }

    });

});

server.listen(8001,() => {
    console.log('端口8001启动成功 ... ...')
});
```

3、通过  mime ，根据文件后缀动态设置 content-type

- 新建mimes / mimes.json

```json
{
    "css":"text/css",
    "gif":"image/gif",
    "html":"text/html;charset=utf-8",
    "ico":"image/x-icon",
    "jpeg":"image/jpeg",
    "jpg":"image/jpeg",
    "js":"application/x-javascript;charset=utf-8",
    "json":"application/json;charset=utf-8",
    "pdf":"application/pdf",
    "png":"image/png",
    "svg":"image/svg+xml",
    "swf":"application/x-shockwave-flash",
    "tiff":"image/tiff",
    "txt":"txt/plain;charset=utf-8",
    "wav":"audio/x-wav",
    "wma":"audio/x-ms-wma",
    "wmv":"video/x-ms-wmv",
    "xml":"text/xml"
}
```

- 在 server.js 中引入  mimes.json  

`const mimes = require('./mines/mines');`

```js
server.js : 	//筛选出文件后缀
                let suffix = pathname.split('.').pop();
                // 判断 mimes 中是否包含后缀属性
                if(mimes[suffix]){
                    response.setHeader('content-type','mimes[suffix]')
                }else{
                    // text/plain表示不按照任何模板解析，原文呈现
                    response.setHeader('content-type','text/plain;charset=utf-8')
                }
```

4、对服务器返回的结果  **压缩** ，体积变小，相应速度会变快

- 压缩介绍

客户端向服务器发送请求时，会在请求头当中指明接受的压缩方式有哪些，一般为三种：

```
content-encoding : gzip , deflate , br
```

服务器在返回结果的时候，会在响应头当中指明响应体的内容会由具体哪一种方式压缩的，浏览器按照指定的压缩方式去解压内容，然后在页面当中呈现数据

- 在请求头中获取客户端支持的压缩方式

  ```
   let encodings = request.headers['accept-encoding'];
  ```

- 设置响应的压缩方式

  - gzip

    ```js
    			fs.readFile(filePath , (err , data) => {
                        if(err) throw err;
                        //判断获取的请求头中的压缩方式是否包含gzip
                        if(encodings.indexOf('gzip') !== -1){
                            //设置相应头
                            response.setHeader('content-encoding','gzip');
                            //压缩数据
                            zlib.gzip(data,(err , data) => {
                                response.end(data)
                            })
                        }
    
                    })
    ```

  - deflate

    ```js
    				fs.readFile(filePath , (err , data) => {
                        if(err) throw err;
                        //判断获取的请求头中的压缩方式是否包含gzip
                        if(encodings.indexOf('deflate') !== -1){
                            response.setHeader('content-encoding','deflate');
                            //压缩数据
                            zlib.deflate(data,(err , data) => {
                                response.end(data)
                            })
                        }
    
                    })
    ```

  - br

    ```js
    				fs.readFile(filePath , (err , data) => {
                        if(err) throw err;
                        //判断获取的请求头中的压缩方式是否包含gzip
                        if(encodings.indexOf('br') !== -1){
                            response.setHeader('content-encoding','br');
                            //压缩数据
                            zlib.BrotliCompress(data,(err , data) => {
                                response.end(data)
                            })
                        }
    
                    })
    ```

5、缓存

### 介绍

* 缓存可以重用已获取的资源能够有效的提升网站与应用的性能
* Web 缓存能够减少延迟与网络阻塞，进而减少显示某个资源所用的时间
* 借助 HTTP 缓存，Web 站点变得更具有响应性
* 缓存分为两点：
  * 强制缓存
  * 协商缓存

### 强制缓存

当客户端向服务端发送第一次请求时，服务端返回数据时  **响应头** 会包含一个   **cache-control**   的标记，cache-control 中设置了最大时效；当客户端需要相同数据时，客户端浏览器会检测数据是否在失效时间内，如果还没有失效，则只需在本地读取缓存，而不用向服务端发送请求，这就是强缓存；如果已经失效，则需要再次向服务端发送请求。

简单来讲就是强制浏览器使用当前缓存

- 通过服务器端设置  **响应头**  字段来控制

  - expires (http1.0)

  - cache-control (http1.1)

  - cache-control 优先级比 expires 高

    

    #### cache-control

    - max-age (单位s)   缓存的最大有效时间
    - no-cache        使用协商缓存
    - no-store        不使用任何缓存
    - public          （客户端、代理服务器）缓存所有资源
    - private         默认值，只有客户端缓存所有资源

    #### expires

    日期（new Date().toGMTString()） 缓存的过期时间

### 协商缓存

协商缓存就是强制缓存失效后，浏览器携带缓存标识向服务器发起请求，由服务器根据缓存标识决定是否使用缓存的过程

- 借助响应头和请求头来实现

  服务器端给客户端返回

  - Last-modified        记录服务器返回资源的最后修改时间
  - Etag                         当前文件的唯一标识（由服务器生成）

  客户端给服务器端请求

  - If-Modified-Since   记录服务器返回资源的最后修改时间
  - If-None-Match	   当前文件的唯一标识（由服务器生成）

> Etag / If-None-Match 优先级比 Last-Modified / If-Modified-Since 高。

### 缓存工作流程

* 第一次：由服务器返回cache-control 、 Etag  和 Last-modified 字段通过响应头方式返回

  ```
  安装Etag : npm install etag
  ```

  ```
  引入Etag : const etag = require('etag')
  ```

* 第二次：下次浏览器请求时，携带了If-None-Match（值为上一次的 Etag 的值）和If-Modified-Since（值为上一次的 Last-modified 的值）发送给服务器 （这是浏览器的自动行为，不需要写任何代码）

* 服务器检查 If-None-Match 是否等于最新计算出的 Etag 的值，如果相等，说明数据没有变过，服务器给客户端返回一个 304 状态码，响应体可以为空，浏览器接收到这个 304 状态码后，就不会向浏览器发请求了，而是直接走浏览器缓存 ；不相等，说明数据变了，服务器给客户端返回一个 200 状态码，并将新数据放在响应体返回给客户端

* 如果没有 If-None-Match，才看 If-Modified-Since 的值，检查 If-None-Since 是否等于最新的 Last-modified  的值，如果相等直接走浏览器本地缓存，不相等就返回新的资源

### 缓存返回值

* 200(from memory cache)
	* 命中强制缓存
	* 缓存来自于内存
* 200(from disk cache)
	* 命中强制缓存
	* 缓存来自于磁盘
* 304 Not Modified
	* 命中协商缓存
* 200 
	* 没有命中缓存



### 强制缓存的代码实现

```js
response.setHeader('cache-control','max-age = 60'); // 最大时效 60s
```

【注意】使用浏览器地址栏输入 url 访问资源，不能强制缓存；只有引用的外部资源才能使用强制缓存（例如 引用的 css 和 js 以及图片）

![image-20200308172259342](E:\尚硅谷课程\git\课件\assets\image-20200308172259342.png)

### 协商缓存的代码实现

- 安装Etag :

```
 npm install etag
```

- 引入Etag : 

```
const etag = require('etag')
```

- 生成当前资源的 Etag 和 Last- Modified :

由于每个数据的 stats 是唯一的，所以可以根据 stats 来生成 Etag , 而 stats 中包含数据的最后修改时间，即 stats.mtime （2020-02-14T14:17:12.115Z ），但是时间格式不正确，需要用 toUTCString 方法修改格式（ Fri, 14 Feb 2020 14:17:12 GMT ）

```js
//生成当前资源的 Etag
let id = etag(stats);

//生成当前的资源的最后修改时间  Last-modified ,需要用 toUTCString 方法转换格式
let lastModified = stats.mtime.toUTCString();

//设置响应头
response.setHeader('Etag', id);
response.setHeader('Last-modified', lastModified );
```

- 将If-None-Match 与 Etag 进行对比

```js
//提取 If-None-Match   If-Modified-Since
let etagId = request.headers['if-none-match'];
let modifyTime = request.headers['if-modified-since'];

//比对
if (etagId === etag(stats) || modifyTime === stats.mtime.toUTCString()) {
    response.statusCode = 304;
    response.end('');
    return;
}
```

- 缓存的配置设置与控制

根据配置来决定是否开启缓存以及缓存的时间

```js
let config = {
    forceCache: 1, //强制缓存
    cacheTime: 60, //强制缓存的声明时间
    xieCache: 1, //协商缓存是否开启

    port: 8001, //网站的端口号
    root: __dirname +'/../publish', //网站的根目录
};

if(config.forceCache){
    ... ...
}
if(config.xieCache){
    ... ...
}
```



6、配置文件的抽离

新建 config / config.js

```js
module.exports = {
    forceCache: 1, //强制缓存
    cacheTime: 60, //强制缓存的声明时间
    xieCache: 1, //协商缓存是否开启

    port: 8001, //网站的端口号
    root: __dirname +'/../publish', //网站的根目录
};
```

在 server.js 中引入 config ，并替换相应的变量

```
const config = require('./config/config');
```



7、 输入自定义命令，自动打开浏览器

方式一：

新建 libs / open.js :

```js
const child_process = require('child_process');

module.exports = function (url) {
    let cmd = '';
    if (process.platform == 'win32') {
        cmd = 'start chrome';
    } else if (process.platform == 'linux') {
        cmd = 'xdg-open';
    } else if (process.platform == 'darwin') {
        cmd = 'open';
    }
    child_process.exec(`${cmd} "${url}"`);
}
```

server.js

```js
引入 open.js : const openBrowser = require('./libs/open'); 
设置自动打开浏览器功能 ： openBrowser('http://127.0.0.1:' + config.port);
```



方式二：

```js
//安装better-opn : 
npm install better-opn

// 引入better-opn ：
const bopn = require('better-opn');

//设置 :
bopn('http://127.0.0.1:' + config.port);
```



8、命令行传参

```
node自带：process.argv
```

### yargs

安装yargs : 

```js
npm install yargs
```

配置 config.js : 

```js
const argv = require('yargs').argv;

module.exports = {
    forceCache: 1, //强制缓存
    cacheTime: 60, //强制缓存的声明时间
    xieCache: 1, //协商缓存是否开启

    port: argv.port || 8000, //网站的端口号
    root: argv.root || __dirname +'/../publish', //网站的根目录
};
```

运行：

```
node server.js --port=8001
```



9、暴露 Server 类

```js
class Server{

    constructor(options){
        this.config = Object.assign(config, options);
    }
    
    run(){
    	... ...
    }
 }
 
 module.exports = Server;
```

【注意】要把 server.js 中的config 替换为 this.config



10、创建全局命令

- 创建 bin / cmd :

```
#!/usr/bin/env node

```

- 在 package.json 文件下配置

```
"bin" : {
	"srs" : "./bin/cmd"
}
```

**全局**安装后可以直接输入 srs 启动服务



11、获取执行命令时的目录  process.cwd

配置 config.js : 

```js
const argv = require('yargs').argv;

module.exports = {
    forceCache: 1, //强制缓存
    cacheTime: 60, //强制缓存的声明时间
    xieCache: 1, //协商缓存是否开启

    port: argv.port || 8000, //网站的端口号
    root: argv.root || process.cwd(), //网站的根目录
};
```












































