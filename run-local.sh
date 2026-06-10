#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

GULP="./node_modules/.bin/gulp"

if [ ! -d "node_modules" ]; then
    echo "node_modules was not found. Run npm install before using this script."
    exit 1
fi

if [ ! -x "$GULP" ]; then
    echo "Local gulp executable was not found at $GULP. Run npm install and try again."
    exit 1
fi

run_gulp_task() {
    local task_name="$1"
    local output_file="$2"
    local description="$3"
    local timeout_seconds="${4:-20}"

    echo "$description"

    rm -f "$output_file"

    "$GULP" "$task_name" &
    local gulp_pid=$!

    local elapsed=0
    while [ "$elapsed" -lt "$timeout_seconds" ]; do
        if [ -s "$output_file" ]; then
            echo "Created $output_file"

            if kill -0 "$gulp_pid" 2>/dev/null; then
                kill "$gulp_pid" 2>/dev/null || true
                wait "$gulp_pid" 2>/dev/null || true
            fi

            return 0
        fi

        if ! kill -0 "$gulp_pid" 2>/dev/null; then
            wait "$gulp_pid"
            break
        fi

        sleep 1
        elapsed=$((elapsed + 1))
    done

    if kill -0 "$gulp_pid" 2>/dev/null; then
        kill "$gulp_pid" 2>/dev/null || true
        wait "$gulp_pid" 2>/dev/null || true
    fi

    echo "Failed to create $output_file from gulp task '$task_name'."
    exit 1
}

run_gulp_task \
    "minify-css" \
    "public/build/style.min.css" \
    "Building public/build/style.min.css..."

run_gulp_task \
    "uglify" \
    "public/build/app.min.js" \
    "Building public/build/app.min.js..."

echo "Starting application with node app.js..."
echo "This terminal will stay open while the server is running."
node app.js