FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY data ./data
RUN chown -R node:node /app/data

USER node
EXPOSE 4000
CMD ["node", "src/server.js"]
