// Omarchy's bar with two changes:
//
// - A double click on the bar no longer cycles its background; the bar keeps
//   the `background` set in shell.json.
// - While the Quake console (Super + Grave) is open, the bar on the monitor it
//   dropped down on turns opaque; the bars on other monitors keep their look.
//
// Everything else is Omarchy's own bar: this extends the packaged Bar.qml
// rather than copying it, so the bar follows Omarchy updates.

import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
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

  // Omarchy's bar runs this on a double click and for the
  // toggleBarTransparency IPC call. Left empty, the bar keeps the shell.json
  // background; set it in shell.json or OmaControl, or uncomment the line to
  // cycle it again.
  function cycleBackground() {
    // Util.execDetached("omarchy-bar background cycle")
  }

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

  // The bar's background is one look for every monitor, so the bar itself
  // stays as shell.json sets it. On the console's monitor a strip of the
  // bar's opaque background sits right behind the bar, on the bottom layer,
  // and a glassy bar over it reads as opaque. Nothing tiles there: the bar
  // reserves that edge. A transparent bar ("none") gets no backing.
  Variants {
    model: Quickshell.screens

    delegate: Component {
      PanelWindow {
        required property var modelData

        screen: modelData
        visible: extended.consoleMonitors.indexOf(modelData.name) !== -1 && !extended.transparent && !extended.barHidden
        anchors {
          top: extended.position !== "bottom"
          bottom: extended.position !== "top"
          left: extended.position !== "right"
          right: extended.position !== "left"
        }
        implicitWidth: extended.vertical ? extended.thicknessFor(modelData) : 0
        implicitHeight: extended.vertical ? 0 : extended.thicknessFor(modelData)
        color: extended.background
        exclusionMode: ExclusionMode.Ignore
        mask: Region {}
        WlrLayershell.namespace: "io.github.ltecosta.bar-backing"
        WlrLayershell.layer: WlrLayer.Bottom
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
      }
    }
  }
}
