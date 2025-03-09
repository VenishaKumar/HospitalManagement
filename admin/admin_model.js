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
        const db = await connectDB();
        return await db.collection("Appointments").find({ status: "Pending" }).toArray();
    } catch (error) {
        console.error("❌ Error retrieving pending appointments:", error);
        throw error;
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

module.exports = { findAdminByEmail, getPendingAppointmentsFromDB, approveAppointmentInDB, rejectAppointmentInDB };
