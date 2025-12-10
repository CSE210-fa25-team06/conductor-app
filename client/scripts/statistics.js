export async function renderStatistics(content) {
    content.innerHTML = await fetch("statistics.html").then(r => r.text());

    const res = await fetch('/attendance/stats');
    const stats = await res.json();

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