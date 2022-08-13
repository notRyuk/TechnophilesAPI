FROM openjdk:latest
RUN apt install -y curl \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt install -y nodejs \
  && curl -L https://www.npmjs.com/install.sh | sh
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout.tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]