(function () {
  function render(state) {
    const rows = [...state.holidays]
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
      .map((holiday) => `
        <tr>
          <td>${holiday.id}</td>
          <td>${holiday.holiday_date}</td>
          <td>${holiday.holiday_name}</td>
          <td>${holiday.country}</td>
          <td>${holiday.state || ""}</td>
          <td>${holiday.affects_schedule ? "yes" : "no"}</td>
        </tr>
      `).join("");

    return `
      <section class="view-header">
        <div>
          <h2>Holidays</h2>
          <p>Events on active holidays get is_holiday = true during generation.</p>
        </div>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Name</th><th>Country</th><th>State</th><th>Affects schedule</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  window.HolidaysView = { render };
})();

