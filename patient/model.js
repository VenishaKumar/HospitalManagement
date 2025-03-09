const { connectDB, client,dbName } = require("../db"); 

connectDB
// Save a new patient to the database
const savePatient = async (patient) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("patients");
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
    const collection = db.collection("patients");
    return await collection.findOne({ phone });
  } finally {
    await client.close();
  }
};

const saveAppointment = async (appointment) => {
  try {
      const db = await connectDB();
      const collection = db.collection("Appointments");
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
      const collection = db.collection("Appointments");
      return await collection.find({ userId: userId }).toArray();
  } catch (error) {
      console.error("Error retrieving appointments:", error);
      throw error;
  }
};

const getPrescriptionsByPhone = async (phoneNumber) => {
  try {
      const db = await connectDB();
      const collection = db.collection("prescriptions");

      const prescriptions = await collection.find({ "patient.contact": phoneNumber }).toArray();
      console.log("✅ Prescriptions found:");
      return prescriptions;
  } catch (error) {
      console.error("❌ Error retrieving prescriptions:", error);
      throw error;
  }
};


const updatePatient = async (phone, updatedData) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("patients");
    console.log(updatedData)
    await collection.updateOne({ phone }, { $set: updatedData });
  } finally {
    await client.close();
  }
};







module.exports = { savePatient, findPatientByphone ,saveAppointment, findAppointmentsByUser,getPrescriptionsByPhone,updatePatient};
