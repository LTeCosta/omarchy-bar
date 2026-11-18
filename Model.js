.pragma library

// Decisions for the bar: the monitors that show the console. Pure functions
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
