#!/usr/bin/env node

import dotenv from "dotenv"
import { spawnSync } from "node:child_process"
import { discoverWorkspaceEnvFile } from "./workspace-env.js"

const [, , command, ...args] = process.argv

if (!command) {
  console.error("Usage: run-with-workspace-env <command> [...args]")
  process.exit(1)
}

const env = { ...process.env }
const envFile = discoverWorkspaceEnvFile()

if (envFile) {
  dotenv.config({
    path: envFile,
    processEnv: env,
  })
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
})

if (result.error) {
  throw result.error
}

if (result.signal) {
  process.kill(process.pid, result.signal)
}

process.exit(result.status ?? 1)
