console.log("Booking JS loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded ✅");

  const form = document.getElementById("bookingForm");
  const notification = document.getElementById("notification");
  const destinationSelect = document.getElementById("destination");
  const cabSelect = document.getElementById("cab");
  const priceDisplay = document.getElementById("priceDisplay");
  const dateInput = document.getElementById("bookingDate");

  // Element checks
  if (!form) return console.error("❌ Booking form not found!");
  if (!destinationSelect) console.error("❌ Destination select missing!");
  if (!cabSelect) console.error("❌ Cab select missing!");
  if (!dateInput) console.error("❌ Booking date input missing!");

  // Restrict past dates
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  // ===============================
  // DESTINATION & CAB DATA
  // ===============================
  const destinations = {
    "Tsomo Lake": {
      desc: "A serene high-altitude lake surrounded by snow-clad mountains.",
      cabs: { WagonR: 8000, Innova: 12000 },
    },
    "Namchi": {
      desc: "Home to the famous Char Dham and lush tea gardens.",
      cabs: { WagonR: 5000, Innova: 8000 },
    },
    "Guru Dongmar Lake": {
      desc: "A sacred and breathtaking lake at one of the world’s highest altitudes.",
      cabs: { WagonR: 20000, Innova: 28000 },
    },
    "Nathu La": {
      desc: "A mountain pass on the Indo-China border offering stunning views.",
      cabs: { WagonR: 9000, Innova: 15000 },
    },
    "Gangtok": {
      desc: "The vibrant capital city of Sikkim, known for monasteries and mountain views.",
      cabs: { WagonR: 8000, Innova: 10000 },
    },
    "Pelling": {
      desc: "Picturesque hill town with monasteries, waterfalls, and the Sky Walk.",
      cabs: { WagonR: 6000, Innova: 9000 },
    },
  };

  // ===============================
  // UPDATE CAB OPTIONS
  // ===============================
  destinationSelect.addEventListener("change", () => {
    const selected = destinations[destinationSelect.value];
    cabSelect.innerHTML = '<option value="">-- Select Cab --</option>';

    if (selected) {
      Object.entries(selected.cabs).forEach(([cab, price]) => {
        const option = document.createElement("option");
        option.value = cab;
        option.textContent = `${cab} - ₹${price.toLocaleString("en-IN")}`;
        cabSelect.appendChild(option);
      });
      priceDisplay.innerHTML = `<strong>${selected.desc}</strong><br><span class="text-muted">Select a cab to view price.</span>`;
    } else {
      priceDisplay.textContent = "Please select a destination & cab";
    }
  });

  // ===============================
  // SHOW PRICE WHEN CAB SELECTED
  // ===============================
  cabSelect.addEventListener("change", () => {
    const dest = destinations[destinationSelect.value];
    const cab = cabSelect.value;
    if (dest && cab) {
      priceDisplay.innerHTML = `
        <div><strong>${dest.desc}</strong></div>
        <div style="margin-top:6px;">💰 <b>Price:</b> ₹${dest.cabs[cab].toLocaleString("en-IN")}</div>
      `;
    }
  });

  // ===============================
  // FORM SUBMISSION HANDLER
  // ===============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      destination: destinationSelect.value.trim(),
      cab: cabSelect.value.trim(),
      travellers: form.travellers.value.trim(),
      bookingDate: dateInput.value.trim(),
      message: form.message.value.trim(),
    };

    // Validation
    if (Object.values(formData).some((v) => !v)) {
      return showNotification("⚠️ Please fill in all required fields, including booking date.", "red");
    }

    if (new Date(formData.bookingDate) < new Date(today)) {
      return showNotification("⚠️ Please select a valid booking date (today or later).", "red");
    }

    // Disable button and show spinner
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...`;

    try {
      const response = await fetch("/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({
        success: false,
        error: "Invalid JSON response from server",
      }));

      if (response.ok && data.success) {
        const formattedDate = new Date(formData.bookingDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        showNotification(
          `✅ Booking confirmed for <b>${formData.destination}</b> with <b>${formData.cab}</b> on <b>${formattedDate}</b>!<br>We’ll contact you soon.`,
          "green"
        );

        form.reset();
        priceDisplay.textContent = "Please select a destination & cab";
        cabSelect.innerHTML = '<option value="">-- Select Cab --</option>';
        dateInput.min = today;
      } else {
        showNotification(data.error || "❌ Failed to send booking. Try again later.", "red");
      }
    } catch (error) {
      console.error("Booking submission error:", error);
      showNotification("⚠️ Server error. Please try again later.", "red");
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  });

  // ===============================
  // NOTIFICATION HELPER
  // ===============================
  function showNotification(message, color) {
    notification.style.display = "block";
    notification.style.backgroundColor = color === "green" ? "#d4edda" : "#f8d7da";
    notification.style.color = color === "green" ? "#155724" : "#721c24";
    notification.style.border = `1px solid ${color === "green" ? "#c3e6cb" : "#f5c6cb"}`;
    notification.style.marginTop = "15px";
    notification.style.padding = "12px";
    notification.style.borderRadius = "8px";
    notification.style.fontWeight = "500";
    notification.innerHTML = message;

    // Optional fade-out after 7 seconds
    setTimeout(() => {
      notification.style.transition = "opacity 0.5s ease";
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.style.display = "none";
        notification.style.opacity = "1";
      }, 500);
    }, 7000);
  }
});
