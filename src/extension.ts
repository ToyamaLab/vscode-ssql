import * as vscode from 'vscode';
import * as child_process from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	console.log('VScode extension for SuperSQL is now activated.');

	let outputChannel = vscode.window.createOutputChannel("SuperSQL");
	const command = 'ssql.exec';
	const ssqlJarPath = context.extensionPath + '/lib/supersql.jar';
	const commandHandler = () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			// We heard that this is necessary to avoid warning.
			// But is it true? Not smart.
			// https://qiita.com/hakua-doublemoon/items/cfb638fe1ab43ca42cb8
			return "";
		}
		let file = editor.document.fileName;
		child_process.exec('java -cp ' + ssqlJarPath + ' supersql.FrontEnd -f ' + file, (error, stdout, stderror) => {
            outputChannel.appendLine(stdout);
            outputChannel.appendLine(stderror);
			outputChannel.show();
        });
	};
	context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}

export function deactivate() {}
