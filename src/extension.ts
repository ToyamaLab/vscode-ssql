import * as vscode from 'vscode';
import * as child_process from 'child_process';

const JAVA_COMMAND = 'java';
const SSQL_VSCODE_CHANNEL = 'SuperSQL';
const SSQL_VSCODE_COMMAND = 'ssql.exec';
const SSQL_CONFIG_NAME = 'ssql';
const SSQL_CLASS = 'supersql.FrontEnd';
const SSQL_DEFAULT_JAR_PATH = '/lib/supersql.jar';

function makeSSQLCommand(context: vscode.ExtensionContext) {
	let jarFile = ' -cp ' + context.extensionPath + SSQL_DEFAULT_JAR_PATH;
	let configFile = '';
	let driver = '';
	let host = '';
	let port = '';
	let db = '';
	let user = '';
	let password = '';
	let outputDirectory = '';

	const config: vscode.WorkspaceConfiguration
		= vscode.workspace.getConfiguration(SSQL_CONFIG_NAME);

	if (config.bringYourOwnJarFile !== '') {
		jarFile = ' -cp ' + config.bringYourOwnJarFile;
	}

	if (config.configFile !== '') {
		configFile = " -c " + config.configFile;
	}

	if (config.custom.db.driver !== '') {
		driver = " -driver " + config.custom.db.driver;
	}

	if (config.custom.db.host !== '') {
		host = " -h " + config.custom.db.host;
	}

	if (config.custom.db.hostPort !== '') {
		port = " -p " + config.custom.db.hostPort;
	}

	if (config.custom.db.name !== '') {
		db = " -db " + config.custom.db.name;
	}

	if (config.custom.db.user !== '') {
		user = " -u " + config.custom.db.user;
	}

	if (config.custom.db.userPassword !== '') {
		password = " -password " + config.custom.db.userPassword;
	}

	if (config.custom.outputDirectory !== '') {
		outputDirectory = " -d " + config.custom.outputDirectory;
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return '';
	}
	const file = editor.document.fileName;

	const command = JAVA_COMMAND + jarFile
		+ ' ' + SSQL_CLASS + ' -f ' + file
		+ configFile + driver + host + port + db + user + password
		+ outputDirectory + ' ' + config.custom.vastAdditionalOptions;

	return command;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('VScode extension for SuperSQL is now activated.');

	let outputChannel = vscode.window.createOutputChannel(SSQL_VSCODE_CHANNEL);
	const commandHandler = () => {
		const command = makeSSQLCommand(context);
		if (command !== '') {
			child_process.exec(command, (error, stdout, stderror) => {
				outputChannel.appendLine(command);
				outputChannel.appendLine(stdout);
				outputChannel.appendLine(stderror);
				outputChannel.show();
			});
		} else {
			outputChannel.appendLine('Making SuplerSQL command failed.');
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand(SSQL_VSCODE_COMMAND, commandHandler));
}

export function deactivate() {}
