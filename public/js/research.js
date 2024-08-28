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
  });
});
