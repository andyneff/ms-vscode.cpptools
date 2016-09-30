"use strict";
var vscode = require('vscode');
var attachToProcess_1 = require('./attachToProcess');
var nativeAttach_1 = require('./nativeAttach');
function activate(context) {
    var attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    var attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);

    // Pick a process
    var disposable = vscode.commands.registerCommand('extension.pickNativeProcess', function () { return attacher.ShowAttachEntries(); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.pickDockerProcess', function (launchConfig) { return attacher.ShowDockerAttachEntries(launchConfig); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.pickRemoteProcess', function (launchConfig) { return attacher.ShowRemoteAttachEntries(launchConfig); });
    context.subscriptions.push(disposable);

    //GDB wrapper scripts
    disposable = vscode.commands.registerCommand('extension.makeGdbScript', function (launchConfig) { return attacher.MakeGdbScript(launchConfig); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.makeGdbScriptMulti', function (launchConfig) { return attacher.MakeGdbScriptMulti(launchConfig); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.gdbDocker', function (launchConfig) { return attacher.DockerGdb(launchConfig); });
    context.subscriptions.push(disposable);

    //Copy remote files locally automagically
    disposable = vscode.commands.registerCommand('extension.remoteCopyProgram', function (launchConfig) { return attacher.RemoteCopyProgram(launchConfig, false); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.remoteCopyProgramMulti', function (launchConfig) { return attacher.RemoteCopyProgram(launchConfig, true); });
    context.subscriptions.push(disposable);

    //Docker specific commands
    disposable = vscode.commands.registerCommand('extension.pickDockerName', function (launchConfig) { return attacher.ShowDockerNameEntries(launchConfig); });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('extension.getDockerProcessPath', function (launchConfig) { return attacher.GetDockerProcessPath(launchConfig); });
    context.subscriptions.push(disposable);

}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map