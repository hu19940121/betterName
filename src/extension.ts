import * as vscode from 'vscode';
import axios from 'axios';

// 命名风格类型
type NamingStyle = 'camelCase' | 'snake_case' | 'PascalCase';

// 历史记录项接口
interface HistoryItem {
	chineseText: string;       // 原中文文本
	variableName: string;      // 转换后的变量名
	style: NamingStyle;        // 使用的命名风格
	timestamp: number;         // 转换时间戳
}

// 全局变量，存储扩展上下文
let extensionContext: vscode.ExtensionContext;

// 历史记录状态栏项
let historyStatusBarItem: vscode.StatusBarItem;

// 激活插件
export function activate(context: vscode.ExtensionContext) {
	console.log('插件 "bettername" 已激活');

	// 保存扩展上下文
	extensionContext = context;

	// 创建历史记录状态栏项
	historyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	historyStatusBarItem.text = '$(history) 变量命名历史';
	historyStatusBarItem.tooltip = '查看变量命名历史记录';
	historyStatusBarItem.command = 'bettername.showHistory';
	historyStatusBarItem.show();
	context.subscriptions.push(historyStatusBarItem);

	// 注册三个命令，对应三种命名风格（调整顺序，驼峰命名放在最前）
	const camelCaseCommand = vscode.commands.registerCommand('bettername.convertToCamelCase', () => {
		convertToVariableName('camelCase');
	});

	const snakeCaseCommand = vscode.commands.registerCommand('bettername.convertToSnakeCase', () => {
		convertToVariableName('snake_case');
	});

	const pascalCaseCommand = vscode.commands.registerCommand('bettername.convertToPascalCase', () => {
		convertToVariableName('PascalCase');
	});

	// 注册历史记录相关命令
	const showHistoryCommand = vscode.commands.registerCommand('bettername.showHistory', showHistory);
	const clearHistoryCommand = vscode.commands.registerCommand('bettername.clearHistory', clearHistory);

	// 将命令添加到上下文订阅中（调整顺序，确保与右键菜单顺序一致）
	context.subscriptions.push(camelCaseCommand);
	context.subscriptions.push(snakeCaseCommand);
	context.subscriptions.push(pascalCaseCommand);
	context.subscriptions.push(showHistoryCommand);
	context.subscriptions.push(clearHistoryCommand);
}

// 转换为变量名的主函数
async function convertToVariableName(style: NamingStyle) {
	// 获取活动编辑器
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('没有打开的编辑器');
		return;
	}

	// 获取选中的文本
	const selection = editor.selection;
	const text = editor.document.getText(selection);
	
	if (!text) {
		vscode.window.showErrorMessage('请先选择要转换的中文文本');
		return;
	}

	// 创建状态栏项
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.text = `$(sync~spin) 正在转换为${getStyleDisplayName(style)}...`;
	statusBarItem.show();

	try {
		// 调用API转换文本
		const variableName = await convertChineseToVariableName(text, style);
		
		// 替换选中的文本
		await editor.edit(editBuilder => {
			editBuilder.replace(selection, variableName);
		});

		// 保存到历史记录
		saveToHistory(text, variableName, style);
		
		// 显示成功消息
		vscode.window.showInformationMessage(`已转换为${getStyleDisplayName(style)}: ${variableName}`);
	} catch (error) {
		vscode.window.showErrorMessage(`转换失败: ${error instanceof Error ? error.message : String(error)}`);
	} finally {
		// 无论成功还是失败，都确保隐藏状态栏项
		statusBarItem.hide();
		statusBarItem.dispose();
	}
}

