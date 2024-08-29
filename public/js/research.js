const { bootstrap } = window;

const leagueKey = document
  .getElementById("leagueKey")
  .getAttribute("data-value");

const headers = document.querySelectorAll("th");

const SORT_ASC = "sort-asc";
const SORT_DESC = "sort-desc";

headers.forEach((el) => {
  el.addEventListener("click", async (e) => {
    console.log(e);
    const { target } = e;
    const { classList, dataset } = target;
    const { colVal } = dataset;
    let direction = "asc";

    if (classList.contains(SORT_ASC)) {
      classList.replace(SORT_ASC, SORT_DESC);
      direction = "desc";
    } else {
      classList.replace(SORT_DESC, SORT_ASC);
    }

    if (!classList.contains(SORT_ASC) && !classList.contains(SORT_DESC)) {
      headers.forEach((el) => {
        el.classList.remove(SORT_ASC);
        el.classList.remove(SORT_DESC);
      });

      classList.add(SORT_ASC);
    }

    updateTableBody(direction, colVal);
  });
});

async function updateTableBody(direction, colVal) {
  const query = new URLSearchParams({
    direction,
    colVal,
  });

  try {
    const response = await fetch(
      `/league/${leagueKey}/get-table-body?${query}`
    );

    if (!response.ok) {
      throw new Error(
        `Response.text: ${await response.text()}; Response.status: ${
          response.status
        }`
      );
    }
    const tbody = document.querySelector("tbody");
    const html = await response.text();
    tbody.innerHTML = html;
  } catch (e) {
    console.error(e.message);
  }
}

const toastContainer = document.querySelector(".toast-container");

async function getDraftUpdates() {
  let selections;
  try {
    const response = await fetch(`/league/${leagueKey}/get-draft-updates`);

    if (!response.ok) {
      throw new Error(
        `Response.text: ${await response.text()}; Response.status: ${
          response.status
        }`
      );
    }
    const responseJson = await response.json();

    const { currentPickNum, currentTeamName } = responseJson;

    selections = responseJson.selections;

    for (const draftPick of selections) {
      const { pick, firstName, lastName, position, teamAbbr, selectedBy } =
        draftPick;

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

  setTimeout(async () => {
    const numOfNewSelections = await getDraftUpdates();
    await refreshTableBody(numOfNewSelections);
  }, 20 * 1000);

  return selections.length;
}

setTimeout(async () => {
  const numOfNewSelections = await getDraftUpdates();
  await refreshTableBody(numOfNewSelections);
}, 10 * 1000);

async function refreshTableBody(numOfNewSelections) {
  if (numOfNewSelections) {
    let direction, colVal, columnHeader;

    columnHeader = document.querySelector(`.${SORT_ASC}`);

    if (columnHeader) {
      const { dataset } = columnHeader;
      colVal = dataset.colVal;
      direction = "asc";
    } else {
      columnHeader = document.querySelector(`.${SORT_DESC}`);
      if (columnHeader) {
        const { dataset } = columnHeader;
        colVal = dataset.colVal;
        direction = "desc";
      }
    }

    if (colVal && direction) {
      await updateTableBody(direction, colVal);
    }
  }
}

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
