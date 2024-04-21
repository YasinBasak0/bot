FROM node:12.14

ARG DEBIAN_FRONTEND=noninteractive
ARG NPM_CONFIG_PREFIX=/home/node/.npm-global
ARG PATH=$PATH:/home/node/.npm-global/bin
ARG PYTHON_VERSION=2.7.5


RUN apt-get update
RUN apt-get install curl -y


RUN apt-get install git -y
# Create app directory
WORKDIR /usr/src/app
RUN node -v

COPY ./actions /usr/src/app/out/bp/data/global/actions
COPY . .
RUN yarn
RUN yarn cmd build
CMD [ "node","/usr/src/app/out/bp" ]
