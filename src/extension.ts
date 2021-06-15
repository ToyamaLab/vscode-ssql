import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const JAVA_COMMAND = 'java';
const SSQL_VSCODE_CHANNEL = 'SuperSQL';
const SSQL_VSCODE_COMMAND = 'ssql.exec';
const SSQL_CONFIG_NAME = 'ssql';
const SSQL_CLASS = 'supersql.FrontEnd';
const SSQL_DEFAULT_JAR_PATH = '/lib/supersql.jar';

/**
 * @param {string} fullPath The full path of its output file.
 * @param {vscode.WebviewPanel} panel vscode.WebviewPanel.
 */
interface PanelPath {
	fullPath: string;
	panel: vscode.WebviewPanel;
}

/**
 * @param  {vscode.ExtensionContext} context
 * @param  {string} fileName
 */
function makeSSQLCommand(context: vscode.ExtensionContext, fileName: string) {
	let jarFile = ' -cp ' + context.extensionPath + SSQL_DEFAULT_JAR_PATH;
	let configFile = '';
	let driver = '';
	let host = '';
	let port = '';
	let db = '';
	let user = '';
	let password = '';
	let outputDirectory = '';

	const config: vscode.WorkspaceConfiguration =
		vscode.workspace.getConfiguration(SSQL_CONFIG_NAME);

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

	const command = `${JAVA_COMMAND}${jarFile} ${SSQL_CLASS} -f ${fileName}${configFile}${driver}${host}${port}${db}${user}${password}${outputDirectory} ${config.custom.vastAdditionalOptions}`;

	return command;
}

/**
 * Replaces local css file path with a special URI that VS Code can use to load.
 * https://code.visualstudio.com/api/extension-guides/webview#loading-local-content
 * @param  {vscode.Uri} htmlPath
 * @param  {string} srcFileName
 * @param  {vscode.Uri} srcUri
 * @returns src embedded html
 */
// todo: implement multi srcUris like [{fileName: srcUri}, ...]
function srcEmbeddedHtmlContents(
	htmlPath: vscode.Uri,
	srcFileName: string,
	srcUri: vscode.Uri
): string {
	let htmlContents = fs.readFileSync(htmlPath.fsPath, 'utf8');
	htmlContents = htmlContents.replace(
		`jscss/${srcFileName}`,
		srcUri.toString()
	);
	return htmlContents;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('VScode extension for SuperSQL is now activated.');

	const outputChannel = vscode.window.createOutputChannel(SSQL_VSCODE_CHANNEL);
	let panelPaths: PanelPath[] | undefined = undefined;

	const execSSQL = () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const file = editor.document.fileName;
		const command = makeSSQLCommand(context, file);
		if (!command) {
			outputChannel.appendLine('Making SuplerSQL command failed.');
			return;
		}

		const config: vscode.WorkspaceConfiguration =
			vscode.workspace.getConfiguration(SSQL_CONFIG_NAME);
		// ! If outputDirctory is not set in settings.json(vscode), but the .ssql file has outdir setting, this preview will fail.
		// Workaround: In the README,
		// "To use the preview function when the output directory is specified in .ssql file,
		// set config.custom.outputDirectory in the VS Code extension settings to match the output directory specified in .ssql file."
		const outputDirPath: string =
			config.custom.outputDirectory === ''
				? path.dirname(file)
				: config.custom.outputDirectory;
		// extract the filename from full path. e.g.) '/path/to/dir/file.ssql' => 'file.ssql'
		const ssqlFileName = path.basename(file);
		// todo: another output file format
		const htmlFileName = convertFileExtension(ssqlFileName, 'ssql', 'html');
		const htmlFullPathUri = vscode.Uri.file(`${outputDirPath}/${htmlFileName}`);
		const cssFileName = convertFileExtension(ssqlFileName, 'ssql', 'css');
		// Todo: Do not limit to `/jscss/` under the output directory.
		const cssFullPathUri = vscode.Uri.file(
			`${outputDirPath}/jscss/${cssFileName}`
		);

		child_process.exec(command, (_, stdout, stderror) => {
			outputChannel.appendLine(command);
			outputChannel.appendLine(stdout);
			outputChannel.appendLine(stderror);
			outputChannel.show();
			const panel: vscode.WebviewPanel = revealOrCreatePanel(
				htmlFullPathUri.fsPath,
				outputDirPath
			);
			const cssUri = panel.webview.asWebviewUri(cssFullPathUri);
			panel.webview.html = srcEmbeddedHtmlContents(
				htmlFullPathUri,
				cssFileName,
				cssUri
			);
		});
	};

	/**
	 * Converts file extension replacing `from` with `to`.
	 * @param  {string} fileName
	 * @param  {string} from
	 * @param  {string} to
	 * @returns converted file name
	 */
	const convertFileExtension = (fileName: string, from: string, to: string): string => {
		const regExp = new RegExp(`(.*)${from}`);
		return fileName.replace(regExp, `$1${to}`);
	};

	/**
	 * Returns the PanelPath instance where the panel's full path is equal to
	 * the full path of the passed argument, and undefined otherwise.
	 * @param  {string} fullPath
	 * @returns PanelPath instance
	 */
	const findWebviewPanel = (fullPath: string): PanelPath | undefined => {
		if (!panelPaths) return undefined;
		return panelPaths.find((panel) => panel.fullPath === fullPath);
	};

	/**
	 * If there is already a panel with the same full path, then reveal it,
	 * otherwise create and show a new webview panel.
	 * @param  {string} htmlFullPath
	 * @param  {string} outputDirPath
	 * @returns vscode.WebviewPanel instance
	 */
	const revealOrCreatePanel = (
		htmlFullPath: string,
		outputDirPath: string
	): vscode.WebviewPanel => {
		const panel = findWebviewPanel(htmlFullPath);
		if (panel) {
			const webviewPanel: vscode.WebviewPanel = panel.panel;
			// reveal() doesn't update its html contents, so disposes the panel and recreate it.
			// webviewPanel.reveal(vscode.ViewColumn.Beside);
			// return webviewPanel;
			webviewPanel.dispose();
		}

		// if not found, create and return a new one.
		const newVSCodePanel: vscode.WebviewPanel =
			vscode.window.createWebviewPanel(
				`${SSQL_VSCODE_CHANNEL}.preview`,
				path.basename(htmlFullPath),
				vscode.ViewColumn.Beside,
				{
					localResourceRoots: [vscode.Uri.file(outputDirPath)],
					enableScripts: true,
				}
			);
		const newPanel: PanelPath = {
			fullPath: htmlFullPath,
			panel: newVSCodePanel,
		};
		if (!panelPaths) panelPaths = new Array<PanelPath>();
		// add the newPanel to an array of panels
		panelPaths.push(newPanel);
		// dispose settings
		newVSCodePanel.onDidDispose(
			() => {
				// By returning panels with different full paths, substantially remove this panel from the array.
				panelPaths = panelPaths!.filter(function (webViewPanel) {
					return webViewPanel.fullPath !== newPanel.fullPath;
				});
			},
			null,
			context.subscriptions
		);
		return newVSCodePanel;
	};

	const commandHandler = () => {
		execSSQL();
	};
	context.subscriptions.push(
		vscode.commands.registerCommand(SSQL_VSCODE_COMMAND, commandHandler)
	);
	vscode.workspace.onDidSaveTextDocument(() => {
		execSSQL();
	});
}

export function deactivate() {}
