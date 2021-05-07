import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable1 = vscode.commands.registerCommand('vscode-ssql.formatOriginalLog', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);
            if (text) {
                const textFormatted = formatOriginalLog(text);
                if (textFormatted) {
                    editor.edit(editBuilder => {
                        editBuilder.replace(selection, textFormatted);
                    });
                } else {
                    console.log("text not formatted.");
                }
            } else {
                console.log("text not detected.");
            }
        }
    });

    const disposable2 = vscode.commands.registerCommand('vscode-ssql.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from vscode-ssql!');
    });
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

// 独自ログ文字列を見やすく整形する例
function formatOriginalLog(text: string): string {
    let textFormatted = '';
    const articles = text.split('|');
    if (articles.length > 1) {
        articles.forEach(article => {
            const fields = article.split(':');
            if (fields.length > 1) {
                fields.forEach(field => {
                    textFormatted += `${field}\n`;
                });
                textFormatted += `\n`;
            }
        });
    }
    return textFormatted;
}
