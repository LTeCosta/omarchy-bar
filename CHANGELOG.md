# Changelog

## 1.1.0

- Only the bar on the monitor the console is open on turns opaque, through a strip of the bar's opaque background behind it; the bars on other monitors keep their look.

## 1.0.0

- Extends Omarchy's packaged `omarchy.bar` (`$OMARCHY_PATH/shell/plugins/bar/Bar.qml`) instead of copying it.
- A double click on the bar no longer cycles its background; the `toggleBarTransparency` IPC call does nothing either.
- The bar turns opaque while the Quake console (`special:qconsole`) is open and takes the shell.json background back when it closes.
