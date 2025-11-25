# 生产阶段
FROM nginx:alpine

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 删除 nginx 默认文件并复制构建产物
RUN rm -rf /usr/share/nginx/html/*
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]