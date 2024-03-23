var hx = require("hbuilderx");
const dialog = require("node-file-dialog")
const path = require("path")
const fs = require("fs")
const {
	isMatch
} = require("matcher-cjs")

const readGitIgnore = (context) => {
	const wsFolder = context.workspaceFolder.uri.fsPath
	const gitIgnorePath = path.resolve(wsFolder, ".gitignore")
	if (!fs.existsSync(gitIgnorePath)) return console.warn(`${gitIgnorePath}不存在，已取消过滤`)
	const s = fs.readFileSync(gitIgnorePath, {
		encoding: "utf8"
	})
	return s.split("\r").reduce((dataList, line) => {
		line = line.trim()
		if (line && !line.startsWith("#")) dataList.push(line)
		return dataList
	}, [])
}

module.exports = (context) => {
	const fsPath = path.resolve(context.fsPath)

	dialog({
		type: "directory"
	}).then(dirList => {
		if (dirList.length) {
			const dir = dirList[0]
			const dest = path.join(dir, path.basename(fsPath))
			console.log(fsPath, "________", dir, "___", dest)

			const {
				Helper
			} = require("hx-configuration-helper")
			const h = new Helper(__dirname)
			const keyMap = require("./helper.json")

			const action = () => {
				const inheritGitIgnore = h.getItem(keyMap.inheritGitIgnore)
				let gitIgnoreList = null
				// 读取gitignore
				if (inheritGitIgnore) {
					gitIgnoreList = readGitIgnore(context)
					console.log("已读取.gitignore：", gitIgnoreList)
				}
				
				/**
				 * @param {string} src
				 */
				const ignoreFilter = (src, dest) => {
					if (!inheritGitIgnore) return true
					else if (!gitIgnoreList) return true
					else if (!gitIgnoreList.length) return true
					else {
						const _ = src.replace(/(^\\\\\?\\)?/, "").replace(fsPath + "\\", "")
							.replaceAll(/\\/g, "/")
						const filterMatched = gitIgnoreList.find(s => _.startsWith(s) || isMatch(_,
							s))
						if (filterMatched) {
							console.log(`根据.gitignore，已过滤：${_}`)
						} else {
							hx.window.setStatusBarMessage(`复制中：${src} -> ${dest}`)
							return true
						}
					}
				}

				const _start = Date.now()
				// todo cancel ?
				fs.cp(fsPath, dest, {
					recursive: true,
					/**
					 * @param {string} src
					 * @param {string} dest
					 */
					filter(src, dest) {
						return ignoreFilter(src, dest)
					}
				}, err => {
					hx.window.clearStatusBarMessage()
					if (err) {
						hx.window.showErrorMessage(err.message, ["复制错误"]).then(button => {
							if (button) {
								hx.env.clipboard.writeText(err.message).then(() => {
									hx.window.showInformationMessage(
										"已复制错误信息到剪切板")
								})
							}
						})
					} else {
						hx.window.showInformationMessage(`
								<div>已复制 | 耗时<b>${Date.now() - _start}</b>ms</div>
								<div style="display: flex;">
									<span>从：</span>
									<b>${fsPath}</b>
								</div>
								<div style="display: flex;">
									<span>到：</span>
									<b>${dest}</b>
								</div>
							`, ["关闭", "打开路径"]).then(button => {
							if (button === "打开路径") {
								const {
									exec
								} = require("child_process")
								exec(`explorer.exe /e /select,${path.resolve(dir)}`)
							}
						})
					}
				})
			}
			if (fs.existsSync(dest) && h.getItem(keyMap.remindIfExist)) {
				hx.window.showMessageBox({
					title: "提示",
					text: `
						<div>
							检测到目标<b>${dest}</b>已存在，是否继续操作？
						</div>
					`,
					buttons: ["取消", "继续"]
				}).then(button => {
					if (button === "继续") {
						action()
					}
				})
			} else action()
		}
	}).catch(e => {
		// console.error(e) // 没有选中
	})
}