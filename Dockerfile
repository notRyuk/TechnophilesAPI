FROM ubuntu:22.04
RUN apt-get update 
RUN apt-get install -y openjdk-17-jdk
RUN apt-get install -y nodejs
RUN apt-get install -y npm
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
RUN cp ./layout.tmpl node_modules/docdash/tmpl/
RUN npm run generate-docs
CMD ["node", "server.js"]