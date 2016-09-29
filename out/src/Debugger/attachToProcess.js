"use strict";
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var common_1 = require('../common');

var AttachPicker = (function () {
    function AttachPicker(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    AttachPicker.prototype.ShowAttachEntries = function () {
        return this.attachItemsProvider.getAttachItems()
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.ShowDockerNameEntries = function (launchConfig) {
        return this.attachItemsProvider.getDockerItems()
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the docker to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenDocker) {
                return chosenDocker ? chosenDocker.id : null;
            });
        });
    };
    AttachPicker.prototype.ShowDockerAttachEntries = function (launchConfig) {
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        return this.attachItemsProvider.getDockerAttachItems(launchConfig.miDockerName)
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.ShowRemoteAttachEntries = function (launchConfig) {
        if (!("miDebuggerServerAddress" in launchConfig)){
            vscode.window.showErrorMessage('miDebuggerServerAddress is not specified in launch.json');
            return;
        }

        return this.attachItemsProvider.getRemoteAttachItems(launchConfig.miDebuggerServerAddress)
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    AttachPicker.prototype.RemoteCopyProgram = function (launchConfig) {
        if (!("remoteProcessId" in launchConfig)){
            vscode.window.showErrorMessage('remoteProcessIdis not specified in launch.json');
            return;
        }
        var gdbCommand = 'gdb -q '+
                         '-ex \'target extended-remote '+launchConfig.miDebuggerServerAddress+'\' ' +
                         '-ex \'python import tempfile;' +
                                      'file=tempfile.NamedTemporaryFile(delete=False);' +
                                      'gdb.execute("remote get /proc/'+launchConfig.remoteProcessId+'/exe "+file.name)\' ' +
                         '-ex \'python print(file.name)\' ' +
                         '-ex q'
        return common_1.execChildProcess(gdbCommand, null).then(function (output) {
            return output.split('\n')[1];
        });
    }
    AttachPicker.prototype.MakeGdbScript = function (launchConfig) {
        if (!("miDebuggerServerAddress" in launchConfig && "remoteProcessId" in launchConfig)){
            vscode.window.showErrorMessage('miDebuggerServerAddress or remoteProcessIdis not specified in launch.json');
            return;
        }

        var gdbCommands = []
        gdbCommands.push("target extended-remote "+launchConfig.miDebuggerServerAddress)
        gdbCommands.push("python import tempfile;" +
                                "file=tempfile.NamedTemporaryFile(delete=True);" +
                                "gdb.execute('remote get /proc/"+launchConfig.remoteProcessId+"/exe '+file.name);"+
                                "gdb.execute('file '+file.name);")
        if ("miDebuggerGdbCommands" in launchConfig){
            gdbCommands = gdbCommands.concat(launchConfig.miDebuggerGdbCommands)
        }

        gdbCommands.push("attach "+launchConfig.remoteProcessId)
        gdbCommands = '-ex "'+gdbCommands.map((x) => {return x.replace('"', '\\"');}).join('" -ex "')+'"'

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath,
                                    "gdb_" + launchConfig.miDebuggerServerAddress.replace(':','_'));
        fs.writeFileSync(filename, "#!/usr/bin/env bash\n"+
                                    "tee /tmp/mi.in | "+
//                                    "sed -r 's/^([0-9]*-file-exec-and-symbols ).*/\\1 "++"/'"
                                    "sed -r 's/^([0-9]*-target-select) remote/\\1 extended-remote/'" +
//                                    "grep --line-buffered -Ev '^[0-9]*-target-select|^[0-9]*-file-exec-and-symbols' | "+
                                    "gdb " + gdbCommands + " \"${@}\" | "+
                                    "tee /tmp/mi.out\n");//+
//                                    "rm $0\n");

//        fs.chmodSync(filename, '0755');

        return filename;
    };
    AttachPicker.prototype.DockerGdb = function (launchConfig) {
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath, 
                                    "tmp_" + launchConfig.miDockerName);
        fs.writeFileSync(filename, "#!/usr/bin/env bash\necho ${@} > /tmp/wtf\ndocker exec -it " + launchConfig.miDockerName + " gdb \"$1\"\nrm $0\n");
        fs.chmodSync(filename, '0755');

        return filename;
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
//# sourceMappingURL=attachToProcess.js.map