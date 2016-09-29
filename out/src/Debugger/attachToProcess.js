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
    //Get list of all running docker using docker ps, and choose one 
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
    //Get list of all processes in docker using docker exec to run ps, and choose one 
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
    //Using gdb, query the remote processes. This uses "info os processes", which ironically doesn't work on my Mint 18
    //For some reason. It was complaining about an invalid charecter. But I can't reproduce that error, and even then
    //"info os threads" worked *shrugs*
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
    AttachPicker.prototype.RemoteCopyProgram = function (launchConfig, multi=False) {
    //Creates a temporary (optimally self deleting) copy of the remote executable. This way you don't have to
    //While many dev systems build locally and send, my scenario is not that.
        var gdbCommand = 'gdb -q ';
        // Shhh, be vewy vewy quiet
        var pid;
        if (multi){
            if (!("remoteProcessId" in launchConfig)){
                vscode.window.showErrorMessage('remoteProcessIdis not specified in launch.json');
                return;
            }

            gdbCommand += '-ex \'target extended-remote '+launchConfig.miDebuggerServerAddress+'\' ';
            pid = launchConfig.remoteProcessId; 
        }else{
            gdbCommand += '-ex \'target remote '+launchConfig.miDebuggerServerAddress+'\' ';
            pid = '"+str(gdb.inferiors()[0].pid)+"'
            //Since it's already attached as an inferior, just ask python
        }
        gdbCommand += '-ex \'python import tempfile;' +
                                   'file=tempfile.NamedTemporaryFile(delete=False);' +
                                   'gdb.execute("remote get /proc/'+pid+'/exe "+file.name)\' ' +
                      //Using python in gdb, create a tempfile and get the executable and copy it locally
                      '-ex \'python print(file.name)\' ' +
                      //Print the filename to be parsed in the return
                      '-ex disconnect ' +
                      //disconnect is important for non-multi mode. Just quiting will kill the process,
                      //disconnect allows it to start attached and wait for another client to connect to
                      //gdbserver, unless the --once flag is used. But at that point they are just making
                      //difficult. If --once is used, you can't use remoteCopyProgram
                      '-ex q 2>&1'
                      //Redirect stderr because common_1.execChildProcess inteprets all stderr as bad. I should probably just
                      //call execChild myself at this point 
        return common_1.execChildProcess(gdbCommand, null).then(function (output) {
            return output.split('\n').slice(-3)[0];
        });
    }
    AttachPicker.prototype.MakeGdbScriptMulti = function (launchConfig) {
    //Create a gdb wrapper script to modify the behavior of gdb to make everything work today. Only expected to work on Linux
    //1) It uses python to auto delete the local copy of program
    //2) Adds additional miDebuggerGdbCommands to gdb. Useful for customization
    //3) Uses sed change -target-select remote mi commands into -target-select exented-remote + -target-attach
        if (!("miDebuggerServerAddress" in launchConfig && "remoteProcessId" in launchConfig && "program" in launchConfig)){
            vscode.window.showErrorMessage('miDebuggerServerAddress or remoteProcessIdis or program not specified in launch.json');
            return;
        }

        var gdbCommands = []
        gdbCommands.push("python import os,tempfile;" +
                                "file=tempfile._TemporaryFileWrapper(open(os.devnull, 'r'), '"+launchConfig.program+"', True)")
        //This is part of auto cleanup. It sideloads a temporary file, so that when gdb exists, python atexit deletes the file(s)
        //BAD IDEA, will delete a localfile that wasn't temporary too! Woops :)

        if ("miDebuggerGdbCommands" in launchConfig){
            gdbCommands = gdbCommands.concat(launchConfig.miDebuggerGdbCommands)
        }

        gdbCommands = '-ex "'+gdbCommands.map((x) => {return x.replace('"', '\\"');}).join('" -ex "')+'"'

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath,
                                    "gdb_" + launchConfig.miDebuggerServerAddress.replace(':','_'));
        fs.writeFileSync(filename, "#!/usr/bin/env bash\n"+
                                    "sed -ur -e 's/^([0-9]*-target-select) remote (.*)/\\1 extended-remote \\2\\n"+
                                                                                       "-target-attach "+launchConfig.remoteProcessId+"/' | " +
                                    "gdb " + gdbCommands + " \"${@}\"" +
                                    "rm $0\n");

        fs.chmodSync(filename, '0755');

        return filename;
    };
    AttachPicker.prototype.DockerGdb = function (launchConfig) {
    //DOES NOT YET
    //The idea is to run gdb in a docker. Since this is not remote, 
    //1) I can't use the attach+miDebuggerServerAddress due to #265
    //2) I can't use launch+miDebuggerServerAddress becuase "-target-select remote" will be used
    //3) I can't use normal attach due to #265
    //Idea another MITM sed for launch+miDebuggerServerAddress?

 
        if (!("miDockerName" in launchConfig)){
            vscode.window.showErrorMessage('miDockerName is not specified in launch.json');
            return;
        }

        var filename = path.resolve(vscode.extensions.all.find(o => o.id == "ms-vscode.cpptools").extensionPath, 
                                    "tmp_" + launchConfig.miDockerName);
        fs.writeFileSync(filename, "#!/usr/bin/env bash\n"+
                                   "docker exec -it " + launchConfig.miDockerName + " gdb \"$1\"\n"+
                                   "rm $0\n");
        fs.chmodSync(filename, '0755');

        return filename;
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
//# sourceMappingURL=attachToProcess.js.map