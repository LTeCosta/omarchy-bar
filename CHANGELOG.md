# Changelog

## 1.0.0

- Extends Omarchy's packaged `omarchy.bar` (`$OMARCHY_PATH/shell/plugins/bar/Bar.qml`) instead of copying it.
- A double click on the bar no longer cycles its background; the `toggleBarTransparency` IPC call does nothing either.
- The bar turns opaque while the Quake console (`special:qconsole`) is open and takes the shell.json background back when it closes.
- The console's focused window gets a light gray focus outline, Hyprland's border width, down its sides and along its bottom, sliding in and out with the console.
