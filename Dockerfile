FROM node:16.14.0-bullseye-slim
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]