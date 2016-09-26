'use strict';
var path = require('path');
var vscode = require('vscode');
var fs = require('fs');
var vscode_languageclient_1 = require('vscode-languageclient');
var Telemetry = require('../telemetry');
var C_Cpp_DebugProtocol = require('./C_Cpp_DebugProtocol');
var C_Cpp_ConfigurationProperties = require('./C_Cpp_ConfigurationProperties');
var C_Cpp_Feedback = require('./C_Cpp_Feedback');
var ShutdownRequest_type = {
    get method() { return "shutdown"; }
};
var ExitRequest_type = {
    get method() { return "exit"; }
};
var FormatCausesNoChanges_type = {
    get method() { return "cpp/formatCausesNoChanges"; }
};
var AutocompleteChange_Type = { get method() { return 'cpp_autocomplete/change'; } };
var statusBarMessageTimeout = 3000;
function activate(context) {
    var _this = this;
    var plat = process.platform;
    var extensionProcessName = 'Microsoft.VSCode.CPP.Extension';
    var clangformatProcessName = "clang-format";
    if (plat == 'linux') {
        extensionProcessName += '.linux';
    }
    else if (plat == 'darwin') {
        extensionProcessName += '.darwin';
        clangformatProcessName += '.darwin';
    }
    else if (plat == 'win32') {
        extensionProcessName += '.exe';
        clangformatProcessName += '.exe';
    }
    else {
        throw "Invalid Platform";
    }
    var serverModule = context.asAbsolutePath(path.join('bin', extensionProcessName));
    fs.chmod(serverModule, '555', function (err) {
        if (err) {
            throw err;
        }
        var clangformatModule = context.asAbsolutePath(path.join('LLVM/bin', clangformatProcessName));
        fs.chmod(clangformatModule, '555', function (err) {
            if (err) {
            }
        });
        var serverOptions = {
            run: { command: serverModule },
            debug: { command: serverModule }
        };
        var bugUserSettings = new C_Cpp_Feedback.FeedbackState(context);
        var con = vscode.workspace.getConfiguration("C_Cpp");
        var excludeFiles = vscode.workspace.getConfiguration("files.exclude");
        var excludeSearch = vscode.workspace.getConfiguration("search.exclude");
        var clientOptions = {
            documentSelector: ['cpp', "c"],
            synchronize: {
                configurationSection: ['C_Cpp', 'files', 'search']
            },
            initializationOptions: {
                clang_format_path: con.get("clang_format_path"),
                clang_format_style: con.get("clang_format_style"),
                clang_format_fallackStyle: con.get("clang_format_fallackStyle"),
                clang_format_sortIncludes: con.get("clang_format_sortIncludes"),
                clang_format_formatOnSave: con.get("clang_format_formatOnSave"),
                extension_path: context.extensionPath,
                exclude_files: excludeFiles,
                exclude_search: excludeSearch,
                bug_user_count: bugUserSettings.getBugUserCount(),
                bug_user_count_edit: bugUserSettings.getBugUserEditCount(),
            }
        };
        var languageClient = new vscode_languageclient_1.LanguageClient('C/Cpp Language Server', serverOptions, clientOptions);
        C_Cpp_DebugProtocol.setupDebugProtocolHandler(languageClient);
        C_Cpp_Feedback.setupFeedbackHandler(context, languageClient);
        context.subscriptions.push(C_Cpp_ConfigurationProperties.setupConfigurationProperties(context, languageClient));
        context.subscriptions.push(languageClient.start());
        languageClient.onNotification(AutocompleteChange_Type, function () {
        });
        _this.registeredCommand = vscode.commands.registerCommand('C_Cpp.UnloadLanguageServer', function () {
            languageClient.sendRequest(ShutdownRequest_type, null).then(function () {
                return languageClient.sendNotification(ExitRequest_type);
            });
        });
        var formattedDocToSave = null;
        vscode.workspace.onDidSaveTextDocument(function (doc) {
            if (doc != vscode.window.activeTextEditor.document || (doc.languageId != "cpp" && doc.languageId != "c"))
                return;
            if (formattedDocToSave != null) {
                formattedDocToSave = null;
            }
            else if (vscode.workspace.getConfiguration("C_Cpp").get("clang_format_formatOnSave")) {
                formattedDocToSave = doc;
                vscode.commands.executeCommand("editor.action.format");
            }
        });
        languageClient.onNotification(FormatCausesNoChanges_type, function () {
            if (formattedDocToSave != null)
                formattedDocToSave = null;
        });
        vscode.workspace.onDidChangeTextDocument(function () {
            if (formattedDocToSave != null)
                formattedDocToSave.save();
        });
        Telemetry.logLanguageServerEvent("LanguageServerLaunched");
        languageClient.onNotification(Telemetry.LogTelemetry_type, function (notificationBody) {
            Telemetry.logLanguageServerEvent(notificationBody.event, notificationBody.properties, notificationBody.metrics);
        });
    });
}
exports.activate = activate;
function deactivate() {
    Telemetry.logLanguageServerEvent("LanguageServerShutdown");
}
exports.deactivate = deactivate;
//# sourceMappingURL=C_Cpp.js.map