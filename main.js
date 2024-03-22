var hx = require("hbuilderx");
const dialog = require("node-file-dialog")
const path = require("path")
const fs = require("fs")

module.exports = (context) => {
	// const {Helper} = require("hx-configuration-helper")
	// const h = new Helper(__dirname)
	// const keyMap = require("./helper.json")
	// h.getItem(keyMap.remindIfExist)

	// return

	const fsPath = path.resolve(context.fsPath)
	dialog({
		type: "directory"
	}).then(dirList => {
		if (dirList.length) {
			const dir = dirList[0]
			const dest = path.join(dir, path.basename(fsPath))
			console.log(fsPath, "________", dir, "___", dest)
			const action = () => {
				const _start = Date.now()
				// todo cancel ?
				fs.cp(fsPath, dest, {
					recursive: true,
					filter(src, dest) {
						hx.window.setStatusBarMessage(`复制中：${src} -> ${dest}`)
						return true
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
			if (fs.existsSync(dest) && hx.workspace.getConfiguration(require("./package.json").id).get(
					"remindIfExist")) {
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
