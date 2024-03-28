var hx = require("hbuilderx");
const dialog = require("node-file-dialog")
const path = require("path")
const fs = require("fs")

const {readGitIgnore, createCpFilter, createSuccessMessage, showErrorMessage, getWsFolder} = require("./main.utils.js");

/**
 * todo rename 复之前重命名文件
 */
module.exports = (context, rename = false) => {
    const wsFolder = getWsFolder(context)
    const fsPathList = []
    // 多选文件(夹)
    if (context instanceof Array) {
        fsPathList.push(...context.map(c => path.resolve(c.fsPath)))
    }
    // 单选文件(夹)
    else {
        fsPathList.push(path.resolve(context.fsPath))
    }

    dialog({
        type: "directory"
    }).then(dirList => {
        if (dirList.length) {
            const dir = dirList[0]

            const {
                Helper
            } = require("hx-configuration-helper")
            const h = new Helper(__dirname)
            const keyMap = require("./config.helper.js")

            const willRemindIfExist = h.getItem(keyMap.remindIfExist)
            const inheritGitIgnore = h.getItem(keyMap.inheritGitIgnore)
            let gitIgnoreList = null
            // 读取gitignore
            if (inheritGitIgnore) {
                gitIgnoreList = readGitIgnore(context)
                console.log("已读取.gitignore：", gitIgnoreList)
            }
            const ignoreFilter = createCpFilter(wsFolder, gitIgnoreList)

			// 放弃所有复制
			let abortAll = false
            const action = (fsPath) => {
                return new Promise((resolve, reject) => { 
                    const dest = path.join(dir, path.basename(fsPath))

                    console.log(fsPath, "________", dir, "___", dest)
					
                    const _action = () => {
						if(abortAll) return resolve("用户已选择了全部取消")
                        fs.cp(fsPath, dest, {
                            recursive: true,
                            /**
                             * @param {string} src
                             * @param {string} dest
                             */
                            filter(src, dest) {
                                return ignoreFilter(fsPath, src, dest)
                            }
                        }, err => {
                            err ? reject(err) : resolve(true)
                        })
                    }
                    if (willRemindIfExist && fs.existsSync(dest)) {
						let buttons = ["取消", "继续"]
						let defaultButton = 0
						if(fsPathList.length > 1) {
							buttons = ["全部取消", ...buttons]
							defaultButton = 1
						}
                        hx.window.showMessageBox({
                            title: "提示",
                            text: `
								<div>
									检测到目标<b>${dest}</b>已存在，是否继续操作？
								</div>
							`,
                            buttons,
							defaultButton
                        }).then(button => {
							switch(button) {
								case "全部取消":
									abortAll = true
									hx.window.setStatusBarMessage("用户已全部取消")
									resolve("用户已全部取消")
									break
								case "取消":E
									resolve("用户已取消")
									break
								case "继续":
									_action()
									break;
							}
                        })
                    } else _action()
                })
            }
            try {
                const _start = Date.now()
                const cpList = fsPathList.map(fsPath => {
                    return action(fsPath)
                })
				
                Promise.all(cpList).then(() => {
                    hx.window.showInformationMessage(createSuccessMessage(_start, fsPathList, dir), ["关闭", "打开路径"]).then(button => {
                        if (button === "打开路径") {
                            const {
                                exec
                            } = require("child_process")
                            exec(`explorer.exe /e /select,${path.resolve(dir)}`)
                        }
                    })
                }).catch(err => {
                    showErrorMessage(err)
                }).finally(() => {
                    hx.window.clearStatusBarMessage()
                })
            } catch (err) {
                showErrorMessage(err)
            } finally {
                hx.window.clearStatusBarMessage()
            }
        }
    }).catch(e => {
        console.warn(e) // 没有选中
    })
}
