FROM node:21-alpine3.20 AS builder
WORKDIR /app
ENV PORT=3000


# Installs latest Chromium (92) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN corepack enable && corepack prepare yarn@stable --activate

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

EXPOSE ${PORT}
CMD ["yarn", "start"]