// 调用DeepSeek API将中文转换为变量名
async function convertChineseToVariableName(chineseText: string, style: NamingStyle): Promise<string> {
	// 获取API密钥
	const config = vscode.workspace.getConfiguration('bettername');
	const apiKey = config.get<string>('apiKey');
	
	if (!apiKey) {
		throw new Error('请在设置中配置DeepSeek API密钥');
	}

	try {
		// 构建优化后的提示词
		const prompt = `你是一位精通编程的命名专家。请将以下中文描述转换为适合在代码项目中使用的变量名，使用${style}风格：

中文描述：${chineseText}

要求：
1. 变量名要简洁但清晰，通常使用2-3个词，优先使用常见简写
2. 去掉不必要的修饰词（如"系统"、"模块"等），但保留区分性信息
3. 平衡简洁性和可读性，确保其他开发者能理解变量的用途
4. 使用行业通用缩写（如number→num, count→cnt, message→msg）
5. 只返回变量名，不要有任何其他文字或解释

命名风格：
- camelCase：第一个单词首字母小写，后续单词首字母大写（例如：userName）
- snake_case：所有单词小写，用下划线连接（例如：user_name）
- PascalCase：所有单词首字母大写（例如：UserName）

优秀变量名示例：
- "用户姓名" → "userName"
- "订单支付状态" → "payStatus"（去掉了"订单"这个上下文信息）
- "用户登录密码" → "loginPwd"（使用了常见缩写）
- "系统管理员权限" → "adminAuth"（保留核心概念）
- "商品库存数量" → "stockCount"（简洁且表达完整）`;
		// 调用DeepSeek API
		const response = await axios.post(
			'https://api.deepseek.com/v1/chat/completions',
			{
				model: 'deepseek-chat',
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.1, // 使用较低温度，但保留一些创造性
				max_tokens: 50
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				}
			}
		);

		// 提取变量名
		const variableName = response.data.choices[0].message.content.trim();
		return variableName;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(`API请求失败: ${error.response?.data?.error?.message || error.message}`);
		}
		throw error;
	}
}

// 保存历史记录
function saveToHistory(chineseText: string, variableName: string, style: NamingStyle): void {
	// 获取历史记录限制数量
	const config = vscode.workspace.getConfiguration('bettername');
	const historyLimit = config.get<number>('historyLimit') || 20;

	// 创建历史记录项
	const historyItem: HistoryItem = {
		chineseText,
		variableName,
		style,
		timestamp: Date.now()
	};

	// 获取现有历史记录
	const history = extensionContext.globalState.get<HistoryItem[]>('history', []);
	
	// 添加新记录到开头
	history.unshift(historyItem);
	
	// 如果超出限制，删除最旧的记录
	if (history.length > historyLimit) {
		history.splice(historyLimit);
	}
	
	// 保存更新后的历史记录
	extensionContext.globalState.update('history', history);
}

// 显示历史记录
async function showHistory(): Promise<void> {
	// 获取历史记录
	const history = extensionContext.globalState.get<HistoryItem[]>('history', []);
	
	if (history.length === 0) {
		vscode.window.showInformationMessage('暂无历史记录');
		return;
	}
	
	// 创建QuickPick项
	const items = history.map(item => {
		const date = new Date(item.timestamp);
		const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
		
		return {
			label: item.variableName,
			description: `${item.chineseText} (${getStyleDisplayName(item.style)})`,
			detail: formattedDate,
			item
		};
	});
	
	// 显示QuickPick
	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: '选择历史记录项复制到剪贴板',
		matchOnDescription: true,
		matchOnDetail: true
	});
	
	// 如果选择了某项，复制到剪贴板
	if (selected) {
		await vscode.env.clipboard.writeText(selected.label);
		vscode.window.showInformationMessage(`已复制 "${selected.label}" 到剪贴板`);
	}
}

// 清除历史记录
async function clearHistory(): Promise<void> {
	// 获取确认
	const confirmation = await vscode.window.showWarningMessage(
		'确定要清除所有历史记录吗？',
		{ modal: true },
		'确定'
	);
	
	if (confirmation === '确定') {
		await extensionContext.globalState.update('history', []);
		vscode.window.showInformationMessage('历史记录已清除');
	}
}

// 获取命名风格的显示名称
function getStyleDisplayName(style: NamingStyle): string {
	switch (style) {
		case 'camelCase':
			return '驼峰命名';
		case 'snake_case':
			return '蛇形命名';
		case 'PascalCase':
			return '帕斯卡命名';
		default:
			return style;
	}
}

// 插件停用时的处理函数
export function deactivate() {
	// 隐藏状态栏项
	if (historyStatusBarItem) {
		historyStatusBarItem.hide();
		historyStatusBarItem.dispose();
	}
}
