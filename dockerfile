FROM zenika/alpine-chrome:with-puppeteer
WORKDIR /app
USER chrome
COPY --chown=chrome:chrome . .
RUN yarn install --check-cache
EXPOSE 3000
CMD ["yarn", "start"]