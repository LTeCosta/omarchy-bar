// Omarchy's bar with three changes for the Quake console (Super + Grave):
//
// - A double click on the bar no longer cycles its background; the bar keeps
//   the `background` set in shell.json.
// - While the console is open the bar turns opaque, and it takes the shell.json
//   background back when the console closes.
// - The console casts a soft shadow below it, onto the dimmed desktop; nothing
//   is drawn along its sides or across its top, where it meets the bar.
//
// Everything else is Omarchy's own bar: this extends the packaged Bar.qml
// rather than copying it, so the bar follows Omarchy updates.

import QtQuick
import QtQuick.Effects
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
  // The shadow under the console: its color and how far it fades out.
  readonly property color shadowColor: Qt.rgba(0, 0, 0, 0.8)
  readonly property real shadowBlur: 28

  property var monitorsState: []
  property var clientsState: []
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
    if (monitorsProbe.running || clientsProbe.running) {
      refreshTimer.restart()
      return
    }
    monitorsProbe.running = true
    clientsProbe.running = true
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

  Process {
    id: clientsProbe
    command: ["hyprctl", "-j", "clients"]
    stdout: StdioCollector {
      onStreamFinished: extended.clientsState = Model.parseList(text)
    }
  }

  Component.onCompleted: refreshConsole()

  // Events that open or close the console or change its windows.
  Connections {
    target: Hyprland
    function onRawEvent(event) {
      var name = event ? String(event.name) : ""
      switch (name) {
      case "configreloaded":
      case "activespecial":
      case "activespecialv2":
      case "openwindow":
      case "closewindow":
      case "movewindowv2":
      case "changefloatingmode":
      case "fullscreen":
      case "monitoraddedv2":
      case "monitorremovedv2":
        refreshTimer.restart()
        break
      }
    }
  }

  Variants {
    model: Quickshell.screens

    delegate: Component {
      PanelWindow {
        id: shadowWindow

        required property var modelData

        screen: modelData
        readonly property var panel: Model.consolePanel(extended.monitorsState, extended.clientsState,
          extended.consoleWorkspace, modelData.name)
        readonly property bool shown: panel !== null
        // The panel the shadow last fell from, kept while it slides away.
        property var drawn: null

        onPanelChanged: if (panel) drawn = panel

        // Follow the console's own slide: Hyprland drops the special workspace
        // in from the top (specialWorkspaceIn, 300 ms, easeOutQuint) and
        // retracts it upwards (specialWorkspaceOut, 200 ms, easeInOutCubic).
        onShownChanged: {
          slide.stop()
          slide.to = shown ? 0 : -height
          slide.duration = shown ? Style.duration(300) : Style.duration(200)
          slide.easing.bezierCurve = shown ? [0.23, 1, 0.32, 1, 1, 1] : [0.65, 0.05, 0.36, 1, 1, 1]
          if (shown) frame.y = -height
          slide.start()
        }

        visible: shown || slide.running
        color: "transparent"
        anchors { top: true; left: true; right: true; bottom: true }
        exclusionMode: ExclusionMode.Ignore
        mask: Region {}
        WlrLayershell.namespace: "io.github.ltecosta.bar-console-shadow"
        WlrLayershell.layer: WlrLayer.Top
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.None

        Item {
          id: frame
          width: parent.width
          height: parent.height

          NumberAnimation {
            id: slide
            target: frame
            property: "y"
            easing.type: Easing.Bezier
          }

          // Only the part of the shadow below the panel shows: this layer is
          // above the console's windows, so the clip keeps it off them.
          Item {
            visible: shadowWindow.drawn !== null
            x: 0
            y: shadowWindow.drawn ? shadowWindow.drawn.y + shadowWindow.drawn.height : 0
            width: parent.width
            height: extended.shadowBlur * 2
            clip: true

            RectangularShadow {
              x: shadowWindow.drawn ? shadowWindow.drawn.x : 0
              y: shadowWindow.drawn ? -shadowWindow.drawn.height : 0
              width: shadowWindow.drawn ? shadowWindow.drawn.width : 0
              height: shadowWindow.drawn ? shadowWindow.drawn.height : 0
              offset: Qt.vector2d(0, extended.shadowBlur / 4)
              blur: extended.shadowBlur
              color: extended.shadowColor
            }
          }
        }
      }
    }
  }
}
