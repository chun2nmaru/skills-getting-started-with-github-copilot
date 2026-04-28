document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Limpiar y volver a cargar las opciones del select antes de renderizar tarjetas
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.keys(activities).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Renderizar tarjetas de actividades
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Crear lista de participantes
        let participantsList = "";
        if (details.participants && details.participants.length > 0) {
          participantsList = `<div class=\"participants-section\"><strong>Participantes:</strong><ul class=\"participants-list\">` +
            details.participants.map(p => `
              <li><span>${p}</span>
                <button class=\"remove-participant-btn\" data-activity=\"${encodeURIComponent(name)}\" data-participant=\"${encodeURIComponent(p)}\" title=\"Eliminar participante\">✖️</button>
              </li>
            `).join("") +
            `</ul></div>`;
        } else {
          participantsList = `<div class=\"participants-section\"><strong>Participantes:</strong> <span style=\"color:#888;\">Nadie inscrito aún</span></div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);
      });

      // Añadir eventos a los botones de eliminar participante
      document.querySelectorAll('.remove-participant-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const activity = decodeURIComponent(btn.getAttribute('data-activity'));
          const participant = decodeURIComponent(btn.getAttribute('data-participant'));
          if (!confirm(`¿Eliminar a ${participant} de "${activity}"?`)) return;
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/remove?email=${encodeURIComponent(participant)}`, {
              method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
              fetchActivities(); // Recargar actividades
            } else {
              alert(result.detail || 'No se pudo eliminar el participante.');
            }
          } catch (error) {
            alert('Error al eliminar participante.');
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Recargar actividades tras registro exitoso
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
