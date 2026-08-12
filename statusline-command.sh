#!/usr/bin/env bash
# Claude Code statusLine: shows model name, context window usage,
# and claude.ai rate limit usage (5-hour / 7-day) when available.

input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name // "Claude"')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
five=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

CYAN='\033[2;36m'
YELLOW='\033[2;33m'
MAGENTA='\033[2;35m'
DIM_SEP='\033[2m'
RESET='\033[0m'

segments=()

segments+=("${CYAN}${model}${RESET}")

if [ -n "$used" ]; then
  segments+=("${YELLOW}Ctx: $(printf '%.0f' "$used")%${RESET}")
fi

if [ -n "$five" ]; then
  segments+=("${MAGENTA}5h: $(printf '%.0f' "$five")%${RESET}")
fi

if [ -n "$week" ]; then
  segments+=("${MAGENTA}7d: $(printf '%.0f' "$week")%${RESET}")
fi

out=""
for seg in "${segments[@]}"; do
  if [ -n "$out" ]; then
    out="$out ${DIM_SEP}|${RESET} $seg"
  else
    out="$seg"
  fi
done

printf "%b" "$out"
