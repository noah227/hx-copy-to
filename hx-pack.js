const cozip = require("cozip")
const publishName = `${require("./package.json").name}.zip`

;(() => {
    cozip(publishName, [
        ["./extension.js", false],
        ["./main.js", false],
        ["./config.helper.js", false],
        ["./package.json", false],
        ["./node_modules/commander", true],
        ["./node_modules/hx-configuration-helper", true],
        ["./node_modules/matcher-cjs", true],
        ["./node_modules/node-file-dialog", true],
    ], err => {
        if (err) console.error(err)
        else {
            console.log("打包完成, 文件大小", (require("fs").statSync(publishName).size / 1024).toFixed(2), "KB")
        }
    })
})()
