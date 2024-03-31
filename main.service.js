const amqp = require("amqplib");
const { connectToRabbitMQ } = require("./rabbitmq");

async function publishToQueue(queueName, data) {
  // connect and  Create a channel
  const channel = await connectToRabbitMQ();

  // Declare a queue
  await channel.assertQueue(queueName, { durable: false });

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
  console.log(`Message sent to ${queueName}:`, data);
  setTimeout(() => {
    channel.close();
  }, 1000);
}

async function authController(req, res, next) {
  const { email, password } = req.body;
  console.log("Received request to authenticate user:", email, password);
  await publishToQueue("main_queue", { email, password });
}
module.exports = { authController };
