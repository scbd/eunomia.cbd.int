FROM mhart/alpine-node:10.6

RUN apk update && apk upgrade && \
    apk add --no-cache bash git

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN yarn

ENV PORT 8000

EXPOSE 8000

COPY . ./

RUN unlink /usr/src/app/app/libs
RUN ln -s /usr/src/app/node_modules/@bower_components /usr/src/app/app/libs

CMD [ "node", "server" ]
