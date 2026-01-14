const STORAGE_KEY = "daily-tracker-data";

const habitCounter = document.getElementById("habitCounter");
const habitStartText = document.getElementById("habitStartText");
const habitGoal = document.getElementById("habitGoal");
const habitRemaining = document.getElementById("habitRemaining");
const habitBeyond = document.getElementById("habitBeyond");
const dailyMessage = document.getElementById("dailyMessage");

const habitForm = document.getElementById("habitForm");
const habitStartInput = document.getElementById("habitStart");
const habitStatusInput = document.getElementById("habitStatus");
const habitNoteInput = document.getElementById("habitNote");
const messageInput = document.getElementById("messageInput");
const addMessageButton = document.getElementById("addMessage");

const quranForm = document.getElementById("quranForm");
const quranSurahInput = document.getElementById("quranSurah");
const quranNumberInput = document.getElementById("quranNumber");

const activityForm = document.getElementById("activityForm");
const activityTextInput = document.getElementById("activityText");
const phoneTimeInput = document.getElementById("phoneTime");
const wentOutInput = document.getElementById("wentOut");
const waterIntakeInput = document.getElementById("waterIntake");

const savingsForm = document.getElementById("savingsForm");
const savingsGoalInput = document.getElementById("savingsGoal");
const savingsReasonInput = document.getElementById("savingsReason");
const savingsTotalInput = document.getElementById("savingsTotal");
const savingsAddedInput = document.getElementById("savingsAdded");
const savingsTable = document.getElementById("savingsTable");

const trackerBody = document.getElementById("trackerBody");

const notesList = document.getElementById("notesList");
const openNoteButton = document.getElementById("openNote");
const noteModal = document.getElementById("noteModal");
const noteText = document.getElementById("noteText");
const saveNoteButton = document.getElementById("saveNote");
const closeNoteButton = document.getElementById("closeNote");

const noteViewModal = document.getElementById("noteViewModal");
const noteViewTitle = document.getElementById("noteViewTitle");
const noteViewText = document.getElementById("noteViewText");
const updateNoteButton = document.getElementById("updateNote");
const closeNoteViewButton = document.getElementById("closeNoteView");

const moodModal = document.getElementById("moodModal");
const enableNotificationsButton = document.getElementById("enableNotifications");

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

let selectedNoteId = null;
let reminderIntervalId = null;

const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      habitStart: null,
      dailyLogs: {},
      messages: [],
      savings: [],
      notes: [],
    };
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    return {
      habitStart: null,
      dailyLogs: {},
      messages: [],
      savings: [],
      notes: [],
    };
  }
};

const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getTodayKey = () => new Date().toISOString().split("T")[0];

const ensureDailyLog = (data, dateKey) => {
  if (!data.dailyLogs[dateKey]) {
    data.dailyLogs[dateKey] = {
      habitStatus: "",
      habitNote: "",
      quranSurah: "",
      quranNumber: "",
      activity: {
        text: "",
        phoneTime: "",
        wentOut: "",
        waterIntake: "",
      },
      mood: "",
    };
  }
};

const formatTimeDiff = (startDate) => {
  const diffMs = new Date() - startDate;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return {
    days,
    time: `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`,
  };
};

const updateCounters = (data) => {
  if (!data.habitStart) {
    habitCounter.textContent = "اليوم 0 - 00:00";
    habitStartText.textContent = "ابدأ بتحديد تاريخ البداية.";
    habitGoal.textContent = "0/90";
    habitRemaining.textContent = "متبقي 90 يوم";
    habitBeyond.textContent = "0 يوم";
    return;
  }

  const startDate = new Date(data.habitStart);
  const { days, time } = formatTimeDiff(startDate);
  habitCounter.textContent = `اليوم ${days} - ${time}`;
  habitStartText.textContent = `بدأت في ${data.habitStart}`;

  const goalDays = Math.min(days, 90);
  habitGoal.textContent = `${goalDays}/90`;

  if (days >= 90) {
    habitRemaining.textContent = "تهانينا! وصلت للهدف.";
    habitBeyond.textContent = `${days - 90} يوم`;
  } else {
    habitRemaining.textContent = `متبقي ${90 - days} يوم`;
    habitBeyond.textContent = "0 يوم";
  }
};

const updateDailyMessage = (data) => {
  if (!data.messages.length) {
    dailyMessage.textContent = "أضف رسائل تحفيزية لتظهر يوميًا.";
    return;
  }
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const message = data.messages[dayIndex % data.messages.length];
  dailyMessage.textContent = message;
};

