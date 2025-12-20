#!/data/data/com.termux/files/usr/bin/bash
# Termux Installer Script


# Android App Requirements:
# - Termux
# - Termux:Widgets (for home screen shortcuts, optional)


# Logging functions
log_info() {
    echo -e "\e[32m[INFO]\e[0m $1"
}

log_error() {
    echo -e "\e[31m[ERROR]\e[0m $1"
}

log_warning() {
    echo -e "\e[33m[WARNING]\e[0m $1"
}

terminate_script() {
    termux-wake-unlock
    log_error "Terminating script."
    exit 1
}

graceful_exit() {
    termux-wake-unlock
    exit 0
}

TRAP_USER_INT() {
    log_warning "Script interrupted by user."
    log_warning "You may need to manually clean up any partially installed files."
    terminate_script
}

trap TRAP_USER_INT SIGINT

main () {

    # Safeguards against sourcing and piping
    if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
        log_error "This script must be executed, not sourced."
        echo "Use: ./$(basename "$0")"
        terminate_script
    fi

    if [[ ! -f "$0" ]]; then
        log_error "This script is not running from a file."
        log_warning "Do NOT pipe it into bash."
        log_warning "Download it first, then run it:"
        log_warning "  curl -O <url>"
        log_warning "  chmod +x termux-installer.sh"
        log_warning "  ./termux-installer.sh"
        terminate_script
    fi

    SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}" 2>/dev/null || true)"
    ZERO_PATH="$(realpath "$0" 2>/dev/null || true)"

    if [[ -z "$ZERO_PATH" || -z "$SCRIPT_PATH" || "$ZERO_PATH" != "$SCRIPT_PATH" ]]; then
        log_error "Script was not executed correctly."
        log_warning "$0 does not refer to the installer file."
        log_warning
        log_warning "Correct usage:"
        log_warning "  chmod +x termux-installer.sh"
        log_warning "  ./termux-installer.sh"
        terminate_script
    fi

    if [[ -z "${BASH_VERSION:-}" ]]; then
        log_error "This installer must be run with bash."
        terminate_script
    fi

    cd ~

    log_info "Starting Betterbahn Termux installation script..."

    echo ""
    echo ""
    echo ""
    log_warning "This script will install a proot-distro Debian environment to run Betterbahn."
    log_warning "Please ensure you have sufficient storage space and a stable internet connection. (At least 10GB of free space is recommended.)"
    log_warning "The installation may take some time depending on your internet speed and device performance."
    echo ""
    echo ""
    echo ""

    read -rp "Press ENTER to continue or CTRL+C to abort..."
    termux-wake-lock

    log_info "Updating package lists..."
    apt-get update -y

    log_info "Installing proot Environment..."
    apt-get install proot-distro curl -y

    log_info "Installing Debian environment via proot-distro..."
    log_info "You can safely ignore any lscpu errors that may appear during installation."

    # Install Distro
    proot-distro remove betterbahn-runtime || true # Remove existing installation if any
    proot-distro install debian --override-alias betterbahn-runtime

    log_info "Entering proot environment to continue setup..."
    
    mkdir -p ~/.betterbahn-installer
    
    SCRIPT_PATH="$(realpath "$0")"
    cp "$SCRIPT_PATH" ~/.betterbahn-installer/termux-installer.sh


    mkdir -p ~/betterbahn

    proot-distro login betterbahn-runtime --bind "$HOME/.betterbahn-installer:/installer" --fix-low-ports --env NEXT_TELEMETRY_DISABLED=1 --env TZ=Europe/Berlin -- bash /installer/termux-installer.sh stage2


    log_info "Exiting proot environment."
    log_info "Creating startup script for Betterbahn..."

    mkdir -p ~/.local/bin

    cat << 'EOF' > ~/.local/bin/betterbahn-open-browser
#!/data/data/com.termux/files/usr/bin/bash
sleep 10
termux-open-url http://localhost:3000
EOF

    cat << 'EOF' > ~/start-betterbahn.sh
#!/data/data/com.termux/files/usr/bin/bash

~/.local/bin/betterbahn-open-browser &

echo "Starting Betterbahn..."
echo "To stop Betterbahn, please terminate this script (CTRL+C)."
proot-distro login betterbahn-runtime --fix-low-ports --env NEXT_TELEMETRY_DISABLED=1 --env TZ=Europe/Berlin -- bash -c "cd /app && node server.js"
EOF

    chmod +x ~/start-betterbahn.sh ~/.local/bin/betterbahn-open-browser

    mkdir -p ~/.shortcuts
    cp ~/start-betterbahn.sh ~/.shortcuts/Betterbahn.sh
    chmod +x ~/.shortcuts/Betterbahn.sh


    log_info "Betterbahn installation completed successfully."
    log_info "You can start Betterbahn by running the script: ~/start-betterbahn.sh"
    log_info "Enjoy using Betterbahn!"
    
    graceful_exit
}

stage2 () {
    log_info "Successfully entered proot environment."
    log_info "Updating package lists inside proot..."
    apt-get update -y
    log_info "Upgrading existing packages inside proot..."
    apt-get upgrade -y

    log_info "Installing required packages..."
    apt-get install git nodejs skopeo umoci -y

    log_info "Downloading docker image..."
    skopeo copy docker://ghcr.io/betterbahn/betterbahn:latest oci:bb-image:latest

    log_info "Extracting docker image this will take very long..."
    umoci --verbose unpack --image bb-image:latest betterbahn-rootfs
    mv betterbahn-rootfs/rootfs/app/ /app

    log_info "Cleaning up downloaded image files..."
    rm -rf bb-image betterbahn-rootfs

    log_info "Betterbahn installation completed successfully inside proot environment."
}

export DEBIAN_FRONTEND=noninteractive
export APT_LISTCHANGES_FRONTEND=none

if [ "$1" == "stage2" ]; then
    set -euo pipefail
    IFS=$'\n\t'
    stage2
else
    set -euo pipefail
    IFS=$'\n\t'
    main
fi