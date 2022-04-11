#!/usr/bin/env node
import os from "os"
import path from "path"
import fs from "fs"
import { dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url))

var GOOS = os.platform()
var GOARCH = os.arch()
if (GOARCH === 'x64') {
  GOARCH = 'amd64'
}

var dist = path.resolve(__dirname, '..', 'dist')
var linkTarget = path.join(dist, `dump-serialized_${GOOS}_${GOARCH}`)
var linkPath = path.join(dist, 'dump-serialized')


if (!fs.existsSync(dist))
  fs.mkdirSync(dist, { recursive: true })

const lexistsSync = (path) => { try { fs.lstatSync(path); return true } catch { return false } }
if (lexistsSync(linkPath))
  fs.unlinkSync(linkPath)
fs.symlinkSync(linkTarget, linkPath)
