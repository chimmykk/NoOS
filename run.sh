#!/bin/bash
# filepath: /Users/yeiterilsosingkoireng/Desktop/NoOS/shapes-cli/shapes-cli.sh

set -e

ENV_FILE=".env"
TOKEN_FILE="$HOME/.shapes-cli/token.json"
TOOLS_DIR="$HOME/.shapes-cli/tools"
PLUGINS_DIR="$HOME/.shapes-cli/plugins"
APP_ID="f6263f80-2242-428d-acd4-10e1feec44ee"
API_URL="https://api.shapes.inc/v1"
AUTH_URL="https://api.shapes.inc/auth"
SITE_URL="https://shapes.inc"

mkdir -p "$HOME/.shapes-cli" "$TOOLS_DIR" "$PLUGINS_DIR"

# Load .env if exists
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Prompt for missing credentials
if [ -z "$SHAPESINC_API_KEY" ]; then
  read -p "Enter your SHAPESINC_API_KEY: " SHAPESINC_API_KEY
  echo "SHAPESINC_API_KEY=$SHAPESINC_API_KEY" >> "$ENV_FILE"
fi

if [ -z "$SHAPESINC_SHAPE_USERNAME" ]; then
  read -p "Enter your SHAPESINC_SHAPE_USERNAME: " SHAPESINC_SHAPE_USERNAME
  echo "SHAPESINC_SHAPE_USERNAME=$SHAPESINC_SHAPE_USERNAME" >> "$ENV_FILE"
fi

MODEL="shapesinc/$SHAPESINC_SHAPE_USERNAME"

function login() {
  echo "Opening browser for authentication..."
  AUTH_URL_FULL="$SITE_URL/authorize?app_id=$APP_ID"
  if which xdg-open > /dev/null; then
    xdg-open "$AUTH_URL_FULL"
  elif which open > /dev/null; then
    open "$AUTH_URL_FULL"
  else
    echo "Please open this URL in your browser: $AUTH_URL_FULL"
  fi

  read -p "Please enter the authorization code from the browser: " CODE

  # Exchange code for token
  RESPONSE=$(curl -s -X POST "$AUTH_URL/nonce" \
    -H "Content-Type: application/json" \
    -d "{\"app_id\":\"$APP_ID\",\"code\":\"$CODE\"}")

  TOKEN=$(echo "$RESPONSE" | grep -o '"auth_token":"[^"]*' | grep -o '[^"]*$')
  if [ -n "$TOKEN" ]; then
    echo "{\"token\":\"$TOKEN\"}" > "$TOKEN_FILE"
    echo "Successfully authenticated!"
  else
    echo "Authentication failed: $RESPONSE"
    exit 1
  fi
}

function logout() {
  if [ -f "$TOKEN_FILE" ]; then
    rm "$TOKEN_FILE"
    echo "Successfully logged out!"
  else
    echo "Not currently authenticated."
  fi
}

function get_token() {
  if [ -f "$TOKEN_FILE" ]; then
    cat "$TOKEN_FILE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$'
  else
    echo ""
  fi
}

function list_images() {
  echo "Images in current directory:"
  ls -1 | grep -Ei '\.(jpg|jpeg|png|gif|webp)$' || echo "No images found."
}

function upload_image() {
  local FILENAME="$1"
  if [ -z "$FILENAME" ]; then
    FILENAME=$(ls | grep -Ei '\.(jpg|jpeg|png|gif|webp)$' | head -1)
    if [ -z "$FILENAME" ]; then
      echo "No image files found in current directory."
      return 1
    fi
  fi
  if [ ! -f "$FILENAME" ]; then
    echo "File not found: $FILENAME"
    return 1
  fi
  EXT="${FILENAME##*.}"
  case "$EXT" in
    jpg|jpeg) CONTENT_TYPE="image/jpeg" ;;
    png) CONTENT_TYPE="image/png" ;;
    gif) CONTENT_TYPE="image/gif" ;;
    webp) CONTENT_TYPE="image/webp" ;;
    *) CONTENT_TYPE="application/octet-stream" ;;
  esac
  BASE64=$(base64 < "$FILENAME" | tr -d '\n')
  DATA_URL="data:$CONTENT_TYPE;base64,$BASE64"
  echo "Data URL for $FILENAME:"
  echo "$DATA_URL"
}

