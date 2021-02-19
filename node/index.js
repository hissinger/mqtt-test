const mqtt = require("mqtt");
const client = mqtt.connect({
  hostname: "",
  port: 9001,
  protocol: "ws",
});

client.on("connect", function () {
  client.subscribe("presence", function (err) {
    if (!err) {
      client.publish("presence", "Hello mqtt");
    }
  });
});

client.on("message", function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  client.end();
});
