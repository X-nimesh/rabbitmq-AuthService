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

//* new code with reply queue
async function authController2(req, res) {
  try {
    const { username, password } = req.body;

    // Connect to RabbitMQ server
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // Declare a queue for receiving authentication response
    const replyQueue = await channel.assertQueue("", { exclusive: true });

    // Generate a unique correlation ID
    const correlationId = generateUuid();

    // Set up a consumer to listen for authentication response
    channel.consume(
      replyQueue.queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          // Parse the authentication response
          const authenticated = msg.content.toString() === "Authenticated";
          if (authenticated) {
            // Respond with success message
            console.log("User authenticated successfully");
            res.status(200).json({ message: "Authentication successful" });
          } else {
            console.log("Authentication failed");
            // Respond with failure message
            res.status(401).json({ message: "Authentication failed" });
          }
        }
      },
      { noAck: true }
    );

    // Send authentication request to the authentication microservice
    const authData = { username, password };
    channel.sendToQueue("auth_queue", Buffer.from(JSON.stringify(authData)), {
      correlationId: correlationId,
      replyTo: replyQueue.queue,
    });
  } catch (error) {
    console.error("Error in authentication:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Function to generate a unique correlation ID
function generateUuid() {
  return (
    Math.random().toString() +
    Math.random().toString() +
    Math.random().toString()
  );
}

// Export the authentication controller function
// module.exports = authController;
module.exports = { authController2 };
