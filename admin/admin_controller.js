const bcrypt = require("bcrypt");
const { 
    findAdminByEmail, 
    approveAppointmentInDB, 
    rejectAppointmentInDB, 
    getPendingAppointmentsFromDB ,getAllPatients, updatePatient, deletePatient, getAllDoctors, addDoctor, deleteDoctor,getAppointmentsForDoctorAndDate 
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
        
        res.json({ success: true, redirectUrl: "/admin_home.html" });
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
        if (!appointments.length) {
            return res.send("<h3>No pending appointments.</h3>");
        }

        // Generate HTML response
        let appointmentsHTML = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Phone</th>
                        <th>Reason</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        appointments.forEach(app => {
            appointmentsHTML += `
                <tr>
                    <td>${app.name || "N/A"}</td>
                    <td>${app.doctor || "N/A"}</td>
                    <td>${app.date || "N/A"}</td>
                    <td>${app.time || "N/A"}</td>
                    <td>${app.phone || "N/A"}</td>
                    <td>${app.reason || "N/A"}</td>
                    <td>
                        <form action="/admin/appointments/approve" method="post" style="display:inline;">
                            <input type="hidden" name="appointmentId" value="${app._id}">
                            <button type="submit" class="btn approve-btn">Approve</button>
                        </form>
                        <form action="/admin/appointments/reject" method="post" style="display:inline;">
                            <input type="hidden" name="appointmentId" value="${app._id}">
                            <input type="text" name="rejectionMessage" placeholder="Reason" required>
                            <button type="submit" class="btn reject-btn">Reject</button>
                        </form>
                    </td>
                </tr>
            `;
        });

        appointmentsHTML += "</tbody></table>";
        res.send(appointmentsHTML);

    } catch (error) {
        console.error("❌ Error fetching pending appointments:", error);
        res.send("<h3>Error retrieving appointments.</h3>");
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

const fetchAllPatients = async (req, res) => {
    try {
        const patients = await getAllPatients();
        if (!patients.length) {
            return res.send("<h3>No patients found.</h3>");
        }

        // Generate the HTML for displaying patients
        let patientsHTML = "<h2>Manage Patients</h2>";

        patients.forEach(patient => {
            patientsHTML += `
                <div class="patient-card">
                    <p><strong>Name:</strong> ${patient.name}</p>
                    <p><strong>Phone:</strong> ${patient.phone}</p>
                    <p><strong>Email:</strong> ${patient.email}</p>
                    
                    <!-- Update Form -->
                    <form action="/patients/update" method="post" style="display:inline;">
                        <input type="hidden" name="patientId" value="${patient._id}">
                        <input type="text" name="name" value="${patient.name}" required>
                        <input type="text" name="phone" value="${patient.phone}" required>
                        <input type="email" name="email" value="${patient.email}" required>
                        <button type="submit" class="btn edit-btn">Update</button>
                    </form>

                    <!-- Delete Form -->
                    <form action="admin/patients/delete" method="post" style="display:inline;">
                        <input type="hidden" name="patientId" value="${patient._id}">
                        <button type="submit" class="btn delete-btn">Delete</button>
                    </form>
                </div>
            `;
        });

        res.send(patientsHTML); // ✅ Send the generated HTML

    } catch (error) {
        console.error("❌ Error fetching patients:", error);
        res.send("<h3>Error retrieving patient records.</h3>");
    }
};




// Delete patient and reload the page
const removePatient = async (req, res) => {
    const { patientId } = req.body;
    try {
        await deletePatient(patientId);
        res.redirect("manage_patients.html"); // Reload patient list
    } catch (error) {
        res.send("<h3>Error deleting patient</h3>");
    }
};

// Update patient details
const modifyPatient = async (req, res) => {
    const { patientId, updatedData } = req.body;
    try {
        await updatePatient(patientId, updatedData);
        res.json({ message: "Patient updated successfully." });
    } catch (error) {
        console.error("Error updating patient:", error);
        res.status(500).json({ message: "Error updating patient." });
    }
};

// Delete a patient


const fetchAllDoctors = async (req, res) => {
    try {
        const doctors = await getAllDoctors();
        if (!doctors.length) {
            return res.send("<h3>No doctors found.</h3>");
        }

        let doctorsHTML = "<h2>Manage Doctors</h2>";

        doctors.forEach(doctor => {
            doctorsHTML += `
                <div class="doctor-card">
                    <p><strong>Name:</strong> ${doctor.name}</p>
                    <p><strong>Email:</strong> ${doctor.email}</p>
                    <p><strong>Phone:</strong> ${doctor.phone || "Not Provided"}</p>
                    <p><strong>Specialization:</strong> ${doctor.specialization || "Not Provided"}</p>
                    <p><strong>Clinic Address:</strong> ${doctor.clinicAddress || "Not Provided"}</p>

                    <!-- Delete Form -->
                    <form action="admin/doctors/delete" method="post" style="display:inline;">
                        <input type="hidden" name="doctorId" value="${doctor._id}">
                        <button type="submit" class="btn delete-btn">Delete</button>
                    </form>
                </div>
            `;
        });

        res.send(doctorsHTML); // ✅ Send the generated HTML

    } catch (error) {
        console.error("❌ Error fetching doctors:", error);
        res.send("<h3>Error retrieving doctor records.</h3>");
    }
};


// Delete doctor and reload the page
const removeDoctor = async (req, res) => {
    console.log(req.body)
    const { doctorId } = req.body;
  
    try {
        await deleteDoctor(doctorId);
        res.redirect("/manage_doctors.html"); // Reload doctor list
    } catch (error) {
        res.send("<h3>Error deleting doctor</h3>");
    }
};

// Add a new doctor
const createDoctor = async (req, res) => {
    const { name, email, password, phone, specialization, clinicAddress } = req.body;

    if (!name || !email || !password || !phone || !specialization || !clinicAddress) {
        return res.send("<h3>All fields are required.</h3>");
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    const doctorData = {
        name,
        email,
        password: hashedPassword,
        phone,
        specialization,
        clinicAddress,
        createdAt: new Date()
    };

    try {
        await addDoctor(doctorData);
        res.redirect("/manage_doctors.html"); // Refresh doctor list
    } catch (error) {
        console.error("❌ Error adding doctor:", error);
        res.send("<h3>Error adding doctor.</h3>");
    }
};




const searchAppointmentsByDoctorAndDate = async (req, res) => {
    const { doctor, date } = req.query;

    if (!doctor || !date) {
        return res.send("<h3>Error: Please provide both doctor name and date.</h3>");
    }

    try {
        const appointments = await getAppointmentsForDoctorAndDate(doctor, date);
        
        if (!appointments.length) {
            return res.send("<h3>No appointments found for this doctor on this date.</h3>");
        }

        // Generate HTML response
        let appointmentsHTML = `
            <h2>Appointments for ${doctor} on ${date}</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Phone</th>
                        <th>Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        appointments.forEach(app => {
            appointmentsHTML += `
                <tr>
                    <td>${app.name || "N/A"}</td>
                    <td>${app.phone || "N/A"}</td>
                    <td>${app.time || "N/A"}</td>
                    <td>${app.reason || "N/A"}</td>
                    <td>${app.status || "Pending"}</td>
                </tr>
            `;
        });

        appointmentsHTML += "</tbody></table>";
        res.send(appointmentsHTML);

    } catch (error) {
        console.error("❌ Error searching appointments:", error);
        res.send("<h3>Error retrieving appointments.</h3>");
    }
};





module.exports = { loginAdmin, logoutAdmin, getPendingAppointments, approveAppointment, rejectAppointment,fetchAllPatients, modifyPatient, removePatient, fetchAllDoctors, createDoctor, removeDoctor,searchAppointmentsByDoctorAndDate};
