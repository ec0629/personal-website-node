const leagueKey = document
  .getElementById("leagueKey")
  .getAttribute("data-value");

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
    const newDraftPicks = await response.json();
    console.log(newDraftPicks);

    for (const draftPick of newDraftPicks) {
      const { pick, firstName, lastName, position, teamAbbr } = draftPick;
      const card = document.getElementById(`pick-${pick}`);
      card.classList.add(position);
      card.querySelector(".firstName").textContent = firstName;
      card.querySelector(".lastName").textContent = lastName;
      card.querySelector(".position").textContent = position;
      card.querySelector(".teamAbbr").textContent = teamAbbr;
    }
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
