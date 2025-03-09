const { connectDB, client, dbName } = require("../db");

// Find a doctor by email
const findDoctorByEmail = async (email) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("doctors");
    return await collection.findOne({ email });
  } finally {
    await client.close();
  }
};

// Search patients by name or phone
const searchPatients = async (query) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("patients");

    return await collection.findOne({
      $or: [{ name: { $regex: query, $options: "i" } }, { phone: query }]
    });
  } finally {
    await client.close();
  }
};

// Get all appointments for a specific patient
const getAppointmentsByPhone = async (phone) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("Appointments");
    return await collection.find({ phone }).toArray(); // ✅ Search by phone number
  } finally {
    await client.close();
  }
};

// Get all prescriptions for a patient using phone number
const getPrescriptionsByPhone = async (phone) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("prescriptions");
    return await collection.find({ "patient.contact": phone }).toArray(); // ✅ Search by phone number
  } finally {
    await client.close();
  }
};

const getAppointmentsByDoctor = async (doctorName) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("Appointments");

    return await collection.find({ doctor: doctorName }).toArray();
  } finally {
    await client.close();
  }
};


// Save a prescription in the database
const savePrescription = async (prescription) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("prescriptions");

        const result = await collection.insertOne(prescription);
        console.log("✅ Prescription saved:", result.insertedId);
        return result;
    } catch (error) {
        console.error("❌ Error saving prescription:", error);
        throw error;
    } finally {
        await client.close();
    }
};

// Get prescriptions for a specific patient





module.exports = {
  findDoctorByEmail,
  searchPatients,
  getAppointmentsByPhone,
  getAppointmentsByDoctor,
  getPrescriptionsByPhone,
  savePrescription
};
