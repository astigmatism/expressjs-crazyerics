#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./apply-ai-update.sh [options] <downloads-folder-name-or-path>

Examples:
  ./apply-ai-update.sh my-ai-update-folder
  ./apply-ai-update.sh --apply my-ai-update-folder
  ./apply-ai-update.sh --apply --copy my-ai-update-folder
  ./apply-ai-update.sh --apply --strip-root my-ai-update-folder

What it does:
  - Looks for the provided folder in ~/Downloads unless you provide a full path.
  - Treats this script's directory as the project root.
  - Preserves relative paths from the update package.
  - Moves updated files into the project by default.
  - Creates backups of overwritten files before applying.
  - Runs as a dry run unless --apply is provided.

Options:
  --apply, -a          Actually move/copy files into the project.
  --dry-run, -n        Preview only. This is the default.
  --move, -m           Move files from the package into the project. Default.
  --copy, -c           Copy files instead of moving them.
  --no-backup          Do not back up overwritten files.
  --strip-root         Strip one top-level folder from the package.
  --no-strip-root      Do not auto-strip a top-level folder.
  --help, -h           Show this help.
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
DOWNLOADS_DIR="$HOME/Downloads"

APPLY=0
MODE="move"
BACKUP=1
STRIP_MODE="auto"
PACKAGE_ARG=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --apply|-a)
      APPLY=1
      ;;
    --dry-run|-n)
      APPLY=0
      ;;
    --move|-m)
      MODE="move"
      ;;
    --copy|-c)
      MODE="copy"
      ;;
    --no-backup)
      BACKUP=0
      ;;
    --strip-root)
      STRIP_MODE="yes"
      ;;
    --no-strip-root)
      STRIP_MODE="no"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      die "Unknown option: $1"
      ;;
    *)
      if [ -n "$PACKAGE_ARG" ]; then
        die "Only one package folder argument is allowed."
      fi
      PACKAGE_ARG="$1"
      ;;
  esac
  shift
done

[ -n "$PACKAGE_ARG" ] || {
  usage
  exit 1
}

expand_path() {
  case "$1" in
    "~")
      printf '%s\n' "$HOME"
      ;;
    "~/"*)
      printf '%s/%s\n' "$HOME" "${1#~/}"
      ;;
    *)
      printf '%s\n' "$1"
      ;;
  esac
}

PACKAGE_PATH="$(expand_path "$PACKAGE_ARG")"

if [ -d "$PACKAGE_PATH" ]; then
  PACKAGE_DIR="$(cd "$PACKAGE_PATH" && pwd -P)"
elif [ -d "$DOWNLOADS_DIR/$PACKAGE_ARG" ]; then
  PACKAGE_DIR="$(cd "$DOWNLOADS_DIR/$PACKAGE_ARG" && pwd -P)"
else
  die "Could not find folder '$PACKAGE_ARG' or '$DOWNLOADS_DIR/$PACKAGE_ARG'."
fi

case "$PACKAGE_DIR/" in
  "$PROJECT_ROOT/"*)
    die "Package folder appears to be inside the project root. Refusing to apply it."
    ;;
esac

SOURCE_ROOT="$PACKAGE_DIR"

# Auto-strip a top-level folder only if it matches the current project folder name.
# Example:
#   ~/Downloads/update-package/my-project/src/file.ts
# becomes:
#   src/file.ts
if [ "$STRIP_MODE" = "auto" ] && [ -d "$PACKAGE_DIR/$PROJECT_NAME" ]; then
  SOURCE_ROOT="$(cd "$PACKAGE_DIR/$PROJECT_NAME" && pwd -P)"
fi

# Force-strip exactly one top-level folder.
# Useful when the package looks like:
#   update-package/some-wrapper-folder/src/file.ts
if [ "$STRIP_MODE" = "yes" ]; then
  top_items=()
  top_dirs=()

  while IFS= read -r -d '' item; do
    top_items+=("$item")
    if [ -d "$item" ]; then
      top_dirs+=("$item")
    fi
  done < <(
    find "$PACKAGE_DIR" \
      -mindepth 1 \
      -maxdepth 1 \
      ! -name ".DS_Store" \
      ! -name "__MACOSX" \
      -print0
  )

  if [ "${#top_items[@]}" -ne 1 ] || [ "${#top_dirs[@]}" -ne 1 ]; then
    die "--strip-root requires the package folder to contain exactly one top-level directory."
  fi

  SOURCE_ROOT="$(cd "${top_dirs[0]}" && pwd -P)"
fi

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_DIR="$PROJECT_ROOT/.ai-update-backups/$TIMESTAMP"

echo "Project root:  $PROJECT_ROOT"
echo "Package dir:   $PACKAGE_DIR"
echo "Source root:   $SOURCE_ROOT"
echo "Mode:          $MODE"
if [ "$APPLY" -eq 1 ]; then
  echo "Action:        APPLY"
else
  echo "Action:        DRY RUN"
fi

if [ "$APPLY" -eq 1 ] && [ "$BACKUP" -eq 1 ]; then
  echo "Backups:       $BACKUP_DIR"
elif [ "$APPLY" -eq 1 ]; then
  echo "Backups:       disabled"
fi

echo

count=0
backup_count=0

while IFS= read -r -d '' src; do
  rel="${src#"$SOURCE_ROOT"/}"
  dest="$PROJECT_ROOT/$rel"

  if [ -d "$dest" ]; then
    die "Destination is a directory, but source is a file: $rel"
  fi

  count=$((count + 1))

  if [ "$APPLY" -eq 0 ]; then
    printf '[dry run] %s -> %s\n' "$rel" "$dest"
    continue
  fi

  mkdir -p "$(dirname "$dest")"

  if [ "$BACKUP" -eq 1 ] && [ -e "$dest" ]; then
    backup_dest="$BACKUP_DIR/$rel"
    mkdir -p "$(dirname "$backup_dest")"
    cp -p "$dest" "$backup_dest"
    backup_count=$((backup_count + 1))
  fi

  if [ "$MODE" = "copy" ]; then
    cp -p "$src" "$dest"
    printf '[copied]  %s\n' "$rel"
  else
    mv -f "$src" "$dest"
    printf '[moved]   %s\n' "$rel"
  fi

done < <(
  find "$SOURCE_ROOT" \
    \( -path "$SOURCE_ROOT/.git" -o -path "$SOURCE_ROOT/__MACOSX" \) -prune -o \
    \( -name ".DS_Store" \) -prune -o \
    -type f \
    -print0
)

echo

if [ "$count" -eq 0 ]; then
  echo "No files found to apply."
  exit 0
fi

if [ "$APPLY" -eq 0 ]; then
  echo "Dry run complete. $count file(s) would be $MODE'd."
  echo "Run again with --apply to make changes."
else
  echo "Done. $count file(s) ${MODE}d."
  if [ "$BACKUP" -eq 1 ]; then
    echo "$backup_count overwritten file(s) backed up."
  fi
fi
