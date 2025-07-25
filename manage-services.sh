#!/bin/bash

# Phone Config Generator Service Management Script

case "$1" in
    start)
        echo "Starting Phone Config Generator services..."
        systemctl --user start phone-config-generator.target
        systemctl --user start phone-config-health-check.timer
        echo "Services started"
        ;;
    stop)
        echo "Stopping Phone Config Generator services..."
        systemctl --user stop phone-config-generator.target
        systemctl --user stop phone-config-health-check.timer
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting Phone Config Generator services..."
        systemctl --user restart phone-config-generator.target
        systemctl --user restart phone-config-health-check.timer
        echo "Services restarted"
        ;;
    status)
        echo "Phone Config Generator Service Status:"
        echo "====================================="
        for service in ssh-ws auth management webapp; do
            status=$(systemctl --user is-active "phone-config-$service.service" 2>/dev/null || echo "inactive")
            if [ "$status" = "active" ]; then
                echo "✅ $service: $status"
            else
                echo "❌ $service: $status"
            fi
        done
        ;;
    logs)
        service=${2:-all}
        if [ "$service" = "all" ]; then
            journalctl --user -u "phone-config-*" -f
        else
            journalctl --user -u "phone-config-$service.service" -f
        fi
        ;;
    enable)
        echo "Enabling Phone Config Generator services for auto-start..."
        systemctl --user enable phone-config-generator.target
        systemctl --user enable phone-config-health-check.timer
        echo "Services enabled"
        ;;
    disable)
        echo "Disabling Phone Config Generator services..."
        systemctl --user disable phone-config-generator.target
        systemctl --user disable phone-config-health-check.timer
        echo "Services disabled"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|enable|disable}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - Show logs (optionally specify service name)"
        echo "  enable   - Enable services for auto-start"
        echo "  disable  - Disable auto-start"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs ssh-ws"
        exit 1
        ;;
esac
