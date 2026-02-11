#!/bin/bash
# Open the Context Library in Obsidian as a vault.
# Works even if the folder hasn't been registered as a vault before.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
open "obsidian://vault?path=$SCRIPT_DIR"
