"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var common_1 = require('../common');
var os = require('os');
var fs = require('fs');
var vscode = require('vscode');
var path = require('path');
var Process = (function () {
    function Process(name, pid, commandLine) {
        this.name = name;
        this.pid = pid;
        this.commandLine = commandLine;
    }
    Process.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.pid,
            detail: this.commandLine,
            id: this.pid
        };
    };
    return Process;
}());
var Docker = (function () {
//Same class idea as Process to make AttachItems
    function Docker(id, name, image, labels) {
        this.name = name + "["+id+"]";
        this.id = id;
        this.image = image
        this.labels = labels;
    }
    Docker.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.labels,
            detail: this.image,
            id: this.id
        };
    };
    return Docker;
}());
var NativeAttachItemsProviderFactory = (function () {
    function NativeAttachItemsProviderFactory() {
    }
    NativeAttachItemsProviderFactory.Get = function () {
        return new PsAttachItemsProvider();
    };
    return NativeAttachItemsProviderFactory;
}());
exports.NativeAttachItemsProviderFactory = NativeAttachItemsProviderFactory;
var NativeAttachItemsProvider = (function () {
    function NativeAttachItemsProvider() {
    }
    NativeAttachItemsProvider.prototype.getAttachItems = function () {
        return this.getInternalProcessEntries().then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getDockerItems = function () {
    //Get list of running Dockers
        return this.getDockerEntries().then(function (processEntries) {
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getDockerAttachItems = function (dockerName) {
    //Get list of pids running in Docker dockerName
        return this.getDockerProcessEntries(dockerName).then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    NativeAttachItemsProvider.prototype.getRemoteAttachItems = function (adddress) {
    //get list of processes running on gdbserver, useful for --multi mode
        return this.getRemoteProcessEntries(adddress).then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    return NativeAttachItemsProvider;
}());
var PsAttachItemsProvider = (function (_super) {
    __extends(PsAttachItemsProvider, _super);
    function PsAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(PsAttachItemsProvider, "secondColumnCharacters", {
        get: function () { return 50; },
        enumerable: true,
        configurable: true
    });
    PsAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var commColumnTitle = Array(PsAttachItemsProvider.secondColumnCharacters).join("a");
        var psCommand = ("ps -axww -o pid=,comm=" + commColumnTitle + ",args=") + (os.platform() === 'darwin' ? ' -c' : '');
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes);
        });
    };
    PsAttachItemsProvider.prototype.getDockerEntries = function () {
    //Gets the list of running dockers
        var _this = this;
        var psCommand = "docker ps --format {{.ID}}@{{.Names}}@{{.Image}}@{{.Labels}}";
        return common_1.execChildProcess(psCommand, null).then(function (dockers) {
            return _this.parseDockersFromPs(dockers);
        });
    };
    PsAttachItemsProvider.prototype.parseDockersFromPs = function (processes) {
    //Parses the output of "docker ps" and returns array of Docker objects
        var lines = processes.split('\n');
        var dockerEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var docker_1 = this.parseDockerLineFromPs(line);
            dockerEntries.push(docker_1);
        }
        return dockerEntries;
    };
    PsAttachItemsProvider.prototype.parseDockerLineFromPs = function (line) {
    //Parse a single line from "docker ps", and cleans it up
        var dockerEntry = line.split('@');
        dockerEntry.push(dockerEntry.splice(3).join('@'));
        //Combine all entries after 4 in case labels can have @
        dockerEntry = dockerEntry.map(function(v){return v.trim();});
        return new Docker(dockerEntry[0], dockerEntry[1], dockerEntry[2], dockerEntry[3]);
    };
    PsAttachItemsProvider.prototype.getRemoteProcessEntries = function (address) {
    //Gets lit of process running on gdbserver --multi
        var _this = this;
        var psCommand = "gdb -q -ex 'target extended-remote "+address+"' "
        psCommand += "-ex 'python import tempfile; tmp=tempfile.NamedTemporaryFile(); gdb.execute(\"set logging file \"+tmp.name)' "
        //Create a temp file for logging so that the output of gdb commands go to temp file
        psCommand += "-ex 'set logging on' "
        //turn on logging
        psCommand += "-ex 'info os processes' "
        //Get list of processed
        psCommand += "-ex 'set logging off' "
        //Turn off loggging
        psCommand += "-ex 'python pids = open(tmp.name, \"r\").readlines()[1:]; import sys; [sys.stdout.write(\"%s %"+PsAttachItemsProvider.secondColumnCharacters+"s %s\\n\" % tuple(pid.split(None, 2))) for pid in pids]' "
        //Read in file, parse, and output it in an identical ps format 
        psCommand += "-ex disconnect "
        psCommand += "-ex q"
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes.split("\nDone logging")[1].split('\nEnding remote debugging.')[0]);
            //Remove Done logging message and everything after it
        });
    };
    PsAttachItemsProvider.prototype.getDockerProcessEntries = function (dockerName) {
    //Get list of processes running in docker, using idental format from cpptools
        var _this = this;
        PsAttachItemsProvider.secondColumnCharacters

        var commColumnTitle = Array(PsAttachItemsProvider.secondColumnCharacters).join("a");
        var psCommand = ("docker exec "+dockerName+" ps -axww -o pid=,comm=" + commColumnTitle + ",args=");
        return common_1.execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes);
        });
    };
    PsAttachItemsProvider.prototype.parseProcessFromPs = function (processes) {
        var lines = processes.split('\n');
        var processEntries = [];
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var process_1 = this.parseLineFromPs(line);
            processEntries.push(process_1);
        }
        return processEntries;
    };
    PsAttachItemsProvider.prototype.parseLineFromPs = function (line) {
        var psEntry = new RegExp("^\\s*([0-9]+)\\s+(.{" + (PsAttachItemsProvider.secondColumnCharacters - 1) + "})\\s+(.*)$");
        var matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            var pid = matches[1].trim();
            var executable = matches[2].trim();
            var cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    };
    return PsAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.PsAttachItemsProvider = PsAttachItemsProvider;
