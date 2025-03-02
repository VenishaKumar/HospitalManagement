const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/healthcare";
const client = new MongoClient(uri);
const dbName = "healthcare";
const collectionName = "patients";
const collectionA="Appointments";

async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
  }
  return client.db(dbName);
}

// Save a new patient to the database
const savePatient = async (patient) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.insertOne(patient);
  } finally {
    await client.close();
  }
};

// Find a patient by email
const findPatientByphone = async (phone) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    return await collection.findOne({ phone });
  } finally {
    await client.close();
  }
};

const saveAppointment = async (appointment) => {
  try {
      const db = await connectDB();
      const collection = db.collection(collectionA);
      await collection.insertOne(appointment);
      console.log("Appointment saved successfully!");
  } catch (error) {
      console.error("Error saving appointment:", error);
      throw error;
  }
};

// Find appointments by user ID
const findAppointmentsByUser = async (userId) => {
  try {
      const db = await connectDB(); 
      const collection = db.collection("appointments");
      return await collection.find({ userId: userId }).toArray();
  } catch (error) {
      console.error("Error retrieving appointments:", error);
      throw error;
  }
};

module.exports = { savePatient, findPatientByphone ,saveAppointment, findAppointmentsByUser};
