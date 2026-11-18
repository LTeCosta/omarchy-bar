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
