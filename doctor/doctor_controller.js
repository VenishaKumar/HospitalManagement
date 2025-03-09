const bcrypt = require("bcrypt");
const {
  findDoctorByEmail,
  searchPatients,
  getAppointmentsByPhone,
  getAppointmentsByDoctor,
  getPrescriptionsByPhone,
  savePrescription,
} = require("./dmodels");

// Doctor login
const loginDoctor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const doctor = await findDoctorByEmail(email);
    if (!doctor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    req.session.doctor = {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialty: doctor.specialty,
    };

    res.redirect("/dhome.html");
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Doctor logout
const logoutDoctor = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/dlogin.html");
  });
};

const getDoctorAppointments = async (req, res) => {
  if (!req.session.doctor || !req.session.doctor.name) {
    return res.status(401).send("<h3>Error: Doctor not logged in</h3>");
  }

  try {
    const doctorName = req.session.doctor.name;
    const appointments = await getAppointmentsByDoctor(doctorName);

    if (!appointments.length) {
      return res.send("<h3>No appointments found.</h3>");
    }

    // Generate the HTML for displaying appointments
    let appointmentsHTML = "<h2>My Appointments</h2>";

    appointments.forEach(app => {
      appointmentsHTML += `
        <div class="appointment-card">
          <p><strong>Patient:</strong> ${app.name}</p>
          <p><strong>Phone:</strong> ${app.phone}</p>
          <p><strong>Date:</strong> ${app.date}</p>
          <p><strong>Time:</strong> ${app.time}</p>
          <p><strong>Reason:</strong> ${app.reason}</p>
          <p><strong>Status:</strong> ${app.status}</p>
        </div>
      `;
    });

    res.send(appointmentsHTML); // ✅ Send the generated HTML

  } catch (error) {
    console.error("❌ Error retrieving doctor appointments:", error);
    res.send("<h3>Error retrieving appointments</h3>");
  }
};


// Search for patients and fetch related information
const searchForPatients = async (req, res) => {
  if (!req.session.doctor) {
    return res.status(401).send("<h3>Error: Doctor not logged in</h3>");
  }

  const { query } = req.query; // Get the search term (name or phone)

  try {
    // Search for the patient
    const patient = await searchPatients(query);
    if (!patient) {
      return res.send("<h3>No patient found.</h3>");
    }

    // Get patient's appointments
    const appointments = await getAppointmentsByPhone(patient.phone);

    // Get patient's prescriptions
    const prescriptions = await getPrescriptionsByPhone(patient.phone);

    // Generate HTML response
    let responseHTML = `<h2>Patient Profile</h2>
        <p><strong>Name:</strong> ${patient.name || "Not provided"}</p>
        <p><strong>Phone:</strong> ${patient.phone || "Not provided"}</p>
        <p><strong>Email:</strong> ${patient.email || "Not provided"}</p>
        <p><strong>DOB:</strong> ${patient.dob || "Not provided"}</p>
        <p><strong>Gender:</strong> ${patient.gender || "Not specified"}</p>
        <p><strong>Blood Group:</strong> ${patient.bloodGroup || "Not provided"}</p>
        <p><strong>Address:</strong> ${patient.address || "Not provided"}</p>`;

    // Append Appointments
    responseHTML += "<h2>Appointments</h2>";
    if (appointments.length > 0) {
      appointments.forEach(app => {
        responseHTML += `
            <div class="appointment-card">
              <p><strong>Date:</strong> ${app.date}</p>
              <p><strong>Time:</strong> ${app.time}</p>
              <p><strong>Reason:</strong> ${app.reason}</p>
              <p><strong>Status:</strong> ${app.status}</p>
            </div>`;
      });
    } else {
      responseHTML += "<p>No appointments found.</p>";
    }

    // Append Prescriptions
    responseHTML += "<h2>Prescriptions</h2>";
    if (prescriptions.length > 0) {
      prescriptions.forEach(prescription => {
        responseHTML += `
            <div class="prescription-card">
              <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
              <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
              <h4>Medicines:</h4>
              <ul>`;
        prescription.medicines.forEach(med => {
          responseHTML += `<li>${med.name} - ${med.dosage} (${med.instructions || "No instructions"})</li>`;
        });
        responseHTML += `</ul></div>`;
      });
    } else {
      responseHTML += "<p>No prescriptions found.</p>";
    }

    res.send(responseHTML);

  } catch (error) {
    console.error("❌ Error retrieving patient info:", error);
    res.send("<h3>Error retrieving patient data</h3>");
  }
};


// Save a prescription
const addPrescription = async (req, res) => {
    try {
        const { 
            patientName, patientAge, patientGender, patientContact, 
            doctorName, doctorSpecialization, doctorContact, 
            diagnosis, medName, medDosage, medInstructions, 
            additionalInstructions 
        } = req.body;

        // Process medicines array
        let medicines = [];
        if (Array.isArray(medName)) {
            for (let i = 0; i < medName.length; i++) {
                medicines.push({
                    name: medName[i],
                    dosage: medDosage[i],
                    instructions: medInstructions[i] || "",
                });
            }
        } else if (medName) {
            medicines.push({
                name: medName,
                dosage: medDosage,
                instructions: medInstructions || "",
            });
        }

        // Create prescription object
        const prescription = {
            patient: {
                name: patientName,
                age: patientAge,
                gender: patientGender,
                contact: patientContact
            },
            doctor: {
                name: doctorName,
                specialization: doctorSpecialization,
                contact: doctorContact
            },
            diagnosis,
            medicines,
            additionalInstructions,
            date: new Date().toISOString()
        };

        // Save to database
        await savePrescription(prescription);
        res.send("Prescription saved successfully!");
    } catch (error) {
        console.error("❌ Error saving prescription:", error);
        res.status(500).send("Error saving prescription.");
    }
};

// Retrieve prescriptions by patient ID
const viewPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.query;
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        const prescriptions = await getPrescriptionsByPatient(patientId);
        res.json({ prescriptions });
    } catch (error) {
        console.error("❌ Error retrieving prescriptions:", error);
        res.status(500).json({ message: "Error retrieving prescriptions" });
    }
};




module.exports = {
  loginDoctor,
  logoutDoctor,
  searchForPatients,addPrescription, viewPrescriptions, getDoctorAppointments
};
