/* global zingchart */

export async function renderStatistics(content) {
    content.innerHTML = await fetch("statistics.html").then(r => r.text());

    const response = await fetch('/attendance/stats', { method: 'GET' });

    if (response.status === 403) {
        content.innerHTML = `
            <section class="stats-page">
                <div class="error access-denied">
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view attendance statistics.</p>
                </div>
            </section>
        `;
        return;
    }

    if (!response.ok) {
        content.innerHTML = `
            <section class="stats-page">
                <div class="error">
                    <h2>Error loading statistics</h2>
                    <p>${response.status} - ${response.statusText}</p>
                </div>
            </section>
        `;
        return;
    }

    const stats = await response.json();

    // Render charts
    zingchart.render({
        id: 'presenceRateChart',
        data: {
            type: 'line',
            title: { text: "Presence Over Time" },
            scaleX: {
                values: stats.daily.map(d => d.date)
            },
            series: [
                { values: stats.daily.map(d => Number(d.count)) }
            ]
        }
    });

    zingchart.render({
        id: 'meetingTypeChart',
        data: {
            type: 'pie',
            title: { text: "Attendance by Meeting Type" },
            series: stats.byType.map(t => ({
                text: t.meeting_type,
                values: [ Number(t.count) ]
            }))
        }
    });
}