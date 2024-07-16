#!/usr/bin/env bash

pushd ./backend
go mod tidy

pushd ../frontend
bun install
