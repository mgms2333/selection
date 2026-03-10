#!/bin/bash

# 数据库初始化脚本
# 用于产品选型系统的数据库初始化

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 数据库配置（可从环境变量覆盖）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-product_selection}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

# SQL 文件路径
INIT_SQL="$PROJECT_DIR/database/init.sql"

echo "=========================================="
echo "产品选型系统 - 数据库初始化"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 检查 mysql 命令
if ! command -v mysql &> /dev/null; then
    echo "错误: 未找到 mysql 客户端，请先安装 MySQL"
    exit 1
fi

# 检查 SQL 文件
if [ ! -f "$INIT_SQL" ]; then
    echo "错误: 未找到数据库初始化文件: $INIT_SQL"
    exit 1
fi

# 显示配置
echo "数据库主机: $DB_HOST:$DB_PORT"
echo "数据库名称: $DB_NAME"
echo "数据库用户: $DB_USER"
echo "SQL 文件: $INIT_SQL"
echo ""

# 确认执行
read -p "确认执行数据库初始化? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "已取消操作"
    exit 0
fi

# 执行初始化 SQL
echo ""
echo "[1/3] 执行数据库初始化脚本..."

if [ -z "$DB_PASS" ]; then
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" < "$INIT_SQL"
else
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" < "$INIT_SQL"
fi

echo "数据库初始化脚本执行完成"

# 创建必要的初始数据
echo ""
echo "[2/3] 创建初始数据..."

# 检查是否有初始数据 SQL
SEED_SQL="$PROJECT_DIR/database/seed.sql"
if [ -f "$SEED_SQL" ]; then
    echo "执行种子数据: $SEED_SQL"
    if [ -z "$DB_PASS" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" < "$SEED_SQL"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SEED_SQL"
    fi
else
    echo "未找到种子数据文件 ($SEED_SQL)，跳过"
fi

# 验证数据库
echo ""
echo "[3/3] 验证数据库..."

TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -N -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME'" 2>/dev/null)

echo "数据库 '$DB_NAME' 包含 $TABLE_COUNT 张表"

echo ""
echo "=========================================="
echo "数据库初始化完成!"
echo "=========================================="