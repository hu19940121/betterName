# BetterName

BetterName 是一个 VSCode 插件，用于将中文描述转换为合适的变量名。它利用 DeepSeek AI 模型，帮助开发者快速生成符合编程规范的变量名。

## 功能特点

- 将选中的中文文本转换为编程变量名
- 支持三种命名风格：
  - 驼峰命名 (camelCase)：如 `userName`
  - 蛇形命名 (snake_case)：如 `user_name`
  - 帕斯卡命名 (PascalCase)：如 `UserName`
- 简单易用的界面和命令
- 右键菜单快速访问
- 默认快捷键绑定
- 历史记录功能

## 使用方法

1. 在编辑器中选中中文文本（如"用户姓名"）
2. 使用以下任一方式触发转换：
   - 按下 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）打开命令面板
   - 在命令面板中输入 "BetterName" 并选择所需的命名风格
   - 右键点击选中的文本，在上下文菜单中选择 "BetterName 变量命名"，然后选择命名风格
   - 使用对应的快捷键直接转换（见下方快捷键列表）
3. 选中的中文文本将被替换为对应的变量名

## 命令列表

- `BetterName: 转换为驼峰命名 (camelCase)`：将选中文本转换为驼峰命名风格
- `BetterName: 转换为蛇形命名 (snake_case)`：将选中文本转换为蛇形命名风格
- `BetterName: 转换为帕斯卡命名 (PascalCase)`：将选中文本转换为帕斯卡命名风格
- `BetterName: 查看历史记录`：查看之前的转换历史记录
- `BetterName: 清除历史记录`：清除所有历史记录

## 快捷键

- 驼峰命名：`Ctrl+Alt+C`（Mac: `Cmd+Alt+C`）
- 蛇形命名：`Ctrl+Alt+S`（Mac: `Cmd+Alt+S`）
- 帕斯卡命名：`Ctrl+Alt+P`（Mac: `Cmd+Alt+P`）
- 查看历史记录：`Ctrl+Alt+H`（Mac: `Cmd+Alt+H`）

## 历史记录功能

插件会自动记录您转换过的变量名：

- 在状态栏的右侧可以看到历史记录按钮
- 点击历史记录按钮或使用快捷键 `Ctrl+Alt+H` 查看历史记录
- 从历史记录中选择一项，该变量名将被复制到剪贴板
- 历史记录会显示原中文文本、变量名和转换时间
- 默认保存最近 20 条记录，可在设置中修改

## 配置选项

在 VSCode 设置中，可以配置以下选项：

- `bettername.apiKey`：DeepSeek API 密钥（必填）
- `bettername.defaultNamingStyle`：默认命名风格（可选，默认为 `camelCase`）
- `bettername.historyLimit`：历史记录保存数量上限（可选，默认为 20）

## 配置步骤

1. 打开 VSCode 设置（文件 > 首选项 > 设置）
2. 搜索 "BetterName"
3. 填入您的 DeepSeek API 密钥
4. 按需调整其他配置项

## 安装要求

- Visual Studio Code 1.100.0 或更高版本
- DeepSeek API 密钥

## 隐私说明

本插件会将您选中的中文文本发送到 DeepSeek API 进行处理。请确保您不会发送敏感信息。

## 问题反馈

如果您遇到任何问题或有改进建议，请在 GitHub 仓库中提交 issue。

## 许可证

MIT
