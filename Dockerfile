FROM node:16.16.0-buster-slim
RUN /bin/maven -DoutputFile=target/mvn-dependency-list.log -B -DskipTests clean dependency:list install
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
COPY ./layout.tmpl ./mode_modules/docdash/tmpl/layout.tmpl
CMD ["node", "server.js"]