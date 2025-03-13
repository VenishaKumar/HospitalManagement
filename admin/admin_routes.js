const express = require("express");
const { 
    loginAdmin, 
    logoutAdmin, 
    approveAppointment, 
    rejectAppointment, 
    getPendingAppointments ,fetchAllDoctors, createDoctor, removeDoctor,fetchAllPatients, modifyPatient, removePatient,searchAppointmentsByDoctorAndDate
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

router.get("/patients", fetchAllPatients);
router.put("/patients/update", modifyPatient);
router.post("/patients/delete", removePatient);

// Doctor Management
router.get("/doctors", fetchAllDoctors);
router.post("/doctors/add", createDoctor);
router.post("/doctors/delete", removeDoctor);

router.get("/appointments/search", searchAppointmentsByDoctorAndDate);
module.exports = router;
