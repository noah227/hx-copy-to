# 文件复制

> 右键 > 复制文件（夹）到【某处】

![](README_files/1.jpg)

## 功能特性
* 复制文件
* 复制文件夹
* 多文件复制（暂不支持）
	* 多文件复制指的是选中多个文件，然后右键进行的复制
	* 此功能后续更新
	
* 支持文件忽略
	* 设置`工具 > 插件配置 > 文件复制`
		* 复制时是否继承`.gitignore`的设定
		
> 注意：`排除`是针对文件夹复制的，**且只匹配文件夹下级文件**；如直接右键复制`node_modules`，即使`.gitignore`有排除，实际操作也不会排除`node_modules`本身

## 常见问题

### 错误 EPERM: operation not permitted, symlink 'xxx' -> 'xxx'

以管理员权限启动HBuilderX即可

### node_modules复制出现错误如 Invalid src or dest: cp returned EINVAL  (cannot copy xxx ...

此问题多出现在pnpm管理的node_modules复制，现在插件内尚未做处理。

> 非必要，一般不建议复制node_modules