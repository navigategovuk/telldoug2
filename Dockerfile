FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run contracts:generate && npm run build

ENV NODE_ENV=production
EXPOSE 3333

CMD ["npm", "run", "start"]
