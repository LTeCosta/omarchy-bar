# Changelog

## 1.0.0

- Extends Omarchy's packaged `omarchy.bar` (`$OMARCHY_PATH/shell/plugins/bar/Bar.qml`) instead of copying it.
- A double click on the bar no longer cycles its background; the `toggleBarTransparency` IPC call does nothing either.
- The bar turns opaque while the Quake console (`special:qconsole`) is open and takes the shell.json background back when it closes.
- The console casts a soft shadow below it, sliding in and out with the console; nothing is drawn along its sides or top.
