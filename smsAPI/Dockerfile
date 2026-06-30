FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY openapi.json ./
COPY README.md ./
COPY development-plan.md ./

ENV NODE_ENV=production
ENV PORT=3100
ENV DATA_DIR=/app/data

EXPOSE 3100

CMD ["node", "server.js"]
