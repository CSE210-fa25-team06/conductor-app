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
  const attendeeSearchInput = document.getElementById("attendeeSearch");
  const attendeeSuggestions = document.getElementById("attendeeSuggestions");
  const attendeeChips = document.getElementById("attendeeChips");
  const attendeeHiddenInput = document.getElementById("attendeeIds");
  const visibilitySelect = document.getElementById("eventVisibility");

  let selectedEventId = null;
  const cachedCourseId = getCachedCourseId();
  let courseId = normalizeCourseId(cachedCourseId);
  const defaultCourseId = courseId;
  let editingEventId = null;
  let currentEventDetails = null;
  let allUsers = [];
  let groupsList = [];
  let selectedAttendees = [];

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
        success(
          data.map(event => ({
            ...event,
            display: "block"
          }))
        );
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

  loadDirectoryUsers();
  loadGroups();

  attendeeSearchInput?.addEventListener("input", handleAttendeeSearch);
  attendeeSearchInput?.addEventListener("focus", handleAttendeeSearch);
  attendeeSuggestions?.addEventListener("mousedown", handleSuggestionClick);
  attendeeChips?.addEventListener("click", handleChipClick);
  visibilitySelect?.addEventListener("change", handleVisibilityChange);

  eventForm.addEventListener("reset", () => {
    setSelectedAttendees([]);
    if (visibilitySelect) visibilitySelect.value = "class";
    courseId = defaultCourseId;
  });

  document.addEventListener("click", e => {
    if (attendeeSuggestions && !attendeeSuggestions.contains(e.target) && e.target !== attendeeSearchInput) {
      attendeeSuggestions.classList.add("hidden");
    }
  });

  addEventBtn.addEventListener("click", () => {
    eventForm.reset();
    editingEventId = null;
    setSelectedAttendees([]);
    if (visibilitySelect) visibilitySelect.value = "class";
    courseId = defaultCourseId;
    openModal(eventModal);
  });
  cancelEventBtn.addEventListener("click", () => {
    eventForm.reset();
    editingEventId = null;
    setSelectedAttendees([]);
    if (visibilitySelect) visibilitySelect.value = "class";
    courseId = defaultCourseId;
    closeModal(eventModal);
  });

  eventForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(eventForm);

    const attendeeField = fd.get("attendees") || "";

    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      location: fd.get("location"),
      start: fd.get("start"),
      end: fd.get("end"),
      visibility: fd.get("visibility"),
      attendeeIds: attendeeField
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number),
      courseId
    };
    payload.visibility = visibilitySelect ? visibilitySelect.value : "class";

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
    selectedAttendees = [];
    renderSelectedAttendees();
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
    const myStatusText = myStatus
      ? `Your Attendance: ${myStatus}`
      : "You have not marked attendance yet.";
    document.getElementById("eventDetailsMyStatus").textContent = myStatusText;

    const startDate = new Date(data.event.start_time);
    const endDate = new Date(data.event.end_time);
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const hasEnded = endDate < now;
    const alreadyMarked =
      data.myAttendance &&
      data.myAttendance.status &&
      data.myAttendance.status.toLowerCase() !== "invited";

    const canAttend = Boolean(data.canAttend);
    const shouldDisable = !isToday || hasEnded || !canAttend;
    markAttendanceBtn.disabled = shouldDisable;
    markAttendanceBtn.dataset.allowed = canAttend ? "true" : "false";
    markAttendanceBtn.dataset.reason = shouldDisable
      ? !canAttend
        ? "You are not listed as an attendee for this event."
        : hasEnded
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
    const attendeeIds = attendees.map(a => a.user_id).filter(Boolean);
    setSelectedAttendees(attendeeIds);
    openModal(eventModal);
  });

  markAttendanceBtn.addEventListener("click", async () => {
    if (!selectedEventId) return;
    const alreadyMarked = markAttendanceBtn.dataset.marked === "true";
    const allowed = markAttendanceBtn.dataset.allowed !== "false";
    if (markAttendanceBtn.disabled) {
      if (markAttendanceBtn.dataset.reason) {
        alert(markAttendanceBtn.dataset.reason);
      }
      return;
    }
    if (!allowed) {
      alert("You are not listed as an attendee for this event.");
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
    if (fromWindow !== undefined && fromWindow !== null && fromWindow !== "") {
      const normalized = normalizeCourseId(fromWindow);
      if (normalized) return normalized;
    }

    const fromDataset = document.body?.dataset?.courseId;
    if (fromDataset) {
      const normalized = normalizeCourseId(fromDataset);
      if (normalized) return normalized;
    }

    const stored =
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("courseId")) ||
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("courseId"));
    if (stored) {
      const normalized = normalizeCourseId(stored);
      if (normalized) return normalized;
    }

    return null;
  }

  function persistCourseId(id) {
    const numericId = normalizeCourseId(id);
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
      const numericId = normalizeCourseId(resolved);
      return numericId;
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

  async function loadDirectoryUsers() {
    try {
      const res = await fetch("/users");
      if (!res.ok) return;
      const data = await res.json();
      allUsers = Array.isArray(data.users) ? data.users : [];
    } catch (err) {
      console.error("Failed to load users for attendee search:", err);
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch("/groups");
      if (!res.ok) return;
      const data = await res.json();
      groupsList = Array.isArray(data.groups) ? data.groups : [];
      populateVisibilityOptions();
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }

  function populateVisibilityOptions() {
    if (!visibilitySelect || groupsList.length === 0) return;
    Array.from(visibilitySelect.options)
      .filter(opt => opt.dataset.dynamic === "true")
      .forEach(opt => opt.remove());

    groupsList.forEach(group => {
      const option = document.createElement("option");
      option.value = `group:${group.id}`;
      option.textContent = `Group: ${group.name}`;
      option.dataset.dynamic = "true";
      visibilitySelect.appendChild(option);
    });
  }

  function handleVisibilityChange() {
    if (!visibilitySelect) return;
    const value = visibilitySelect.value;
    if (value.startsWith("group:")) {
      const id = Number(value.split(":")[1]);
      const group = groupsList.find(g => g.id === id);
      if (group) {
        courseId = normalizeCourseId(group.id);
        loadGroupMembers(group);
      }
    } else {
      courseId = defaultCourseId;
      if (value === "class") {
        setSelectedAttendees([]);
      }
    }
  }

  async function loadGroupMembers(group) {
    try {
    const res = await fetch(`/users?groupId=${group.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const ids = (data.users || []).map(u => u.id);
      setSelectedAttendees(ids);
    } catch (err) {
      console.error("Failed to load group members:", err);
    }
  }

  function handleAttendeeSearch() {
    if (!attendeeSearchInput || !attendeeSuggestions) return;
    const query = attendeeSearchInput.value.trim().toLowerCase();
    if (!query) {
      attendeeSuggestions.classList.add("hidden");
      attendeeSuggestions.innerHTML = "";
      return;
    }

    const matches = allUsers
      .filter(user => !selectedAttendees.includes(user.id))
      .filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
      .slice(0, 5);

    if (matches.length === 0) {
      attendeeSuggestions.classList.add("hidden");
      attendeeSuggestions.innerHTML = "";
      return;
    }

    attendeeSuggestions.innerHTML = matches
      .map(
        user =>
          `<li data-id="${user.id}">${user.name} <span>${user.email}</span></li>`
      )
      .join("");
    attendeeSuggestions.classList.remove("hidden");
  }

  function handleSuggestionClick(e) {
    const item = e.target.closest("li");
    if (!item) return;
    const id = Number(item.dataset.id);
    if (!Number.isFinite(id)) return;
    setSelectedAttendees([id], false);
    if (attendeeSearchInput) {
      attendeeSearchInput.value = "";
    }
    attendeeSuggestions?.classList.add("hidden");
  }

  function handleChipClick(e) {
    if (!e.target.matches(".remove-chip")) return;
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const id = Number(chip.dataset.id);
    selectedAttendees = selectedAttendees.filter(att => att !== id);
    renderSelectedAttendees();
  }

  function renderSelectedAttendees() {
    if (!attendeeChips) return;
    attendeeChips.innerHTML = selectedAttendees
      .map(id => {
        const user = allUsers.find(u => u.id === id);
        const label = user ? user.name : `User ${id}`;
        return `<span class="chip" data-id="${id}">${label}<button type="button" class="remove-chip" aria-label="Remove">×</button></span>`;
      })
      .join("");
    updateHiddenAttendees();
  }

  function updateHiddenAttendees() {
    if (attendeeHiddenInput) {
      attendeeHiddenInput.value = selectedAttendees.join(",");
    }
  }

  function setSelectedAttendees(ids, replace = true) {
    const normalized = ids
      .map(Number)
      .filter(id => Number.isFinite(id));
    if (replace) {
      selectedAttendees = Array.from(new Set(normalized));
    } else {
      const merged = new Set([...selectedAttendees, ...normalized]);
      selectedAttendees = Array.from(merged);
    }
    renderSelectedAttendees();
  }

  function normalizeCourseId(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
  }
}
