const { bootstrap } = window;

const leagueKey = document
  .getElementById("leagueKey")
  .getAttribute("data-value");

const toastContainer = document.querySelector(".toast-container");

async function getDraftUpdates() {
  try {
    const response = await fetch(`/league/${leagueKey}/get-draft-updates`);

    if (!response.ok) {
      throw new Error(
        `Response.text: ${await response.text()}; Response.status: ${
          response.status
        }`
      );
    }
    const { selections, currentPickNum, currentTeamName } =
      await response.json();

    for (const draftPick of selections) {
      const { pick, firstName, lastName, position, teamAbbr, selectedBy } =
        draftPick;
      const card = document.getElementById(`pick-${pick}`);
      card.classList.add(position);
      card.querySelector(".firstName").textContent = firstName;
      card.querySelector(".lastName").textContent = lastName;
      card.querySelector(".position").textContent = position;
      card.querySelector(".teamAbbr").textContent = teamAbbr;

      toastContainer.insertAdjacentHTML(
        "beforeend",
        createToast(pick, selectedBy, firstName, lastName, position, teamAbbr)
      );
    }

    document.getElementById("currentPickNum").textContent = currentPickNum;
    document.getElementById("currentTeamName").textContent = currentTeamName;

    const toastElList = document.querySelectorAll(".toast");
    const toastList = [...toastElList].map((toastEl) => {
      toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
      });
      return new bootstrap.Toast(toastEl, { autohide: false });
    });
    toastList.forEach((t) => t.show());
  } catch (e) {
    console.error(e.message);
  }
  setTimeout(() => {
    getDraftUpdates();
  }, 20 * 1000);
}

setTimeout(() => {
  getDraftUpdates();
}, 10 * 1000);

function createToast(
  pick,
  selectedBy,
  firstName,
  lastName,
  position,
  teamAbbr
) {
  return `
  <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toast-header">
      <strong class="me-auto">Pick ${pick}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      <div>
        <strong>${selectedBy}</strong> selected ${firstName} ${lastName}
      </div>
      <div>
        <small>${position} - ${teamAbbr}</small>
      </div>
    </div>
  </div>`;
}
