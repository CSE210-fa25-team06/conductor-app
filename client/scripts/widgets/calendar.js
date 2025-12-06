/* Calendar Logic */

export function initCalendarSection() {
  const calendarEl = document.getElementById("calendar");
  const addEventBtn = document.getElementById("addEventBtn");

  const eventModal = document.getElementById("eventModal");
  const eventForm = document.getElementById("eventForm");
  const cancelEventBtn = document.getElementById("cancelEventBtn");

  const eventDetailsPanel = document.getElementById("eventDetailsPanel");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
  const editEventBtn = document.getElementById("editEventBtn");
  const markAttendanceBtn = document.getElementById("markAttendanceBtn");

  let selectedEventId = null;
  const cachedCourseId = getCachedCourseId();
  let courseId = cachedCourseId ?? 1;
  let editingEventId = null;
  let currentEventDetails = null;

  function openModal(modal) {
    modal.classList.remove("hidden");
  }
  function closeModal(modal) {
    modal.classList.add("hidden");
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    events: async function(info, success, fail) {
      try {
        const res = await fetch(`/api/events?courseId=${courseId}`);
        const data = await res.json();
        success(data);
      } catch (err) {
        console.error(err);
        fail(err);
      }
    },
    dateClick(info) {
      eventForm.reset();
      eventForm.start.value = info.dateStr + "T09:00";
      eventForm.end.value = info.dateStr + "T10:00";
      openModal(eventModal);
    },
    eventClick(info) {
      selectedEventId = info.event.id;
      loadEventDetails(selectedEventId);
    }
  });

  calendar.render();
  if (cachedCourseId == null) {
    hydrateCourseId();
  } else {
    persistCourseId(cachedCourseId);
  }

  addEventBtn.addEventListener("click", () => {
    eventForm.reset();
    editingEventId = null;
    openModal(eventModal);
  });
  cancelEventBtn.addEventListener("click", () => {
    eventForm.reset();
    editingEventId = null;
    closeModal(eventModal);
  });

  eventForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(eventForm);

    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      location: fd.get("location"),
      start: fd.get("start"),
      end: fd.get("end"),
      visibility: fd.get("visibility"),
      attendeeIds: fd.get("attendees")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number),
      courseId
    };

    const targetUrl = editingEventId ? `/api/events/${editingEventId}` : "/api/events";
    const method = editingEventId ? "PUT" : "POST";

    const response = await fetch(targetUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Failed to create event", await response.text());
      alert("Unable to save event. Please try again.");
      return;
    }

    const created = await response.json();

    if (editingEventId) {
      calendar.refetchEvents();
      await loadEventDetails(editingEventId);
      editingEventId = null;
    } else {
      calendar.addEvent({
        id: created.id,
        title: created.title,
        start: created.start_time,
        end: created.end_time,
        display: "auto"
      });
      calendar.refetchEvents();
    }

    eventForm.reset();
    closeModal(eventModal);
  });

  async function loadEventDetails(eventId) {
    const res = await fetch(`/api/events/${eventId}`);
    const data = await res.json();
    currentEventDetails = data;

    document.getElementById("eventDetailsTitle").textContent = data.event.title;
    document.getElementById("eventDetailsTime").textContent =
      `${new Date(data.event.start_time).toLocaleString()} - ` +
      `${new Date(data.event.end_time).toLocaleString()}`;
    document.getElementById("eventDetailsLocation").textContent =
      data.event.location || "";
    document.getElementById("eventDetailsDescription").textContent =
      data.event.description || "";
    document.getElementById("eventDetailsAttendees").textContent =
      data.attendees.length === 0
        ? "None"
        : data.attendees
            .map(a => `${a.name || a.email} (${formatStatus(a.status)})`)
            .join(", ");

    const myStatus = data.myAttendance
      ? formatStatus(data.myAttendance.status)
      : null;
    document.getElementById("eventDetailsMyStatus").textContent = myStatus
      ? `Your Attendance: ${myStatus}`
      : "You have not marked attendance yet.";

    const startDate = new Date(data.event.start_time);
    const endDate = new Date(data.event.end_time);
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const hasEnded = endDate < now;
    const alreadyMarked =
      data.myAttendance &&
      data.myAttendance.status &&
      data.myAttendance.status.toLowerCase() !== "invited";

    const shouldDisable = !isToday || hasEnded;
    markAttendanceBtn.disabled = shouldDisable;
    markAttendanceBtn.dataset.reason = shouldDisable
      ? hasEnded
        ? "The attendance window for this event has closed."
        : "Attendance can only be marked on the day of the event."
      : "";
    markAttendanceBtn.dataset.marked = alreadyMarked ? "true" : "false";

    markAttendanceBtn.textContent = alreadyMarked
      ? "Attendance Recorded"
      : "Mark Attendance";

    editEventBtn.classList.toggle("hidden", !data.canEdit);

    eventDetailsPanel.classList.remove("hidden");
  }

  closeDetailsBtn.addEventListener("click", () =>
    eventDetailsPanel.classList.add("hidden")
  );

  editEventBtn.addEventListener("click", () => {
    if (!currentEventDetails) return;
    const { event, attendees } = currentEventDetails;
    editingEventId = event.id;
    eventForm.title.value = event.title || "";
    eventForm.description.value = event.description || "";
    eventForm.location.value = event.location || "";
    eventForm.start.value = toLocalInputValue(event.start_time);
    eventForm.end.value = toLocalInputValue(event.end_time);
    eventForm.visibility.value = event.visibility || "class";
    eventForm.attendees.value = attendees
      .map(a => a.user_id)
      .filter(Boolean)
      .join(", ");
    openModal(eventModal);
  });

  markAttendanceBtn.addEventListener("click", async () => {
    if (!selectedEventId) return;
    const alreadyMarked = markAttendanceBtn.dataset.marked === "true";
    if (markAttendanceBtn.disabled) {
      if (markAttendanceBtn.dataset.reason) {
        alert(markAttendanceBtn.dataset.reason);
      }
      return;
    }
    if (alreadyMarked) {
      alert("You have already marked your attendance for this event.");
      return;
    }
    await fetch(`/api/events/${selectedEventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "present" })
    });
    loadEventDetails(selectedEventId);
  });

  function getCachedCourseId() {
    const fromWindow =
      window.__CONDUCTOR_SESSION__?.user?.courseId ??
      window.__CONDUCTOR_SESSION__?.user?.course_id ??
      window.currentUser?.courseId ??
      window.currentUser?.course_id ??
      window.currentUser?.group_id ??
      window.currentUser?.groupId;
    if (Number.isFinite(Number(fromWindow))) {
      return Number(fromWindow);
    }

    const fromDataset = document.body?.dataset?.courseId;
    if (Number.isFinite(Number(fromDataset))) {
      return Number(fromDataset);
    }

    const stored =
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("courseId")) ||
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("courseId"));
    if (Number.isFinite(Number(stored))) {
      return Number(stored);
    }

    return null;
  }

  function persistCourseId(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("courseId", String(numericId));
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("courseId", String(numericId));
    }
    if (document.body) {
      document.body.dataset.courseId = String(numericId);
    }
  }

  async function hydrateCourseId() {
    const resolved = await fetchCourseIdFromSession();
    if (!resolved || resolved === courseId) return;
    courseId = resolved;
    persistCourseId(resolved);
    calendar.refetchEvents();
  }

  async function fetchCourseIdFromSession() {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      const resolved =
        data?.user?.courseId ??
        data?.user?.course_id ??
        data?.user?.group_id ??
        data?.user?.groupId ??
        null;
      const numericId = Number(resolved);
      return Number.isFinite(numericId) ? numericId : null;
    } catch (err) {
      console.error("Failed to resolve course ID from session", err);
      return null;
    }
  }

  function formatStatus(status) {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function toLocalInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
}
