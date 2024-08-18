const headers = document.querySelectorAll("th");

headers.forEach((el) => {
  el.addEventListener("click", async (e) => {
    console.log(e);
    const { target } = e;
    const { classList, dataset } = target;
    const { colVal } = dataset;
    let direction = "asc";

    if (classList.contains("sort")) {
      classList.replace("sort", "sort-desc");
      direction = "desc";
    } else {
      classList.replace("sort-desc", "sort");
    }

    if (!classList.contains("sort") && !classList.contains("sort-desc")) {
      headers.forEach((el) => {
        el.classList.remove("sort");
        el.classList.remove("sort-desc");
      });

      classList.add("sort");
    }

    const query = new URLSearchParams({
      direction,
      colVal,
    });

    try {
      const response = await fetch(`/get_table_body?${query}`);

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
