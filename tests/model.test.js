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

test("consolePanel boxes the console's tiled windows", () => {
  const clients = [client({ at: [1600, 26], size: [1376, 900] }), client({ address: "0x2", at: [2976, 26], size: [1376, 900], focusHistoryID: 1 })]
  assert.deepStrictEqual(plain(Model.consolePanel([monitor()], clients, CONSOLE, "DP-2")), { x: 0, y: 26, width: 2752, height: 900 })
})

test("consolePanel ignores floating windows beside tiled ones and uses them alone", () => {
  const tiled = client()
  const floating = client({ address: "0x2", at: [1700, 400], size: [300, 900], floating: true })
  assert.deepStrictEqual(plain(Model.consolePanel([monitor()], [tiled, floating], CONSOLE, "DP-2")), { x: 688, y: 26, width: 1376, height: 900 })
  assert.deepStrictEqual(plain(Model.consolePanel([monitor()], [floating], CONSOLE, "DP-2")), { x: 100, y: 400, width: 300, height: 900 })
})

test("consolePanel follows a rotated, scaled monitor and its position", () => {
  const rotated = monitor({ x: 0, y: 100, transform: 1 })
  assert.deepStrictEqual(plain(Model.consolePanel([rotated], [client({ at: [0, 126], size: [1152, 800] })], CONSOLE, "DP-2")),
    { x: 0, y: 26, width: 1152, height: 800 })
})

test("consolePanel is null while the console is closed, empty or fullscreen", () => {
  const closed = monitor({ specialWorkspace: { id: 0, name: "" } })
  assert.strictEqual(Model.consolePanel([closed], [client()], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [client({ workspace: { id: 3, name: "3" } })], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [client({ monitor: 0 })], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [client(), client({ address: "0x2", fullscreen: 1 })], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [client()], CONSOLE, "eDP-1"), null)
})

test("consolePanel skips malformed geometry", () => {
  assert.strictEqual(Model.consolePanel([monitor()], [client({ at: "0,0" })], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor()], [client({ size: [0, 900] })], CONSOLE, "DP-2"), null)
  assert.strictEqual(Model.consolePanel([monitor({ width: "wide" })], [client()], CONSOLE, "DP-2"), null)
})
