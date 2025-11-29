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

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Main activity content
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (created as DOM nodes to avoid injecting raw HTML)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsDiv.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
            details.participants.forEach((participant) => {
              const li = document.createElement("li");
              li.className = "participant-badge";

              // Participant email text
              const span = document.createElement("span");
              span.className = "participant-email";
              span.textContent = participant;
              li.appendChild(span);

              // Delete icon/button
              const del = document.createElement("button");
              del.className = "delete-icon";
              del.setAttribute("title", "Unregister participant");
              del.innerHTML = "&#10006;"; // heavy multiplication X

              // Click handler to unregister participant
              del.addEventListener("click", async (e) => {
                e.stopPropagation();
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                    { method: "POST" }
                  );
                  const resJson = await resp.json();
                  if (resp.ok) {
                    // refresh entire activities list so UI stays consistent
                    await fetchActivities();
                  } else {
                    console.error("Failed to unregister:", resJson);
                    alert(resJson.detail || "Failed to unregister participant");
                  }
                } catch (err) {
                  console.error("Error unregistering:", err);
                  alert("Error unregistering participant. See console for details.");
                }
              });

              li.appendChild(del);
              ul.appendChild(li);
            });
          participantsDiv.appendChild(ul);
        } else {
          const p = document.createElement("p");
          p.className = "no-participants";
          p.textContent = "No participants yet";
          participantsDiv.appendChild(p);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
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
