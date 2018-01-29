FROM node:8

WORKDIR /usr/src/app

ADD ./index.js ./tsconfig.json ./jsconfig.json /usr/src/app/
ADD ./package.json /usr/src/app/

# --registry=https://registry.npm.taobao.org
RUN npm install

ADD ./src /usr/src/app/src
ADD ./config /usr/src/app/config

RUN npm run tsc
RUN rm -rf node_modules
RUN npm install --production
RUN npm install cross-env tsconfig-paths --save-dev
RUN npm cache clean -f

CMD [ "npm", "run", "start:prod" ]

EXPOSE 9000
