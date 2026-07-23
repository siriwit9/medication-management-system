#!/bin/bash
# ===================================================================
# Setup Script — ระบบจัดการคลังยา รพ.สต.
# ใช้สำหรับตั้งค่า config.js อัตโนมัติ
#
# การใช้งาน:
#   chmod +x deploy-kit/setup.sh
#   ./deploy-kit/setup.sh "รพ.สต.ตำบลบ้านนา" "https://xxxxx.supabase.co" "eyJhbGci..."
#
# หรือรันแบบโต้ตอบ:
#   ./deploy-kit/setup.sh
# ===================================================================

set -e

# สี
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo ""
echo -e "${PURPLE}================================================${NC}"
echo -e "${PURPLE}  ระบบจัดการคลังยา — Setup Script${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""

# รับค่าจาก arguments หรือถามผู้ใช้
HOSPITAL_NAME="${1:-}"
SUPABASE_URL="${2:-}"
SUPABASE_KEY="${3:-}"

if [ -z "$HOSPITAL_NAME" ]; then
  read -p "ชื่อ รพ.สต. (เช่น รพ.สต.ตำบลบ้านนา): " HOSPITAL_NAME
fi

if [ -z "$SUPABASE_URL" ]; then
  read -p "Supabase Project URL (เช่น https://xxxxx.supabase.co): " SUPABASE_URL
fi

if [ -z "$SUPABASE_KEY" ]; then
  read -p "Supabase Anon Key: " SUPABASE_KEY
fi

# หา directory ของ project
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/frontend/assets/js/config.js"

echo ""
echo -e "${BLUE}ตั้งค่า:${NC}"
echo "  ชื่อ รพ.สต.:     $HOSPITAL_NAME"
echo "  Supabase URL:   $SUPABASE_URL"
echo "  Config File:    $CONFIG_FILE"
echo ""

# สร้าง Hospital Code จากชื่อ
HOSPITAL_CODE=$(echo "$HOSPITAL_NAME" | sed 's/รพ.สต.//g' | sed 's/ตำบล//g' | sed 's/ //g' | head -c 20)

# สร้าง config.js
cat > "$CONFIG_FILE" << EOF
/**
 * ตั้งค่าระบบคลังยา — $HOSPITAL_NAME
 * สร้างอัตโนมัติโดย setup.sh เมื่อ $(date '+%Y-%m-%d %H:%M:%S')
 */
(function () {
  function getMeta(name) {
    var el = document.querySelector('meta[name="app-' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  window.APP_CONFIG = {
    DATA_PROVIDER: getMeta('data-provider') || 'supabase',
    SUPABASE_URL: getMeta('supabase-url') || '$SUPABASE_URL',
    SUPABASE_ANON_KEY: getMeta('supabase-key') || '$SUPABASE_KEY',
    APPS_SCRIPT_URL: getMeta('gas-url') || '',
    HOSPITAL_CODE: getMeta('hospital-code') || '$HOSPITAL_CODE',
    DEFAULT_THRESHOLDS: { red: 35, orange: 60, yellow: 120 }
  };
})();
EOF

echo -e "${GREEN}สร้าง config.js เรียบร้อยแล้ว${NC}"
echo ""

# แจ้งขั้นตอนต่อไป
echo -e "${PURPLE}================================================${NC}"
echo -e "${GREEN}  Setup เสร็จสมบูรณ์${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""
echo "ขั้นตอนต่อไป:"
echo "  1. ไปที่ Supabase Dashboard > SQL Editor"
echo "  2. Run ไฟล์ SQL ทีละไฟล์ ตามลำดับ:"
echo "     - supabase/migrations/001_create_tables.sql"
echo "     - supabase/migrations/002_rls_policies.sql"
echo "     - supabase/migrations/003_receipts_and_jhcis.sql"
echo ""
echo "  3. Deploy folder 'frontend/' ขึ้น Netlify"
echo "  4. เข้าสู่ระบบด้วย admin / admin1234"
echo ""
