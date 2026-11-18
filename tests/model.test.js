// Tests for the Bar plugin's Model.js.
// Run from the plugin directory: node --test
"use strict"
const assert = require("node:assert")
const { test } = require("node:test")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

const pluginDir = path.join(__dirname, "..")
const Model = {}
vm.runInNewContext(fs.readFileSync(path.join(pluginDir, "Model.js"), "utf8").replace(/^\.pragma library$/m, ""), Model)
const plain = value => JSON.parse(JSON.stringify(value))

const CONSOLE = "special:qconsole"
// A 3440x1440 monitor at scale 1.25 (2752x1152 logical) right of a 1600-wide one.
const monitor = (over = {}) => ({ id: 1, name: "DP-2", x: 1600, y: 0, width: 3440, height: 1440, scale: 1.25,
  transform: 0, specialWorkspace: { id: -98, name: CONSOLE }, ...over })
const client = (over = {}) => ({ address: "0x1", at: [2288, 26], size: [1376, 900], monitor: 1, fullscreen: 0,
  focusHistoryID: 0, workspace: { id: -98, name: CONSOLE }, ...over })

test("parseList keeps arrays and drops anything else", () => {
  assert.deepStrictEqual(plain(Model.parseList("[1,2]")), [1, 2])
  assert.deepStrictEqual(plain(Model.parseList("{\"a\":1}")), [])
  assert.deepStrictEqual(plain(Model.parseList("not json")), [])
})

test("parseBorderSize reads hyprctl getoption and bounds it", () => {
  assert.strictEqual(Model.parseBorderSize("{\"option\":\"general:border_size\",\"int\":3,\"set\":true}", 2), 3)
  assert.strictEqual(Model.parseBorderSize("{\"int\":0}", 2), 2)
  assert.strictEqual(Model.parseBorderSize("{\"int\":1.5}", 2), 2)
  assert.strictEqual(Model.parseBorderSize("garbage", 2), 2)
})

test("configuredLook reads shell.json like Omarchy's bar", () => {
  assert.strictEqual(Model.configuredLook({ background: "glassy" }), "glassy")
  assert.strictEqual(Model.configuredLook({ background: "none" }), "none")
  assert.strictEqual(Model.configuredLook({ transparent: true }), "none")
  assert.strictEqual(Model.configuredLook({}), "opaque")
  assert.strictEqual(Model.configuredLook(null), "opaque")
  assert.strictEqual(Model.configuredLook({ background: "<b>x</b>" }), "opaque")
})

test("consoleMonitors lists monitors showing the console", () => {
  const monitors = [monitor(), monitor({ id: 0, name: "eDP-1", specialWorkspace: { id: 0, name: "" } })]
  assert.deepStrictEqual(plain(Model.consoleMonitors(monitors, CONSOLE)), ["DP-2"])
  assert.deepStrictEqual(plain(Model.consoleMonitors([monitor({ specialWorkspace: { name: "special:scratchpad" } })], CONSOLE)), [])
  assert.deepStrictEqual(plain(Model.consoleMonitors([null, {}], CONSOLE)), [])
})

test("outline frames the focused console window on its sides and bottom", () => {
  const pieces = Model.outline([monitor()], [client()], CONSOLE, "DP-2", 2)
  assert.deepStrictEqual(plain(pieces), {
    left: { x: 686, y: 26, width: 2, height: 902 },
    right: { x: 2064, y: 26, width: 2, height: 902 },
    bottom: { x: 686, y: 926, width: 1380, height: 2 }
  })
})

test("outline moves strips inside the window at the screen edge", () => {
  const pieces = Model.outline([monitor()], [client({ at: [1600, 26], size: [2752, 1126] })], CONSOLE, "DP-2", 2)
  assert.deepStrictEqual(plain(pieces), {
    left: { x: 0, y: 26, width: 2, height: 1126 },
    right: { x: 2750, y: 26, width: 2, height: 1126 },
    bottom: { x: 0, y: 1150, width: 2752, height: 2 }
  })
})

test("outline follows a rotated, scaled monitor's logical size", () => {
  const rotated = monitor({ x: 0, transform: 1 })
  const pieces = Model.outline([rotated], [client({ at: [0, 26], size: [1152, 800] })], CONSOLE, "DP-2", 2)
  assert.strictEqual(pieces.right.x, 1150)
})

test("outline is null while the console is closed, unfocused or fullscreen", () => {
  const closed = monitor({ specialWorkspace: { id: 0, name: "" } })
  assert.strictEqual(Model.outline([closed], [client()], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client({ focusHistoryID: 1 })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client({ workspace: { id: 3, name: "3" } })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client({ fullscreen: 2 })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client({ monitor: 0 })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client()], CONSOLE, "eDP-1", 2), null)
})

test("outline ignores malformed geometry", () => {
  assert.strictEqual(Model.outline([monitor()], [client({ at: "0,0" })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor()], [client({ size: [0, 900] })], CONSOLE, "DP-2", 2), null)
  assert.strictEqual(Model.outline([monitor({ width: "wide" })], [client()], CONSOLE, "DP-2", 2), null)
})
