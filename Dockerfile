FROM ubuntu:22.04
RUN apt-get update && apt-get install -y defalt-jre && apt-get install -y node && apt-get install -y npm
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout.tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]