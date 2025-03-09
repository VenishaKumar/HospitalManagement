const express = require("express");
const { 
    loginAdmin, 
    logoutAdmin, 
    approveAppointment, 
    rejectAppointment, 
    getPendingAppointments 
} = require("./admin_controller");

const router = express.Router();

// Admin Login
router.post("/login", loginAdmin);

// Admin Logout
router.get("/logout", logoutAdmin);

// Get Pending Appointments
router.get("/appointments/pending", getPendingAppointments);

// Approve Appointment
router.post("/appointments/approve", approveAppointment);

// Reject Appointment
router.post("/appointments/reject", rejectAppointment);

module.exports = router;
