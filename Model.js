.pragma library

// Decisions for the bar: the background shell.json asks for, the monitors that
// show the console, and the console's panel, which casts the shadow. Pure
// functions over hyprctl JSON, so tests/ can run them in Node.

// A JSON array from command output, else an empty list.
function parseList(text) {
  try {
    var value = JSON.parse(String(text))
    return Array.isArray(value) ? value : []
  } catch (e) {
    return []
  }
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

// The console's panel on `monitorName`: the box around its tiled windows (its
// floating ones when it has none), in monitor-local logical pixels. Null while
// the console is not open there, is empty, or holds a fullscreen window.
function consolePanel(monitors, clients, workspace, monitorName) {
  var monitor = null
  for (var i = 0; i < monitors.length; i++) {
    if (monitors[i] && monitors[i].name === monitorName) monitor = monitors[i]
  }
  var special = monitor && monitor.specialWorkspace
  if (!special || special.name !== workspace) return null

  var frame = monitorFrame(monitor)
  if (!frame) return null

  var tiled = []
  var floating = []
  for (var j = 0; j < clients.length; j++) {
    var client = clients[j]
    if (!client || !client.workspace || client.workspace.name !== workspace || client.monitor !== frame.id) continue
    if (finite(client.fullscreen) && client.fullscreen > 0) return null
    var at = client.at
    var extent = client.size
    if (!Array.isArray(at) || !Array.isArray(extent) || !finite(at[0]) || !finite(at[1]) || !finite(extent[0]) || !finite(extent[1])) continue
    if (extent[0] <= 0 || extent[1] <= 0) continue
    var box = { left: at[0] - frame.x, top: at[1] - frame.y, right: at[0] - frame.x + extent[0], bottom: at[1] - frame.y + extent[1] }
    if (client.floating === true) floating.push(box)
    else tiled.push(box)
  }

  var boxes = tiled.length > 0 ? tiled : floating
  if (boxes.length === 0) return null

  var panel = boxes[0]
  for (var k = 1; k < boxes.length; k++) {
    panel = {
      left: Math.min(panel.left, boxes[k].left),
      top: Math.min(panel.top, boxes[k].top),
      right: Math.max(panel.right, boxes[k].right),
      bottom: Math.max(panel.bottom, boxes[k].bottom)
    }
  }
  return { x: panel.left, y: panel.top, width: panel.right - panel.left, height: panel.bottom - panel.top }
}
