.pragma library

// Decisions for the bar: the background shell.json asks for, the monitors that
// show the console, and where the console's focus outline goes. Pure functions
// over hyprctl JSON, so tests/ can run them in Node.

// A JSON array from command output, else an empty list.
function parseList(text) {
  try {
    var value = JSON.parse(String(text))
    return Array.isArray(value) ? value : []
  } catch (e) {
    return []
  }
}

// Hyprland's general:border_size from `hyprctl -j getoption`, else fallback.
function parseBorderSize(text, fallback) {
  try {
    var value = JSON.parse(String(text))
    var size = value && value.int
    if (typeof size === "number" && size === Math.floor(size) && size >= 1 && size <= 32) return size
  } catch (e) {}
  return fallback
}

// The background shell.json asks for, read the way Omarchy's bar reads it:
// "opaque", "glassy" or "none", with the older `transparent` flag meaning none.
function configuredLook(config) {
  var bar = config && typeof config === "object" ? config : {}
  var look = bar.background || (bar.transparent === true ? "none" : "opaque")
  return look === "glassy" || look === "none" ? look : "opaque"
}

function finite(value) {
  return typeof value === "number" && isFinite(value)
}

// Names of the monitors whose open special workspace is `workspace`.
function consoleMonitors(monitors, workspace) {
  var names = []
  for (var i = 0; i < monitors.length; i++) {
    var monitor = monitors[i]
    var special = monitor && monitor.specialWorkspace
    if (special && special.name === workspace && typeof monitor.name === "string") names.push(monitor.name)
  }
  return names
}

// A monitor's logical frame: hyprctl gives its position in logical pixels and
// its size in physical ones, before rotation.
function monitorFrame(monitor) {
  if (!monitor || !finite(monitor.x) || !finite(monitor.y) || !finite(monitor.width) || !finite(monitor.height)) return null
  var scale = finite(monitor.scale) && monitor.scale > 0 ? monitor.scale : 1
  var width = monitor.width / scale
  var height = monitor.height / scale
  if (finite(monitor.transform) && monitor.transform % 2 === 1) {
    var swap = width
    width = height
    height = swap
  }
  return { id: monitor.id, x: monitor.x, y: monitor.y, width: Math.round(width), height: Math.round(height) }
}

// The focus outline on `monitorName`: `size`-pixel strips down the left and
// right of the focused console window and along its bottom, none along its top,
// in monitor-local logical pixels. Strips sit just outside the window, as
// Hyprland draws a border, and move inside it where the screen edge would cut
// them off. Null while the console is not open there, its focused window is
// elsewhere or fullscreen.
function outline(monitors, clients, workspace, monitorName, size) {
  var monitor = null
  for (var i = 0; i < monitors.length; i++) {
    if (monitors[i] && monitors[i].name === monitorName) monitor = monitors[i]
  }
  var special = monitor && monitor.specialWorkspace
  if (!special || special.name !== workspace) return null

  var frame = monitorFrame(monitor)
  if (!frame) return null

  var focused = null
  for (var j = 0; j < clients.length; j++) {
    var client = clients[j]
    if (client && client.focusHistoryID === 0) focused = client
  }
  if (!focused || !focused.workspace || focused.workspace.name !== workspace) return null
  if (focused.monitor !== frame.id || (finite(focused.fullscreen) && focused.fullscreen > 0)) return null

  var at = focused.at
  var extent = focused.size
  if (!Array.isArray(at) || !Array.isArray(extent) || !finite(at[0]) || !finite(at[1]) || !finite(extent[0]) || !finite(extent[1])) return null
  if (extent[0] <= 0 || extent[1] <= 0) return null

  var b = finite(size) && size >= 1 ? Math.round(size) : 1
  var x = at[0] - frame.x
  var y = at[1] - frame.y
  var w = extent[0]
  var h = extent[1]

  var left = x - b < 0 ? x : x - b
  var right = x + w + b > frame.width ? x + w - b : x + w
  var bottom = y + h + b > frame.height ? y + h - b : y + h

  return {
    left: { x: left, y: y, width: b, height: bottom + b - y },
    right: { x: right, y: y, width: b, height: bottom + b - y },
    bottom: { x: left, y: bottom, width: right + b - left, height: b }
  }
}
