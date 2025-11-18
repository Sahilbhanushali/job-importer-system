FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src

ENV NODE_ENV=production
ENV PORT=5003
EXPOSE 5003

CMD ["node", "src/server.js"]


