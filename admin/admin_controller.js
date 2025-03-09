const bcrypt = require("bcrypt");
const { 
    findAdminByEmail, 
    approveAppointmentInDB, 
    rejectAppointmentInDB, 
    getPendingAppointmentsFromDB 
} = require("./admin_model");

// Admin Login
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await findAdminByEmail(email);
        if (!admin) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        req.session.admin = { id: admin._id, email: admin.email };
        console.log("✅ Admin logged in:", email);
        
        res.json({ success: true, redirectUrl: "/admindashboard.html" });
    } catch (error) {
        console.error("❌ Admin login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Logout Admin
const logoutAdmin = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout error" });
        res.clearCookie("connect.sid", { path: "/" });
        res.redirect("/adminlogin.html");
    });
};

// Get Pending Appointments
const getPendingAppointments = async (req, res) => {
    try {
        const appointments = await getPendingAppointmentsFromDB();
        res.json(appointments);
    } catch (error) {
        console.error("❌ Error fetching pending appointments:", error);
        res.status(500).json({ message: "Failed to fetch pending appointments" });
    }
};

// Approve Appointment
const approveAppointment = async (req, res) => {
    const { appointmentId } = req.body;
    
    try {
        const success = await approveAppointmentInDB(appointmentId);
        res.json({ success, message: success ? "✅ Appointment Approved" : "❌ Failed to approve" });
    } catch (error) {
        console.error("❌ Error approving appointment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Reject Appointment
const rejectAppointment = async (req, res) => {
    const { appointmentId, rejectionMessage } = req.body;

    if (!rejectionMessage) {
        return res.status(400).json({ message: "❌ Rejection message is required" });
    }

    try {
        const success = await rejectAppointmentInDB(appointmentId, rejectionMessage);
        res.json({ success, message: success ? "✅ Appointment Rejected" : "❌ Failed to reject" });
    } catch (error) {
        console.error("❌ Error rejecting appointment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { loginAdmin, logoutAdmin, getPendingAppointments, approveAppointment, rejectAppointment };