const renderTracker = (data) => {
  const dates = Object.keys(data.dailyLogs).sort((a, b) => b.localeCompare(a));
  trackerBody.innerHTML = "";
  dates.forEach((dateKey) => {
    const log = data.dailyLogs[dateKey];
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.innerHTML = `
      <div>${dateKey}</div>
      ${log.mood ? `<div class="badge">${log.mood}</div>` : ""}
    `;

    const habitCell = document.createElement("td");
    habitCell.className =
      log.habitStatus === "completed"
        ? "status-completed"
        : log.habitStatus === "relapse"
        ? "status-relapse"
        : log.habitStatus === "slip"
        ? "status-slip"
        : "";
    habitCell.innerHTML = log.habitStatus
      ? `${getHabitLabel(log.habitStatus)}<div>${log.habitNote || ""}</div>`
      : "--";

    const quranCell = document.createElement("td");
    quranCell.innerHTML = log.quranSurah
      ? `${log.quranSurah} ${log.quranNumber ? `(${log.quranNumber})` : ""}`
      : "--";
    quranCell.className = log.quranSurah ? "badge" : "";

    const activityCell = document.createElement("td");
    if (log.activity && (log.activity.text || log.activity.phoneTime || log.activity.wentOut || log.activity.waterIntake)) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "عرض التفاصيل";
      details.appendChild(summary);
      if (log.activity.text) {
        const text = document.createElement("div");
        text.textContent = log.activity.text;
        details.appendChild(text);
      }
      if (log.activity.phoneTime) {
        const phone = document.createElement("div");
        phone.textContent = `موبايل: ${log.activity.phoneTime} ساعة`;
        phone.className = "activity-chip";
        details.appendChild(phone);
      }
      if (log.activity.wentOut) {
        const out = document.createElement("div");
        out.textContent = log.activity.wentOut;
        out.className = "activity-chip";
        details.appendChild(out);
      }
      if (log.activity.waterIntake) {
        const water = document.createElement("div");
        water.textContent = `مياه: ${log.activity.waterIntake} لتر`;
        water.className = "activity-chip";
        details.appendChild(water);
      }
      activityCell.appendChild(details);
    } else {
      activityCell.textContent = "--";
    }

    row.appendChild(dateCell);
    row.appendChild(habitCell);
    row.appendChild(quranCell);
    row.appendChild(activityCell);
    trackerBody.appendChild(row);
  });
};

