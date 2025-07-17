export const sendSMS = async (phoneNumber: string, message: string): Promise<void> => {
  // Hypothetical SMS service integration (e.g., Twilio)
  try {
    // Example: Using Twilio (replace with actual SMS provider)
    // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    throw new Error("Failed to send SMS notification");
  }
};