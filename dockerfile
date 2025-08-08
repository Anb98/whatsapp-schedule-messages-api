FROM zenika/alpine-chrome:with-puppeteer
WORKDIR /app
USER root
RUN npm install -g corepack@0.24.1 && corepack enable
USER chrome
COPY --chown=chrome:chrome . .
RUN yarn install --check-cache
EXPOSE 3000
CMD ["yarn", "start"]