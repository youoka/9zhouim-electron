#!/bin/bash

# OpenIM H5 Demo 构建和部署脚本
# 提供构建、运行和清理功能

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认变量
IMAGE_NAME="openim-h5-demo"
CONTAINER_NAME="openim-h5-demo"
HOST_PORT=8003
CONTAINER_PORT=80

# 显示使用说明
usage() {
    echo "使用方法: $0 [选项]"
    echo "选项:"
    echo "  build          构建 Docker 镜像"
    echo "  run            运行容器"
    echo "  stop           停止并删除容器"
    echo "  restart        重启容器"
    echo "  logs           查看容器日志"
    echo "  status         查看容器状态"
    echo "  clean          清理镜像和容器"
    echo "  help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build       构建镜像"
    echo "  $0 run         运行容器 (默认端口: $HOST_PORT)"
    echo "  $0 run 3000    在指定端口运行容器"
}

# 构建镜像
build_image() {
    echo -e "${GREEN}开始构建 Docker 镜像...${NC}"
    
    # 检查 Dockerfile 是否存在
    if [ ! -f "Dockerfile" ]; then
        echo -e "${RED}错误: Dockerfile 不存在${NC}"
        exit 1
    fi
    
    # 构建镜像
    docker build -t ${IMAGE_NAME} .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}镜像构建成功!${NC}"
    else
        echo -e "${RED}镜像构建失败!${NC}"
        exit 1
    fi
}

# 运行容器
run_container() {
    local port=${1:-$HOST_PORT}
    
    echo -e "${GREEN}正在启动容器...${NC}"
    
    # 停止并删除已存在的容器
    stop_container
    
    # 运行新容器
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${port}:${CONTAINER_PORT} \
        ${IMAGE_NAME}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}容器启动成功!${NC}"
        echo -e "${YELLOW}访问地址: http://localhost:${port}${NC}"
        echo -e "${YELLOW}容器名称: ${CONTAINER_NAME}${NC}"
    else
        echo -e "${RED}容器启动失败!${NC}"
        exit 1
    fi
}

# 停止容器
stop_container() {
    # 检查容器是否存在
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        echo -e "${YELLOW}停止并删除现有容器...${NC}"
        docker stop ${CONTAINER_NAME} >/dev/null 2>&1
        docker rm ${CONTAINER_NAME} >/dev/null 2>&1
    fi
}

# 重启容器
restart_container() {
    echo -e "${GREEN}重启容器...${NC}"
    stop_container
    run_container $1
}

# 查看日志
show_logs() {
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        echo -e "${GREEN}显示容器日志...${NC}"
        docker logs -f ${CONTAINER_NAME}
    else
        echo -e "${YELLOW}容器未运行${NC}"
    fi
}

# 查看状态
show_status() {
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        echo -e "${GREEN}容器状态:${NC}"
        docker ps -f name=${CONTAINER_NAME}
    else
        echo -e "${YELLOW}容器未运行${NC}"
    fi
}

# 清理镜像和容器
clean_all() {
    echo -e "${YELLOW}清理镜像和容器...${NC}"
    stop_container
    
    # 删除镜像
    if [ "$(docker images -q ${IMAGE_NAME})" ]; then
        docker rmi ${IMAGE_NAME} >/dev/null 2>&1
        echo -e "${GREEN}镜像已删除${NC}"
    else
        echo -e "${YELLOW}镜像不存在${NC}"
    fi
}

# 主逻辑
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        run_container $2
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container $2
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}未知选项: $1${NC}"
        usage
        exit 1
        ;;
esac