# CodaBox SyncTool

A CodaBox client

## Quick start

Install all dependencies:

    yarn install

Start the application

    yarn start

Linter check

    yarn lint .

Autoformat the code

    yarn lint:fix .

## Development

The main source paths at this point

-   `src/main/`: main starting point for the electron application.
-   `src/preload.js`: js source which bridges between the main file and the browser renderer
-   `src/renderer/`: the front-end code. Based on [vuejs].

Check out the [electronjs quickstart] for an explanation of the boiler plate code.

Note that there are security-related reasons to not have the browser window being able to execute arbitrary system calls.
Check out this [SO post on electronjs] for an explanation of the relationship between the 3 files.

As we use [vue single file components], these need to be "webpacked" first prior to actually using those.
The setup used here is a modified version of the [electron-forge webpack] template.

[electronjs quickstart]: https://www.electronjs.org/docs/latest/tutorial/quick-start
[so post on electronjs]: https://stackoverflow.com/a/69917666/1393391
[vuejs]: https://vuejs.org/
[vue single file components]: https://vuejs.org/guide/scaling-up/sfc.html

## docker

A docker file / docker-compose setup is included to aid in the testing

Build the full application dependencies

    docker-compose build

Package the application

    docker-compose run --rm synctool yarn electron-forge package

Start a local SFTP server; file contents served from the `./sftp` local folder

    docker-compose up sftp

The default username password for this SFTP server is `foo:pass`; which can be used from the CodaBox SyncTool UI.

## Environment variables

Certain behaviors of the tool can be influenced using environment variables, mainly to facility testing:

-   `SYNC_TOOL_HOST`: hostname of the remote SFTP to connect to
-   `SYNC_TOOL_PORT`: port of the remote SFTP to connect to
-   `SYNC_TOOL_NO_REMOTE_ROOT`: whether or not the remote SFTP connection starts from `/`
-   `SYNC_TOOL_DEV_TOOLS`: enable the in-browser chrome dev tools
-   `SYNC_TOOL_SCHEDULE_MINUTES`: change the schedule for the downloads to run this amount of minutes instead of every 2 hours

## Building and releasing

Building the application is done using [`electron-forge`].
The `package.json` file contains the specific config for cross-platform building.
To actually build for different platforms, the package build process needs to be executed on the plaform itself (mac, windows, linux).

Check `.github/workflows/build.yaml` for the github actions config accross multiple platforms.

You can locally build the application with the build script

    yarn make

... but it will only build for your local platform

Releasing has a similar config in `.github/workflows/release.yaml`.
It performs the same tasks as the build job, only for tags in the format `v<x>.<y>.<z>`.
At the end of the build, it will publish a _draft_ release to the github releases page, which can then manually be marked as the newly released version.

The main application itself has an _auto-update_ feature which makes the application check for new releases on github and auto-update directly.
It will check at start-up time and after that every 10 minutes.

[`electron-forge`]: https://www.electronforge.io/
