# Bar

[Omarchy](https://omarchy.org)'s status bar, tuned for the Quake console (Super + Grave). It extends Omarchy's packaged bar, `$OMARCHY_PATH/shell/plugins/bar/Bar.qml`, rather than copying it, and replaces it as the active bar.

- **No double-click cycling.** A double click on the bar no longer steps its background through clear, glassy and opaque, and neither does the `toggleBarTransparency` IPC call. The bar keeps the `background` from `~/.config/omarchy/shell.json`; change it there, with `omarchy bar background <opaque|glassy|none>`, or in a settings app that writes it. The cycling call is kept, commented out, in `cycleBackground()` in `Bar.qml`.
- **Opaque under the console.** While the console's special workspace (`special:qconsole`) is open, the bar on the monitor it dropped down on reads as opaque, so it forms one block with the console below it; the bars on other monitors keep their look. Omarchy's bar draws one background for every monitor, so the plugin leaves it alone and puts a strip of the bar's opaque background color right behind the bar on that monitor, on the bottom layer (`io.github.ltecosta.bar-backing`); a glassy bar over it shows that color. The strip goes when the console closes. A transparent bar (`none`) gets no strip.

Everything else is Omarchy's bar, and it follows Omarchy updates.

## Install

```bash
omarchy plugin add https://github.com/LTeCosta/omarchy-bar.git
omarchy bar use io.github.ltecosta.bar
```

`omarchy plugin add` clones the repository into `~/.config/omarchy/plugins/io.github.ltecosta.bar/`; `omarchy plugin update io.github.ltecosta.bar` updates it. `omarchy bar use omarchy.bar` goes back to Omarchy's bar. The manifest declares itself a clone of `omarchy.bar`, which keeps the bar's own IPC target, `omarchy.bar`, working.

## Settings

One property at the top of `Bar.qml`:

| Property | Default | Meaning |
|---|---|---|
| `consoleWorkspace` | `special:qconsole` | The special workspace that makes its monitor's bar opaque |

## How it works

`Bar.qml` imports Omarchy's bar from `file:///usr/share/omarchy/shell/plugins/bar`, the path the `omarchy` package installs it to, and derives from it: it overrides `cycleBackground()` and adds the backing strip, one layer surface per monitor shown only on the console's monitor. Hyprland's `activespecial`, monitor and config-reload events trigger `hyprctl -j monitors`; `Model.js` turns its output into the monitors showing the console.

Quickshell's static import scanner logs `Ignoring unresolvable import` for the absolute import when the plugin loads; the QML engine resolves it at runtime.

## Keeping up with Omarchy

The plugin depends on these names in Omarchy's `Bar.qml`: the `cycleBackground()` function and the `background`, `transparent`, `barHidden`, `position`, `vertical` and `thicknessFor()` members. After an Omarchy update, check that they still exist, and run `journalctl --user -o cat | grep io.github.ltecosta.bar` for load errors; when the plugin fails to load, the shell falls back to Omarchy's bar.

## License

MIT. Extends Omarchy's bar, © David Heinemeier Hansson, MIT; both notices are in [LICENSE](LICENSE).
