# ###################
# # BUILD FOR PRODUCTION
# ###################

FROM node:22 As build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]