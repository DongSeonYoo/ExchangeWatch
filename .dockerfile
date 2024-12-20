# ###################
# # BUILD FOR PRODUCTION
# ###################

FROM node:22 As build

# WORKDIR /usr/src/app

# COPY package*.json ./
# COPY prisma ./prisma/

# RUN npm ci --only=production

# COPY . .

# RUN npm run build

# ###################
# # PRODUCTION
# ###################

# FROM node:22-slim As production

# # Ubuntu 기본 설정
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     tzdata \
#     && rm -rf /var/lib/apt/lists/* \
#     && ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

# WORKDIR /usr/src/app

# COPY --from=build /usr/src/app/node_modules ./node_modules
# COPY --from=build /usr/src/app/dist ./dist
# COPY --from=build /usr/src/app/prisma ./prisma

# # 포트 설정 (필요한 경우 변경)
# EXPOSE 3000

# CMD [ "npm", "run", "start:prod" ]