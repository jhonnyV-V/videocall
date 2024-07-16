#!/usr/bin/env bash

#prog1 & prog2 && fg
(cd ./backend && air) & (cd ./frontend && bun run dev) && fg