function chat() {
  TOKEN=$(get_token)
  if [ -z "$TOKEN" ]; then
    echo "No user token found. Please run login first."
    exit 1
  fi

  while true; do
    read -p "You: " MESSAGE
    [ -z "$MESSAGE" ] && continue
    if [[ "$MESSAGE" == "/logout" ]]; then
      logout
      break
    elif [[ "$MESSAGE" == "/exit" ]]; then
      break
    elif [[ "$MESSAGE" == "/images" ]]; then
      list_images
      continue
    elif [[ "$MESSAGE" == /image* ]]; then
      FILENAME=$(echo "$MESSAGE" | awk '{print $2}')
      upload_image "$FILENAME"
      continue
    elif [[ "$MESSAGE" == "/help" ]]; then
      help
      continue
    fi

    RESPONSE=$(curl -s -X POST "$API_URL/chat/completions" \
      -H "Content-Type: application/json" \
      -H "X-App-ID: $APP_ID" \
      -H "X-User-Auth: $TOKEN" \
      -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$MESSAGE\"}]}")
    ASSISTANT=$(echo "$RESPONSE" | grep -o '"content":"[^"]*' | head -1 | sed 's/"content":"//' | sed 's/\\"/"/g' | sed 's/\\n/\n/g')
    echo -e "Assistant: $ASSISTANT"
  done
}

function list_tools() {
  echo "Available tools:"
  for TOOL in "$TOOLS_DIR"/*.json; do
    [ -e "$TOOL" ] || { echo "  (none)"; break; }
    NAME=$(jq -r .name "$TOOL")
    DESC=$(jq -r .description "$TOOL")
    ENABLED=$(jq -r .enabled "$TOOL" 2>/dev/null || echo "false")
    STATUS=$([ "$ENABLED" = "true" ] && echo "✓" || echo "○")
    echo "  $STATUS $NAME - $DESC"
  done
}

function enable_tool() {
  local NAME="$1"
  local TOOL_FILE="$TOOLS_DIR/$NAME.json"
  if [ ! -f "$TOOL_FILE" ]; then
    echo "Tool not found: $NAME"
    return 1
  fi
  jq '.enabled=true' "$TOOL_FILE" > "$TOOL_FILE.tmp" && mv "$TOOL_FILE.tmp" "$TOOL_FILE"
  echo "Tool enabled: $NAME"
}

function disable_tool() {
  local NAME="$1"
  local TOOL_FILE="$TOOLS_DIR/$NAME.json"
  if [ ! -f "$TOOL_FILE" ]; then
    echo "Tool not found: $NAME"
    return 1
  fi
  jq '.enabled=false' "$TOOL_FILE" > "$TOOL_FILE.tmp" && mv "$TOOL_FILE.tmp" "$TOOL_FILE"
  echo "Tool disabled: $NAME"
}

function list_plugins() {
  echo "Installed plugins:"
  for PLUGIN in "$PLUGINS_DIR"/*.json; do
    [ -e "$PLUGIN" ] || { echo "  (none)"; break; }
    NAME=$(jq -r .name "$PLUGIN")
    DESC=$(jq -r .description "$PLUGIN")
    echo "  $NAME - $DESC"
  done
}

function install_plugin() {
  local URL="$1"
  if [ -z "$URL" ]; then
    echo "Usage: $0 plugins:install <git-url>"
    return 1
  fi
  local NAME=$(basename "$URL" .git)
  local PLUGIN_DIR="$PLUGINS_DIR/$NAME"
  git clone "$URL" "$PLUGIN_DIR"
  if [ -f "$PLUGIN_DIR/plugin.json" ]; then
    cp "$PLUGIN_DIR/plugin.json" "$PLUGINS_DIR/$NAME.json"
    echo "Plugin installed: $NAME"
  else
    echo "Plugin manifest not found."
  fi
}

function remove_plugin() {
  local NAME="$1"
  local PLUGIN_DIR="$PLUGINS_DIR/$NAME"
  rm -rf "$PLUGIN_DIR" "$PLUGINS_DIR/$NAME.json"
  echo "Plugin removed: $NAME"
}

function help() {
  cat <<EOF
Shapes CLI Bash - Commands:
/login                - Authenticate with Shapes API
/logout               - Clear authentication token
/chat                 - Start chat session
/images               - List available image files
/image [filename]     - Show base64 data URL for image (or first image)
/tools                - List available tools
/tools:enable <name>  - Enable a tool
/tools:disable <name> - Disable a tool
/plugins              - List installed plugins
/plugins:install <git-url> - Install plugin from git
/plugins:remove <name>     - Remove plugin
/exit                 - Exit the application
/help                 - Show this help message
EOF
}

case "$1" in
  login)
    login
    ;;
  logout)
    logout
    ;;
  chat)
    chat
    ;;
  images)
    list_images
    ;;
  image)
    upload_image "$2"
    ;;
  tools)
    list_tools
    ;;
  tools:enable)
    enable_tool "$2"
    ;;
  tools:disable)
    disable_tool "$2"
    ;;
  plugins)
    list_plugins
    ;;
  plugins:install)
    install_plugin "$2"
    ;;
  plugins:remove)
    remove_plugin "$2"
    ;;
  help|--help|-h)
    help
    ;;
  *)
    echo "Shapes CLI Bash"
    echo "Usage: $0 [login|logout|chat|images|image|tools|tools:enable|tools:disable|plugins|plugins:install|plugins:remove|help]"
    ;;
esac