#!/bin/sh

set -e

URL="$1"
shift
cmd="$@"

counter=0

until curl "$URL"; do
  echo >&2 "$URL is unavailable - sleeping"
  sleep 15
done

echo >&2 "$URL is up - executing command: $cmd"
exec $cmd
