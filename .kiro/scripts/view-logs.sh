#!/bin/bash

# Script to view bridge backend logs on Hostinger

SERVER="root@72.61.226.99"
LOG_DIR="/var/www/ucc-bridge-backend/logs"

echo "=== Bridge Backend Log Viewer ==="
echo ""
echo "Select log type to view:"
echo "1) Transaction logs (all bridge transfers)"
echo "2) Combined logs (last 100 lines)"
echo "3) Error logs"
echo "4) PM2 logs (live)"
echo "5) Monitor transactions (live - raw)"
echo "6) Recent transactions (last 20)"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
  1)
    echo ""
    echo "=== Transaction Logs ==="
    ssh $SERVER "cat $LOG_DIR/transactions.log"
    ;;
  2)
    echo ""
    echo "=== Combined Logs (last 100 lines) ==="
    ssh $SERVER "tail -100 $LOG_DIR/combined.log"
    ;;
  3)
    echo ""
    echo "=== Error Logs ==="
    ssh $SERVER "cat $LOG_DIR/error.log"
    ;;
  4)
    echo ""
    echo "=== PM2 Live Logs (Ctrl+C to exit) ==="
    ssh $SERVER "pm2 logs ucc-bridge-relayer"
    ;;
  5)
    echo ""
    echo "=== Monitoring Transactions (Ctrl+C to exit) ==="
    ssh $SERVER "tail -f $LOG_DIR/transactions.log"
    ;;
  6)
    echo ""
    echo "=== Recent Transactions (last 20) ==="
    ssh $SERVER "tail -20 $LOG_DIR/transactions.log"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
