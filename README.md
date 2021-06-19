# SuperSQL Extension for Visual Studio Code

Welcome to SuperSQL Extension for Visual Studio Code. This is an extension for supporting to write SuperSQL queries. Currently the extension provides only syntax highlighting.

For more information of SuperSQL, visit [here](http://ssql.db.ics.keio.ac.jp/).

![Sample image of highlighting](images/screenshot.png)

## Notes

To use the preview function, make sure to set `config.custom.outputDirectory` in the VS Code extension settings even when the output directory is specified in .ssql file. If you set the different one in `config.custom.outputDirectory`, .ssql setting will be overwritten.

e.g.)
If you want to use the preview and get the output in `/Users/path/to/outdir`, configure outputDirectory as follows:

![Notes - configure outputDirectory](images/configure_outputDirectory.png)

## Release Notes

### 0.0.1

Initial alpha release of SuperSQL extension.
