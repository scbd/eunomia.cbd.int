FROM node:18-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache git curl yarn

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN yarn install --production

ENV PORT 8000

EXPOSE 8000

COPY . ./

ARG COMMIT
ENV COMMIT $COMMIT

CMD [ "node", "server" ]
