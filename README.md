# Bar

[Omarchy](https://omarchy.org)'s status bar, tuned for the Quake console (Super + Grave). It extends Omarchy's packaged bar, `$OMARCHY_PATH/shell/plugins/bar/Bar.qml`, rather than copying it, and replaces it as the active bar.

- **No double-click cycling.** A double click on the bar no longer steps its background through clear, glassy and opaque, and neither does the `toggleBarTransparency` IPC call. The bar keeps the `background` from `~/.config/omarchy/shell.json`; change it there, with `omarchy bar background <opaque|glassy|none>`, or in a settings app that writes it. The cycling call is kept, commented out, in `cycleBackground()` in `Bar.qml`.
- **Opaque under the console.** While the console's special workspace (`special:qconsole`) is open on any monitor, the bar draws its opaque background, so it reads as one block with the console below it. It takes the shell.json background back when the console closes. A transparent bar (`none`) stays transparent.
- **Console focus outline.** The console's focused window gets a light gray outline down its left and right sides and along its bottom, but not across its top, where the console meets the bar. Omarchy's console draws no border of its own. The outline is as wide as Hyprland's `general:border_size`, sits just outside the window as Hyprland's border does (inside it at a screen edge), and slides in and out with the console. It is a click-through layer surface, `io.github.ltecosta.bar-outline`.

Everything else is Omarchy's bar, and it follows Omarchy updates.

## Install

```bash
scripts/install bar
omarchy bar use io.github.ltecosta.bar
```

`omarchy bar use omarchy.bar` goes back to Omarchy's bar. The manifest declares itself a clone of `omarchy.bar`, which keeps the bar's own IPC target, `omarchy.bar`, working.

## Settings

Two properties at the top of `Bar.qml`:

| Property | Default | Meaning |
|---|---|---|
| `consoleWorkspace` | `special:qconsole` | The special workspace that makes the bar opaque and gets the outline |
| `outlineColor` | `#d3d3d3` | The outline's color |

## How it works

`Bar.qml` imports Omarchy's bar from `file:///usr/share/omarchy/shell/plugins/bar`, the path the `omarchy` package installs it to, and derives from it: it overrides `cycleBackground()` and sets the bar's `glassy` flag while the console is open. Hyprland's raw events (`activespecial`, window open, close, move, float and focus changes) trigger `hyprctl -j monitors` and `hyprctl -j clients`; `Model.js` turns their output into the monitors showing the console and the outline strips for each.

Quickshell's static import scanner logs `Ignoring unresolvable import` for the absolute import when the plugin loads; the QML engine resolves it at runtime.

## Keeping up with Omarchy

The plugin depends on three names in Omarchy's `Bar.qml`: the `cycleBackground()` function, the `glassy` property and the `barConfig` property. After an Omarchy update, check that they still exist, and run `journalctl --user -o cat | grep io.github.ltecosta.bar` for load errors; when the plugin fails to load, the shell falls back to Omarchy's bar.

## License

MIT. Extends Omarchy's bar, © David Heinemeier Hansson, MIT; both notices are in [LICENSE](LICENSE).
