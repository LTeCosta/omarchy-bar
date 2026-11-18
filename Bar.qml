// Omarchy's bar with two changes:
//
// - A double click on the bar no longer cycles its background; the bar keeps
//   the `background` set in shell.json.
// - While the Quake console (Super + Grave) is open the bar turns opaque, and
//   it takes the shell.json background back when the console closes.
//
// Everything else is Omarchy's own bar: this extends the packaged Bar.qml
// rather than copying it, so the bar follows Omarchy updates.

import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import qs.Commons
import "file:///usr/share/omarchy/shell/plugins/bar" as Omarchy
import "Model.js" as Model

Omarchy.Bar {
  id: extended

  // The special workspace the console opens on, as Omarchy's
  // default/hypr/qconsole.lua names it.
  readonly property string consoleWorkspace: "special:qconsole"
  property var monitorsState: []
  readonly property var consoleMonitors: Model.consoleMonitors(monitorsState, consoleWorkspace)
  readonly property bool consoleOpen: consoleMonitors.length > 0

  // Omarchy's bar runs this on a double click and for the
  // toggleBarTransparency IPC call. Left empty, the bar keeps the shell.json
  // background; set it in shell.json or OmaControl, or uncomment the line to
  // cycle it again.
  function cycleBackground() {
    // Util.execDetached("omarchy-bar background cycle")
  }

  // Opaque while the console is open, the shell.json look otherwise. A
  // transparent bar ("none") keeps whatever glassy holds, as Omarchy's does.
  function applyConsoleLook() {
    if (consoleOpen) {
      glassy = false
      return
    }
    var look = Model.configuredLook(barConfig)
    if (look !== "none") glassy = look === "glassy"
  }

  onConsoleOpenChanged: applyConsoleLook()
  // A shell.json write re-applies the configured look; the console overrides it.
  onGlassyChanged: if (consoleOpen && glassy) glassy = false

  function refreshConsole() {
    if (monitorsProbe.running) {
      refreshTimer.restart()
      return
    }
    monitorsProbe.running = true
  }

  Timer {
    id: refreshTimer
    interval: 20
    onTriggered: extended.refreshConsole()
  }

  Process {
    id: monitorsProbe
    command: ["hyprctl", "-j", "monitors"]
    stdout: StdioCollector {
      onStreamFinished: extended.monitorsState = Model.parseList(text)
    }
  }

  Component.onCompleted: refreshConsole()

  // Events that open or close the console or change the monitors.
  Connections {
    target: Hyprland
    function onRawEvent(event) {
      var name = event ? String(event.name) : ""
      switch (name) {
      case "configreloaded":
      case "activespecial":
      case "activespecialv2":
      case "monitoraddedv2":
      case "monitorremovedv2":
        refreshTimer.restart()
        break
      }
    }
  }
}
