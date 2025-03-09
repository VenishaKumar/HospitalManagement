const bcrypt = require("bcrypt");
const { savePatient, findPatientByphone } = require("./model");
const { saveAppointment, findAppointmentsByUser,getPrescriptionsByPhone,updatePatient } = require("./model");
const path = require("path");
// Handle patient registration
const registerPatient = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    // Check if the patient already exists
    const existingPatient = await findPatientByphone(phone);
    if (existingPatient) {
      return res.status(400).json({ message: "Number already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the patient to the database
    const newPatient = {
      name,
      phone,
      password: hashedPassword,
    };
    await savePatient(newPatient);

    res.redirect("/login.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginPatient = async (req, res) => {
  const { phone, password } = req.body;

  try {
    // Check if the patient exists
    const patient = await findPatientByphone(phone);
    if (!patient) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    req.session.user={
      id:patient._id,
      name:patient.name,
      phone:patient.phone,
    };

    // Redirect to the home page on successful login
    res.redirect("/home.html");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const logoutPatient=(req,res)=>{
  req.session.destroy((err)=>{
    if (err){
    return res.ststus(500).json({message:"Error logging out"});
  }
  res.clearCookie("connect.sid", { path: "/" });
  res.redirect("/login.html")
}
  
)
};



// Handle appointment booking
const bookAppointment = async (req, res) => {
    const { doctor, date, time, reason } = req.body;
    
    if (!req.session.user) {
        return res.status(401).json({ message: "User not logged in" });
    }

    try {
        const newAppointment = {
            userId: req.session.user.id, 
            name: req.session.user.name,
            phone: req.session.user.phone,
            doctor,
            date,
            time,
            reason,
            status: "Pending" // Default status is 'Pending'
        };

        await saveAppointment(newAppointment);

        
        console.log("Admin notification: New appointment request by", req.session.user.name);

        res.status(201).json({ message: "Appointment booked successfully, awaiting admin approval!" });
    } catch (error) {
        res.status(500).json({ message: "Error booking appointment", error });
    }
};

//Get all appointments for logged-in user
const getAppointments = async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ message: "User not logged in" });
  }

  try {
      const appointments = await findAppointmentsByUser(req.session.user.id);
      res.json({ appointments });
  } catch (error) {
      res.status(500).json({ message: "Error retrieving appointments", error });
  }
};





// Get prescriptions for logged-in patient
const getPrescriptions = async (req, res) => {
  if (!req.session.user) {
      return res.status(401).send("<h3>Error: User not logged in</h3>");
  }

  const phoneNumber = req.session.user.phone; // Retrieve phone from session

  try {
      const prescriptions = await getPrescriptionsByPhone(phoneNumber);

      if (!prescriptions.length) {
          return res.send("<h3>No prescriptions found.</h3>");
      }

      let prescriptionHTML = "<h2>My Prescriptions</h2>";
      
      prescriptions.forEach(prescription => {
          let medicinesList = prescription.medicines.map(med => 
              `<li>${med.name} - ${med.dosage} (${med.instructions || "No instructions"})</li>`
          ).join("");

          prescriptionHTML += `
              <div class="prescription-card">
                  <h3>Doctor: ${prescription.doctor.name}</h3>
                  <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
                  <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
                  <h4>Medicines:</h4>
                  <ul>${medicinesList}</ul>
                  <p><strong>Additional Notes:</strong> ${prescription.additionalInstructions || "None"}</p>
              </div>
          `;
      });

      res.send(prescriptionHTML);

  } catch (error) {
      console.error("❌ Error retrieving prescriptions:", error);
      res.send("<h3>Error retrieving prescriptions</h3>");
  }
};




const getPatientProfile = async (req, res) => {
  if (!req.session.user || !req.session.user.phone) {
      return res.status(401).send("<h3>Error: User not logged in</h3>");
  }

  const phoneNumber = req.session.user.phone; // Retrieve phone from session

  try {
      const patient = await findPatientByphone(phoneNumber);

      if (!patient) {
          return res.status(404).send("<h3>Patient not found</h3>");
      }

      // Generate the HTML for displaying patient details
      let patientHTML = `
          <h2>Patient Profile</h2>
          <p><strong>Name:</strong> ${patient.name || "Not provided"}</p>
          <p><strong>Phone:</strong> ${patient.phone || "Not provided"}</p>
          <p><strong>Email:</strong> ${patient.email || "Not provided"}</p>
          <p><strong>DOB:</strong> ${patient.dob || "Not provided"}</p>
          <p><strong>Gender:</strong> ${patient.gender || "Not specified"}</p>
          <p><strong>Blood Group:</strong> ${patient.bloodGroup || "Not provided"}</p>
          <p><strong>Address:</strong> ${patient.address || "Not provided"}</p>
          <p><strong>Allergies:</strong> ${patient.allergies || "Not provided"}</p>
          <p><strong>Chronic Illnesses:</strong> ${patient.chronicIllnesses || "Not provided"}</p>
          <p><strong>Current Medications:</strong> ${patient.currentMedications || "Not provided"}</p>
          <p><strong>Past Surgeries:</strong> ${patient.pastSurgeries || "Not provided"}</p>
      `;

      res.send(patientHTML); // Send the generated HTML

  } catch (error) {
      console.error("❌ Error retrieving patient profile:", error);
      res.send("<h3>Error retrieving patient profile</h3>");
  }
};








const updatePatientProfile = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const {
    name, email, dob, age, gender, bloodGroup, address,
    chronicIllnesses, pastSurgeries, allergies, currentMedications,
    emergencyContact, insurance
  } = req.body;

  try {
    await updatePatient(req.session.user.phone, {
      name, email, dob, age, gender, bloodGroup, address,
      chronicIllnesses, pastSurgeries, allergies, currentMedications,
      emergencyContact, insurance
    });

    req.session.user.name = name; // Update session info
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};












module.exports = { registerPatient, loginPatient ,logoutPatient,bookAppointment, getAppointments,getPrescriptions,getPatientProfile,updatePatientProfile};



