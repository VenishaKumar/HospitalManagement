const { connectDB, client, dbName } = require("../db");
const { ObjectId } = require("mongodb");

// Find Admin by Email
const findAdminByEmail = async (email) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        return await db.collection("admins").findOne({ email });
    } catch (error) {
        console.error("❌ Error finding admin:", error);
        throw error;
    } finally {
        await client.close();
    }
};

// Get Pending Appointments


const getPendingAppointmentsFromDB = async () => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const appointmentsCollection = db.collection("Appointments");

        // Fetch all pending appointments directly from the collection
        const appointments = await appointmentsCollection.find({ status: "Pending" }).toArray();

        return appointments;
    } finally {
        await client.close();
    }
};


// Approve Appointment
const approveAppointmentInDB = async (appointmentId) => {
    try {
        const db = await connectDB();
        const result = await db.collection("Appointments").updateOne(
            { _id: new ObjectId(appointmentId) },
            { $set: { status: "Confirmed" } }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error("❌ Error approving appointment:", error);
        return false;
    }
};

// Reject Appointment
const rejectAppointmentInDB = async (appointmentId, rejectionMessage) => {
    try {
        const db = await connectDB();
        const result = await db.collection("Appointments").updateOne(
            { _id: new ObjectId(appointmentId) },
            { $set: { status: "Rejected", rejectionMessage } }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error("❌ Error rejecting appointment:", error);
        return false;
    }
};

const getAllPatients = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await client.connect();
        console.log("✅ Connected to Database");

        const db = client.db(dbName);
        const collection = db.collection("patients");

        const patients = await collection.find().toArray();
        console.log("🔍 Patients Fetched:", patients); // ✅ DEBUGGING

        return patients;
    } catch (error) {
        console.error("❌ Error retrieving patients:", error);
        return [];
    } finally {
        await client.close();
        console.log("🔌 MongoDB Connection Closed");
    }
};


// Update patient details
const updatePatient = async (patientId, updatedData) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("patients");
        return await collection.updateOne({ _id: patientId }, { $set: updatedData });
    } finally {
        await client.close();
    }
};

// Delete a patient
const deletePatient = async (patientId) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("patients");
        return await collection.deleteOne({ _id: patientId });
    } finally {
        await client.close();
    }
};


////////////////////////// 🩺 MANAGE DOCTORS //////////////////////////

// Get all doctors from the database
const getAllDoctors = async () => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("doctors");
        const doctors = await collection.find().toArray();
        return doctors
    } finally {
        await client.close();
    }
};

// Add a new doctor to the database
const addDoctor = async (doctorData) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("doctors");
        return await collection.insertOne(doctorData);
    } finally {
        await client.close();
    }
};

// Remove a doctor from the database
const deleteDoctor = async (doctorId) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("doctors");

        console.log("Deleting doctor with ID:", doctorId); // ✅ Debugging log

        return await collection.deleteOne({ _id: new ObjectId(doctorId) }); // ✅ Convert to ObjectId
    } catch (error) {
        console.error("❌ Error deleting doctor:", error);
        return { error: "Failed to delete doctor" };
    } finally {
        await client.close();
    }
};

const getAppointmentsForDoctorAndDate = async (doctor, date) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("Appointments");

        // Query for matching doctor and date
        const appointments = await collection.find({ doctor, date }).toArray();
        
        return appointments;
    } finally {
        await client.close();
    }
};





module.exports = { findAdminByEmail, getPendingAppointmentsFromDB, approveAppointmentInDB, rejectAppointmentInDB, getAllDoctors, addDoctor, deleteDoctor,getAllPatients, updatePatient, deletePatient,getAppointmentsForDoctorAndDate};
