"use strict";

const { EventEmitter } = require("node:events");
const childProcess = require("node:child_process");
const { syncBuiltinESMExports } = require("node:module");

const originalExec = childProcess.exec;

function isNetUseCommand(command) {
  return typeof command === "string" && command.trim().toLowerCase() === "net use";
}

function resolveCallback(options, callback) {
  return typeof options === "function" ? options : callback;
}

function createFallbackChild() {
  const child = new EventEmitter();
  child.pid = undefined;
  child.killed = false;
  child.kill = () => false;
  process.nextTick(() => {
    child.emit("close", 0, null);
    child.emit("exit", 0, null);
  });
  return child;
}

childProcess.exec = function patchedExec(command, options, callback) {
  if (!isNetUseCommand(command)) {
    return originalExec.call(this, command, options, callback);
  }
  try {
    return originalExec.call(this, command, options, callback);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "EPERM") {
      const cb = resolveCallback(options, callback);
      if (typeof cb === "function") {
        process.nextTick(() => cb(error, "", ""));
      }
      return createFallbackChild();
    }
    throw error;
  }
};

syncBuiltinESMExports();