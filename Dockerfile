FROM openjdk:latest

RUN apt-get install -y curl 
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - 
RUN  apt-get install -y nodejs 
RUN curl -L https://www.npmjs.com/install.sh | sh 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout.tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]