var WmicAttachItemsProvider = (function (_super) {
    __extends(WmicAttachItemsProvider, _super);
    function WmicAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(WmicAttachItemsProvider, "wmicNameTitle", {
        get: function () { return 'Name'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicAttachItemsProvider, "wmicCommandLineTitle", {
        get: function () { return 'CommandLine'; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(WmicAttachItemsProvider, "wmicPidTitle", {
        get: function () { return 'ProcessId'; },
        enumerable: true,
        configurable: true
    });
    WmicAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return common_1.execChildProcess(wmicCommand, null).then(function (processes) {
            return _this.parseProcessFromWmic(processes);
        });
    };
    WmicAttachItemsProvider.prototype.parseProcessFromWmic = function (processes) {
        var lines = processes.split(os.EOL);
        var currentProcess = new Process(null, null, null);
        var processEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            this.parseLineFromWmic(line, currentProcess);
            if (line.lastIndexOf(WmicAttachItemsProvider.wmicPidTitle, 0) === 0) {
                processEntries.push(currentProcess);
                currentProcess = new Process(null, null, null);
            }
        }
        return processEntries;
    };
    WmicAttachItemsProvider.prototype.parseLineFromWmic = function (line, process) {
        var splitter = line.indexOf('=');
        if (splitter >= 0) {
            var key = line.slice(0, line.indexOf('=')).trim();
            var value = line.slice(line.indexOf('=') + 1).trim();
            if (key === WmicAttachItemsProvider.wmicNameTitle) {
                process.name = value;
            }
            else if (key === WmicAttachItemsProvider.wmicPidTitle) {
                process.pid = value;
            }
            else if (key === WmicAttachItemsProvider.wmicCommandLineTitle) {
                var extendedLengthPath = '\\??\\';
                if (value.lastIndexOf(extendedLengthPath, 0) === 0) {
                    value = value.slice(extendedLengthPath.length);
                }
                process.commandLine = value;
            }
        }
    };
    return WmicAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
//# sourceMappingURL=nativeAttach.js.map