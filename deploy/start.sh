#!/bin/bash

# 产品选型系统启动脚本

PROJECT_DIR=/home/codes/product-selection-system

echo "Starting Product Selection System..."

# 1. 初始化数据库
echo "Initializing database..."
PGPASSWORD=selection123 psql -h localhost -U selection_user -d selection_db -f $PROJECT_DIR/database/init.sql

# 2. 编译后端
echo "Building backend..."
cd $PROJECT_DIR/backend
mkdir -p build
cd build
cmake ..
make -j$(nproc)

# 3. 启动后端服务
echo "Starting backend service..."
sudo cp $PROJECT_DIR/deploy/selection.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start selection
sudo systemctl enable selection

# 4. 构建前端
echo "Building frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# 5. 配置 Nginx
echo "Configuring Nginx..."
sudo cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/conf.d/selection.conf
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Product Selection System started successfully!"
echo "Access at: http://localhost"