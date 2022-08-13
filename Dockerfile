FROM node:16.14.0-bullseye-slim
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout/tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]