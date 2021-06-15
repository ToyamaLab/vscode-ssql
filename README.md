# SuperSQL Extension for Visual Studio Code

Welcome to SuperSQL Extension for Visual Studio Code. This is an extension for supporting to write SuperSQL queries. Currently the extension provides only syntax highlighting.

For more information of SuperSQL, visit [here](http://ssql.db.ics.keio.ac.jp/).

![Sample image of highlighting](images/screenshot.png)

## Notes

To use the preview function when the output directory is specified in .ssql file, set config.custom.outputDirectory in the VS Code extension settings to match the output directory specified in .ssql file.

e.g.)
If you set `outdir` in .ssql as follows:

```.ssql
outdir=/Users/path/to/outdir
```

You need to configure outputDirectory as follows:
![Notes - configure outputDirectory](images/configure_outputDirectory.png)

## Release Notes

### 0.0.1

Initial alpha release of SuperSQL extension.
