var path = require("path");
var exec = require("child_process").exec;
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var parameterize = require("parameterize");
var isCameraOn = require("is-camera-on");
var plist = require("plist");
const runApplescript = require("run-applescript");
const fs = require("fs");
var config_dir = process.env.CONFIG_DIR || "./config";
var config = require(config_dir + "/config.json");

var brightness = path.resolve(__dirname, "bin", "brightness");
var volume = path.resolve(__dirname, "bin", "volume");
var audiodevice = path.resolve(__dirname, "bin", "audiodevice");
var dnd = path.resolve(__dirname, "bin", "dnd");
var ioreg = "/usr/sbin/ioreg";
const execa = require('execa');

const objType = require('obj-type');
const lowercaseFirstKeys = require('lowercase-first-keys');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.raw());
app.use(bodyParser.json());
var logFormat =
  "'[:date[iso]] - :remote-addr - :method :url :status :response-time ms - :res[content-length]b'";
app.use(morgan(logFormat));

app.get("/_ping", function(req, res) {
  res.send("OK");
});

app.get("/", function(req, res) {
  res.sendfile("index.html");
});
app.get("/link", function(req, res) {
  (async () => {
    const result = await runApplescript(
      fs.readFileSync("script.scpt", "UTF-8")
    );

    res.redirect(result);
    //=> 'unicorn'
  })();
});

app.get("/battery", function(req, res) {
  result = execa
    .stdout("/usr/sbin/ioreg", ["-n", "AppleSmartBattery", "-r", "-a"])
    .then(plist.parse)
    .then(batteries => {
      if (!batteries || batteries.length === 0) {
        throw new Error("This computer doesn't have a battery");
      }

      const battery = lowercaseFirstKeys(batteries[0]);

      return Object.keys(battery).reduce((obj, x) => {
        const val = battery[x];
        obj[x] = objType(val) === "object" ? lowercaseFirstKeys(val) : val;
        return obj;
      }, {});
    }).then(battery =>{
      const {currentCapacity, maxCapacity} = battery
      res.send(""+(currentCapacity / maxCapacity).toFixed(2)*100)
    });

  

    
});
app.post("/wake", function(req, res) {
  exec("caffeinate -u -t 1", function(error, stdout, stderr) {
    res.send("OK");
  });
});
app.get("/display", function(req, res) {
  exec(
    "/usr/sbin/ioreg -n IODisplayWrangler | grep -i IOPowerManagement | grep -o -E 'CurrentPowerState.{0,3}'",
    function(error, stdout, stderr) {
      result = stdout
        .split("=")
        .slice(1)
        .join()
        .trim();
      console.log(result);
      res.send(result + "");
    }
  );
});

app.post("/display", function(req, res) {
  console.log(req.body.command);
  if (req.body.command == "on") {
    exec("caffeinate -u -t 1", function(error, stdout, stderr) {
      res.send("OK");
    });
  } else if (req.body.command == "off") {
    exec("pmset displaysleepnow", function(error, stdout, stderr) {
      res.send("OK");
    });
  }
});

app.post("/sleep_display", function(req, res) {
  exec("pmset displaysleepnow", function(error, stdout, stderr) {
    res.send("OK");
  });
});

app.post("/brightness/:level", function(req, res) {
  level = req.params.level;
  exec(`${brightness} ${level}`, function(error, stdout, stderr) {
    res.send("OK");
  });
});

app.post("/volume/:level", function(req, res) {
  level = req.params.level;
  exec(`${volume} ${level}`, function(error, stdout, stderr) {
    res.send("OK");
  });
});

app.post("/dnd/:state", function(req, res) {
  state = req.params.state;
  exec(`${dnd} ${state}`, function(error, stdout, stderr) {
    res.send("OK");
  });
});

app.post("/audiodevice/:port/:device", function(req, res) {
  port = req.params.port;
  device = req.params.device;
  exec(`${audiodevice} ${port} "${device}"`, function(error, stdout, stderr) {
    res.send("OK");
  });
});

app.get("/camera", function(req, res) {
  isCameraOn().then(status => {
    res.send(status);
  });
});

app.get("/hid_idle_time", function(req, res) {
  exec(`${ioreg} -a -r -n IOHIDSystem`, function(error, stdout, stderr) {
    res.json(plist.parse(stdout)[0]["HIDIdleTime"] / 1000000000);
  });
});

app.listen(process.env.PORT || 8686);