const renderSavings = (data) => {
  savingsTable.innerHTML = "";
  data.savings.forEach((goal) => {
    const remaining = Math.max(goal.total - goal.saved, 0);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${goal.goal}</td>
      <td>${goal.reason}</td>
      <td>${goal.saved}/${goal.total}</td>
      <td>متبقي ${remaining}</td>
    `;
    savingsTable.appendChild(row);
  });
};

const renderNotes = (data) => {
  notesList.innerHTML = "";
  data.notes
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((note) => {
      const card = document.createElement("button");
      card.className = "note-card";
      card.type = "button";
      const title = note.text.split("\n")[0].slice(0, 24) || "ملاحظة بدون عنوان";
      card.innerHTML = `
        <strong>${title}</strong>
        <div>${note.date}</div>
      `;
      card.addEventListener("click", () => openNoteView(note.id));
      notesList.appendChild(card);
    });
};

const getHabitLabel = (status) => {
  if (status === "completed") return "كملت";
  if (status === "relapse") return "انتكست";
  if (status === "slip") return "زللت";
  return "";
};

const openMoodPrompt = () => {
  moodModal.classList.remove("hidden");
};

const closeMoodPrompt = () => {
  moodModal.classList.add("hidden");
};

const openNoteModal = () => {
  noteText.value = "";
  noteModal.classList.remove("hidden");
};

const closeNoteModal = () => {
  noteModal.classList.add("hidden");
};

const openNoteView = (noteId) => {
  const data = loadData();
  const note = data.notes.find((item) => item.id === noteId);
  if (!note) return;
  selectedNoteId = noteId;
  noteViewTitle.textContent = `ملاحظة ${note.date}`;
  noteViewText.value = note.text;
  noteViewModal.classList.remove("hidden");
};

const closeNoteView = () => {
  noteViewModal.classList.add("hidden");
  selectedNoteId = null;
};

const updateAll = () => {
  const data = loadData();
  updateCounters(data);
  updateDailyMessage(data);
  renderTracker(data);
  renderSavings(data);
  renderNotes(data);
};

const handleMoodCheck = () => {
  const data = loadData();
  const todayKey = getTodayKey();
  const now = new Date();
  ensureDailyLog(data, todayKey);
  if (now.getHours() >= 12 && !data.dailyLogs[todayKey].mood) {
    openMoodPrompt();
  }
};

const requestNotifications = async () => {
  if (!("Notification" in window)) {
    alert("المتصفح لا يدعم الإشعارات.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("لم يتم تفعيل الإشعارات.");
    return;
  }
  startReminderTimer();
};

const startReminderTimer = () => {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
  }
  reminderIntervalId = setInterval(() => {
    const data = loadData();
    const todayKey = getTodayKey();
    ensureDailyLog(data, todayKey);
    const hasLogged = data.dailyLogs[todayKey].habitStatus;
    if (!hasLogged && Notification.permission === "granted") {
      new Notification("تذكير يومي", {
        body: "سجل يومك في المتعقب الآن حتى تحافظ على الاستمرارية.",
      });
    }
  }, 1000 * 60 * 60 * 2);
};

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = loadData();
  const todayKey = getTodayKey();
  ensureDailyLog(data, todayKey);

  if (habitStartInput.value) {
    data.habitStart = habitStartInput.value;
  }

  if (habitStatusInput.value === "relapse") {
    const confirmReset = confirm("هل أنت متأكد من تسجيل انتكاسة؟ سيتم تصفير العداد.");
    if (!confirmReset) return;
    data.habitStart = todayKey;
  }

  if (habitStatusInput.value) {
    data.dailyLogs[todayKey].habitStatus = habitStatusInput.value;
    data.dailyLogs[todayKey].habitNote = habitNoteInput.value.trim();
  }

  saveData(data);
  habitForm.reset();
  habitStartInput.value = data.habitStart || "";
  updateAll();
});

addMessageButton.addEventListener("click", () => {
  const value = messageInput.value.trim();
  if (!value) return;
  const data = loadData();
  data.messages.push(value);
  saveData(data);
  messageInput.value = "";
  updateDailyMessage(data);
});

quranForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = loadData();
  const todayKey = getTodayKey();
  ensureDailyLog(data, todayKey);
  data.dailyLogs[todayKey].quranSurah = quranSurahInput.value.trim();
  data.dailyLogs[todayKey].quranNumber = quranNumberInput.value.trim();
  saveData(data);
  quranForm.reset();
  updateAll();
});

activityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = loadData();
  const todayKey = getTodayKey();
  ensureDailyLog(data, todayKey);
  data.dailyLogs[todayKey].activity = {
    text: activityTextInput.value.trim(),
    phoneTime: phoneTimeInput.value.trim(),
    wentOut: wentOutInput.value,
    waterIntake: waterIntakeInput.value.trim(),
  };
  saveData(data);
  activityForm.reset();
  updateAll();
});

savingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = loadData();
  const goalName = savingsGoalInput.value.trim();
  if (!goalName) return;
  const existing = data.savings.find((goal) => goal.goal === goalName);
  const added = Number(savingsAddedInput.value) || 0;
  const total = Number(savingsTotalInput.value) || (existing ? existing.total : 0);

  if (existing) {
    existing.reason = savingsReasonInput.value.trim() || existing.reason;
    existing.total = total || existing.total;
    existing.saved += added;
  } else {
    data.savings.push({
      id: crypto.randomUUID(),
      goal: goalName,
      reason: savingsReasonInput.value.trim(),
      total,
      saved: added,
    });
  }
  saveData(data);
  savingsForm.reset();
  updateAll();
});

openNoteButton.addEventListener("click", openNoteModal);
closeNoteButton.addEventListener("click", closeNoteModal);
closeNoteViewButton.addEventListener("click", closeNoteView);

saveNoteButton.addEventListener("click", () => {
  const text = noteText.value.trim();
  if (!text) return;
  const data = loadData();
  data.notes.push({
    id: crypto.randomUUID(),
    date: getTodayKey(),
    text,
    createdAt: Date.now(),
  });
  saveData(data);
  closeNoteModal();
  renderNotes(data);
});

updateNoteButton.addEventListener("click", () => {
  const data = loadData();
  const note = data.notes.find((item) => item.id === selectedNoteId);
  if (!note) return;
  note.text = noteViewText.value.trim();
  saveData(data);
  closeNoteView();
  renderNotes(data);
});

moodModal.addEventListener("click", (event) => {
  if (event.target.dataset.mood) {
    const data = loadData();
    const todayKey = getTodayKey();
    ensureDailyLog(data, todayKey);
    data.dailyLogs[todayKey].mood = event.target.dataset.mood;
    saveData(data);
    closeMoodPrompt();
    updateAll();
  }
});

enableNotificationsButton.addEventListener("click", requestNotifications);

const initTabs = () => {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach((panel) => {
        panel.classList.toggle("hidden", panel.id !== tab.dataset.tab);
      });
    });
  });
};

const init = () => {
  const data = loadData();
  habitStartInput.value = data.habitStart || "";
  updateAll();
  initTabs();
  handleMoodCheck();
  if (Notification.permission === "granted") {
    startReminderTimer();
  }
};

init();
