# Mac API!!

Mac API is a simple server allowing you to remotely command certain things on
your Mac. This is mostly useful for a desktop computer that is always on.



## Features

* Wake your display.
* Sleep your display.
* Set your display's brightness.
* Set your volume.
* Toggle Do Not Disturb mode on or off.
* Set the audio device used for input or output.

## Setup

    script/bootstrap

## Running It
Get up and running immediately with `script/server`.

Mac API will run on port `8686` by default. Use the `PORT` environment
variable to use your own port.

### Forever
Mac API has support for [Forever](https://github.com/foreverjs/forever). It uses
`launchd` on macOS to kick it off so that it starts on boot.

### Development
You can simply run it by calling `script/server`. This will run it in development
mode with logging to standard out.

### Install as Service on macOS

    script/install

## Logging

Mac API logs all of its requests. In `production`, it logs to a file at `log/logs.log`.
In `development` mode, it just logs to stdout.

## Development

Launch the app via `script/server` to run it in the development environment.

## HTTP API

This is a quick overview of the HTTP service. Read [app.js](app.js) if you need more
info. It doesn't do a lot yet.

### Methods

These are the endpoints you can hit to do things.

#### Endpoints

    POST /sleep_display
    POST /wake
    POST /brightness/:level - Level: 0-32
    POST /volume/:level - Level: 0-100
    POST /dnd/:state - State: on or off
    POST /audiodevice/:port/:device - Port: input or output, Device: name of device
    GET /camera - Returns true if built-in camera in is in use, false otherwise.
    GET /hid_idle_time - returns the time in seconds since the last keyboard/mouse interaction

## Contributions

* fork
* create a feature branch
* open a Pull Request


## Homeassistant Setup

```yaml
  - platform: rest
    name: "schermi"
    resource: http://192.168.1.220:8686/display
    body_on: '{"command": "on"}'
    body_off: '{"command": "off"}'
    is_on_template: '{{value == "4"}}'
    headers:
      Content-Type: application/json
 ```
