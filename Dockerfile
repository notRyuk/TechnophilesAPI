FROM node:16.16.0-buster-slim
RUN apt-get install -y openjdk-11-jre-headless
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout.tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]