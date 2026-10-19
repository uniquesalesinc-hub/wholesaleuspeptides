FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g @anthropic-ai/claude-code

WORKDIR /app/bridge
COPY package.json *.js ./

ENV NODE_ENV=production \
    REPO_DIR=/app/repo \
    PORT=8787
EXPOSE 8787

CMD ["node", "server.js"]
