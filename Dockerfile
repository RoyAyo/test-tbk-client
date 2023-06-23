FROM node:18-alpine

WORKDIR app
COPY . .

COPY package.json .
COPY package-lock.json .

RUN npm ci

EXPOSE 5173
RUN npm run build

CMD [ "npm", "run", "dev" ]