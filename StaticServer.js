'use strict'

// 引入模块
const http = require('http')
const fs = require('fs')
const url = require('url')
const mime = require('mime')

// 创建并导出 SstaticServer 类
module.exports = class SstaticServer {
    // 构造函数
    // 初始化时自动调用
    constructor(options) {
        this.currentServer = null
        this.options = {
            port: 8080,  // 服务器启动端口
            host: '127.0.0.1', // 服务器启动IP
            filePath: './public', // 静态文件根目录
            homePage: '/index.html' // 指定首页文件
        }

        // 把传入构造函数的参数中的值加入到options中
        for (let key in options) {
            this.options[key] = options[key]
        }
    }

    // 服务器启动函数
    run() {
        let self = this

        // 通过 http.createServer 创建 http 服务
        this.currentServer = http.createServer((req, res) => {
            let tmpUrl = url.parse(req.url).pathname // 解析客户端请求访问的url地址
            let reqUrl = tmpUrl === '/' ? self.options.homePage : tmpUrl // 如果用户访问的是 '/'首页，则自动指定读取首页文件，默认是'index.html'
            let filePath = self.options.filePath + reqUrl

            // Promise 支持链式调用
            // 这样会使代码的逻辑更加清晰
            // 而不必层层嵌套回调函数
            // Promise 链式调用的条件是
            // 每个 then() 方法都 return 一个 Promise 对象
            // 后面才能跟着调用 then() 方法或者 catch() 方法
            // catch() 方法也要 return 一个 Promise 对象
            // 后面才能接着调用 then() 方法或者 catch() 方法

            // 检测文件是否存在
            self.checkFilePromise(filePath)
            .then(() => {
                // 文件存在则尝试读取文件
                return self.readFilePromise(filePath)
            })
            .then((data) => {
                // 文件读取成功
                // 发送文件数据
                self.sendData(res, data, reqUrl)
            })
            .catch(() => {
                // 统一处理错误
                // 文件不存在或者读取失败
                self.catch404(res)
            })
        })
        .listen(this.options.port, () => {
            console.log('listening ' + this.options.port)
        })
    }

    // 关闭服务
    close() {
        this.currentServer.close(() => {
            console.log('Server closed!')
        })
    }

    // 发送文件内容
    sendData(res, data, url) {
        res.writeHead(200, {'Content-Type': mime.getType(url.substring(1))})
        res.write(data)
        res.end()
    }

    // 捕获404错误
    catch404(res) {
        res.writeHead(404, {'Content-Type': 'text/plain'})
        res.write('Error 404, Resouce not found.')
        res.end()
    }

    // 使用 promise包装文件读取方法
    readFilePromise(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    // 使用 Promise 包装文件是否可读取的方法
    // fs.access 用于检测文件是否可读取
    checkFilePromise(path) {
        return new Promise((resolve, reject) => {
            fs.access(path, fs.R_OK, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve('success!');
                }
            });
        });
    }
}


