FROM node:16.13.1-alpine3.15

WORKDIR /app
COPY . /app
RUN npm install

CMD [ "npm", "start" ]