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
