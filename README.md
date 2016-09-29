# C/C++ for Visual Studio Code
This preview release of the extension adds language support for C/C++ to Visual Studio Code including:
* Language service 
  * Code Formatting (clang-format)
  * Auto-Completion (experimental)
  * Symbol Searching
  * Go to Definition
  * Peek Definition
* Debugging  
  * Support for debugging Windows (PDB, Mingw/Cygwin), Linux and OS X applications 
  * Line by line code stepping
  * Breakpoints (including conditional and function breakpoints)
  * Variable inspection
  * Multi-threaded debugging support
  * Core dump debugging support
  * Executing GDB or MI commands directly when using 'C++ (GDB/LLDB)' debugging environment
  * For help configuring the debugger see [Configuring launch.json for C/C++ debugging](https://github.com/Microsoft/vscode-cpptools/blob/master/launch.md) 
    on our [GitHub page](https://github.com/Microsoft/vscode-cpptools).

You can find more detailed information about C/C++ support on Visual Studio Code at our [documentation page](http://code.visualstudio.com/docs/languages/cpp).

If you run into any problems, please file an issue on [GitHub](https://github.com/Microsoft/vscode-cpptools/issues).

## Change History
### My modifications ###

I'm working on getting gdb working with the current plug in capabiliteis for gdbserver and dockers. This covers a number of scenarios

#### gdbserver used as normal ####

Is covered pretty well [here](https://github.com/Microsoft/vscode-cpptools/issues/265#issuecomment-250339508)

Launch configuration `"program": "${command.remoteCopyProgram}",` can optionally be used to copy the remote program locally for you
(Currently this is not cleaned up, leading to a lot of random files in your temp dir)

#### gdbserver used in --multi mode ####

Currently only works in a `launch` configuration (on Linux). Here's an example

1. Run `gdbserver 0.0.0.0:6666` (or what ever ip/port you want)
2. Create a `lanch.json` like this

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "C++ Launch",
            "type": "cppdbg",
            "request": "launch",
            "args": [],
            "stopAtEntry": true,
            "cwd": "${workspaceRoot}",
            "environment": [],
            "externalConsole": true,

            "miDebuggerServerAddress": "localhost:6666",
            "remoteProcessId": "${command.pickRemoteProcess}",
            "program": "${command.remoteCopyProgramMulti}",
            "miDebuggerPath": "${command.remoteGdbMulti}",

            "miDebuggerGdbCommands": ["directory /opt/projects/myproject/somedir/"],


            "linux": {
                "MIMode": "gdb"
            },
            "osx": {
                "MIMode": "lldb"
            },
            "windows": {
                "MIMode": "gdb"
            }
        }
    ]
}
```

Because this is a nasty hack, the order of the four lines in the center matter since each one uses the previous

I added:

- `"${command.pickRemoteProcess}"` - Which will allow you to pick a process that is running on  miDebuggerServerAddress just like `"${command.pickProcess}"`. Of course you could just type in the pid number manually
- `"${command.remoteCopyProgramMulti}"` - Which automatically copies the binary from the remote server so that symbols can be loaded. Of course you could just use your own copy
- `"${command.remoteGdbMulti}"` - This is the part that you need to make it work. It creates a temporary wrapper script to fix all the current issues getting `--multi` mode working
- Added `miDebuggerGdbCommands` - This allows you to specify an array of gdb command run on initilization. This is equivalent to .gdbinit [here](http://wiki.eclipse.org/CDT/User/FAQ), only I argue not having to make "yet another file" is better

It may be possible to get `command.remoteGdbMulti` working in windows, using batch, but I wasn't concerned with that. This is more of a proof of concept

##### How can all this become not neccesary? #####

1. Need a flag to switch mi command `-target-select remote`  to `-target-select extended-remote + -target-attach`
2. `miDebuggerGdbCommands` as an optional argument to add any command to gdb startup
3. A way to have the source program copied locally before attaching would be useful to make the entire debugging experience fluid
4. An offical version of `command.pickRemoteProcess`

#### gdb in a docker ####

*Work in progress*

### Version 0.9.2: September 22, 2016
* Bug fixes.

### Version 0.9.1: September 7, 2016
* Bug fixes.

### Version 0.9.0: August 29, 2016
* [August update](https://blogs.msdn.microsoft.com/vcblog/2016/08/29/august-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Debugging for Visual C++ applications on Windows (Program Database files) is now available.
* `clang-format` is now automatically installed as a part of the extension and formats code as you type.
* `clang-format` options have been moved from c_cpp_properties.json file to settings.json (File->Preferences->User settings).
* `clang-format` fall-back style is now set to 'Visual Studio'.
* Attach now requires a request type of `attach` instead of `launch`.
* Support for additional console logging using the keyword `logging` inside `launch.json`.
* Bug fixes.

### Version 0.8.1: July 27, 2016
* Bug fixes.

### Version 0.8.0: July 21, 2016
* [July update](https://blogs.msdn.microsoft.com/vcblog/2016/07/26/july-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Support for debugging on OS X with LLDB 3.8.0. LLDB is now the default debugging option on OS X.
* Attach to process displays a list of available processes.
* Set variable values through Visual Studio Code's locals window. 
* Bug fixes.

### Version 0.7.1: June 27, 2016
* Bug fixes.

### Version 0.7.0: June 20, 2016
* [June Update](https://blogs.msdn.microsoft.com/vcblog/2016/06/01/may-update-for-the-cc-extension-in-visual-studio-code/) for C/C++ extension.
* Bug fixes.
* Switch between header and source.
* Control which files are processed under include path.

### Version 0.6.1: June 03, 2016
* Bug fixes.
 
### Version 0.6.0: May 24, 2016
* [May update](https://blogs.msdn.microsoft.com/vcblog/2016/07/26/july-update-for-the-visual-studio-code-cc-extension/) for C/C++ extension.
* Support for debugging on OS X with GDB.
* Support for debugging with GDB on MinGW.
* Support for debugging with GDB on Cygwin.
* Debugging on 32-bit Linux now enabled.
* Format code using clang-format.
* Experimental fuzzy autocompletion.
* Bug fixes.

### Version 0.5.0: April 14, 2016
* Usability and correctness bug fixes. 
* Simplify installation experience.
* Usability and correctness bug fixes. 

## Contact Us
If you’d like to help us build the best C/C++ experience on any platform, [you can sign up to talk directly to the product team and influence our investment in this area](http://landinghub.visualstudio.com/c-nonwin).

If you run into any issues, please file an issue on [GitHub](https://github.com/Microsoft/vscode-cpptools/issues).
