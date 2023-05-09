FROM node:17

RUN apt-get update && \
  apt-get install -yq --no-install-recommends libasound2 libnss3-dev libgtk-3-dev sudo zip fakeroot dpkg

WORKDIR /app
COPY . .
RUN chown -R node /app

USER node
RUN yarn install

USER root
RUN chown root /app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /app/node_modules/electron/dist/chrome-sandbox

USER node
CMD yarn make
