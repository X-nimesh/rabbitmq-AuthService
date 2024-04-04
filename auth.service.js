const { connectToRabbitMQ } = require("./rabbitmq");

async function consumeFromQueue(queueName) {
  const channel = await connectToRabbitMQ();
  await channel.assertQueue(queueName, { durable: false });
  console.log(`Waiting for messages from ${queueName}...`);

  channel.consume(
    queueName,
    (msg) => {
      console.log(
        `Received message from ${queueName}:`,
        JSON.parse(msg.content.toString())
      );
      // Add your authentication logic here
    },
    { noAck: true }
  );
}

// consumeFromQueue("main_queue");

// const amqp = require('amqplib');
const amqp = require("amqplib");

async function main() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "auth_queue";

  channel.assertQueue(queue, {
    durable: false,
  });

  console.log("Authentication Microservice is waiting for requests...");

  channel.consume(queue, async (msg) => {
    const userData = JSON.parse(msg.content.toString());
    const isAuthenticated = await authenticateUser(userData);
    if (isAuthenticated) {
      console.log("User authenticated successfully:", userData.username);
      // Send response
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from("Authenticated"),
        {
          correlationId: msg.properties.correlationId,
        }
      );
    } else {
      console.log("Authentication failed for user:", userData.username);
      // Send response
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from("Not Authenticated"),
        {
          correlationId: msg.properties.correlationId,
        }
      );
    }

    // Acknowledge message processing
    channel.ack(msg);
  });
}

async function authenticateUser(userData) {
  // Implement your authentication logic here
  // Example: Check credentials against a database
  return userData.username === "example" && userData.password === "password";
}

main().catch(console.error);
