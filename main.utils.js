const path = require("path")
const fs = require("fs")
const {
    isMatch
} = require("matcher-cjs");
const hx = require("hbuilderx")

/**
 * @param {string[] | string} context
 */
const getWsFolder = (context) => {
    return (context instanceof Array ? context[0] : context).workspaceFolder.uri.fsPath
}
/**
 * 读取.gitignore文件
 * @param {Object} context
 */
const readGitIgnore = (context) => {
    const wsFolder = getWsFolder(context)
    const gitIgnorePath = path.resolve(wsFolder, ".gitignore")
    if (!fs.existsSync(gitIgnorePath)) return console.warn(`${gitIgnorePath}不存在，已忽略过滤`)
    console.log(`读取.gitignore：${gitIgnorePath}`)
    const s = fs.readFileSync(gitIgnorePath, {
        encoding: "utf8"
    })
    return s.split("\r").reduce((dataList, line) => {
        line = line.trim()
        if (line && !line.startsWith("#")) dataList.push(line)
        return dataList
    }, [])
}

/**
 * 处理输出在statusBar上的路径
 */
const processCpMessage = (wsFolder, fsPath, dest) => {
    const _fsPath = path.relative(wsFolder, fsPath)
    return `${fsPath} -> ${dest}`
}

module.exports = {
    getWsFolder,
    readGitIgnore,
    /**
     * fs.cp/cpSync使用的filter
     */
    createCpFilter(wsFolder, gitIgnoreList) {
        /**
         * @param {string} fsPath
         * @param {string} src
         * @param {string} dest
         */
        const ignoreFilter = (fsPath, src, dest) => {
            if (!gitIgnoreList?.length) return true
            else {
                const _ = src.replace(/(^\\\\\?\\)?/, "").replace(fsPath + "\\", "")
                    .replaceAll(/\\/g, "/")
                const filterMatched = gitIgnoreList.find(s => _.startsWith(s) || isMatch(_,
                    s))
                if (filterMatched) {
                    console.log(`根据.gitignore，已过滤：${_}`)
                    hx.window.setStatusBarMessage(`已跳过：${_}`)
                } else {
                    // console.log("复制", src, processCpMessage(wsFolder, fsPath, dest))
                    hx.window.setStatusBarMessage(`复制中：${processCpMessage(wsFolder, src, dest)}`)
                    return true
                }
            }
        }
        return ignoreFilter
    },
    /**
     * 允许复制的
     */
    showErrorMessage(err) {
        const message = err?.message || "未知错误"
        hx.window.showErrorMessage(message, ["复制错误"]).then(button => {
            if (button) {
                hx.env.clipboard.writeText(message).then(() => {
                    hx.window.showInformationMessage("已复制错误信息到剪切板")
                })
            }
        })
    },
    /**
     * @param {string[]} fsPathList
     */
    createSuccessMessage(_start, fsPathList, dir) {
        let message = `<div>已复制 | 耗时<b>${Date.now() - _start}</b>ms</div>`
        // 单目标
        if (fsPathList.length === 1) {
            message += `
				<div style="display: flex;">
					<span>从：</span>
					<b>${fsPathList}</b>
				</div>
				<div style="display: flex;">
					<span>到：</span>
					<b>${dir}</b>
				</div>
			`
        }
        // 多目标
        else {
            message += `已复制${fsPathList.length}个文件到${dir}`
        }
        return message
    }
}
