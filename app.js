(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;
  const params = new URLSearchParams(window.location.search);
  const isPresenter = params.get("presenter") === "1";
  const sessionId = Math.random().toString(36).slice(2);
  const syncKey = `tbl-5-7:${window.location.pathname}:state`;
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(syncKey) : null;
  let currentSlide = 0;
  let toastTimer;

  const previousButton = document.getElementById("previousButton");
  const nextButton = document.getElementById("nextButton");
  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const sourceDialog = document.getElementById("sourceDialog");
  const toast = document.getElementById("toast");

  function clampSlide(index) {
    return Math.max(0, Math.min(totalSlides - 1, Number(index) || 0));
  }

  function readInitialSlide() {
    const match = window.location.hash.match(/^#bild-(\d+)$/);
    return match ? clampSlide(Number(match[1]) - 1) : 0;
  }

  function saveState(index) {
    try {
      localStorage.setItem(syncKey, JSON.stringify({ index, sender: sessionId, time: Date.now() }));
    } catch (_) {
      // Presentationen fungerar även när lagring är blockerad.
    }
  }

  function broadcast(index) {
    const message = { type: "navigate", index, sender: sessionId };
    channel?.postMessage(message);
    saveState(index);
  }

  function setSlide(index, options = {}) {
    const nextIndex = clampSlide(index);
    currentSlide = nextIndex;

    if (!isPresenter) {
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === nextIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        if (active) slide.scrollTop = 0;
      });

      previousButton.disabled = nextIndex === 0;
      nextButton.disabled = nextIndex === totalSlides - 1;
      progressBar.style.width = `${((nextIndex + 1) / totalSlides) * 100}%`;
      progressLabel.textContent = `${nextIndex + 1} / ${totalSlides}`;
      document.title = `${slides[nextIndex].dataset.title} | Basgrupp 4`;

      {
        history.replaceState(null, "", `#bild-${nextIndex + 1}`);
      }
    }

    updatePresenterView();
    if (options.broadcast !== false && !options.fromSync) broadcast(nextIndex);
  }

  function move(delta) {
    setSlide(currentSlide + delta);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function handlePollChoice(button) {
    const poll = button.closest("[data-poll]");
    if (!poll) return;
    const choices = Array.from(poll.querySelectorAll(".choice"));
    choices.forEach(choice => choice.classList.remove("is-selected", "is-correct", "is-wrong"));
    button.classList.add("is-selected");

    if (button.dataset.answer === "correct") button.classList.add("is-correct");
    if (button.dataset.answer === "wrong") button.classList.add("is-wrong");

    const feedback = poll.querySelector(".feedback");
    if (feedback) feedback.hidden = false;
  }

  function resetPolls(slide) {
    slide.querySelectorAll(".choice").forEach(choice => choice.classList.remove("is-selected", "is-correct", "is-wrong"));
    slide.querySelectorAll(".feedback").forEach(feedback => { feedback.hidden = true; });
  }

  let revealedRequisites = 1;
  const revealNext = document.getElementById("revealNext");
  const revealCount = document.getElementById("revealCount");
  const requisites = Array.from(document.querySelectorAll(".requisite"));

  function updateRequisites() {
    requisites.forEach((item, index) => {
      item.classList.toggle("is-revealed", index < revealedRequisites);
      item.setAttribute("aria-hidden", String(index >= revealedRequisites));
    });
    revealCount.textContent = String(revealedRequisites);
    revealNext.textContent = revealedRequisites >= requisites.length ? "Alla rekvisit visas" : "Visa nästa rekvisit";
    revealNext.disabled = revealedRequisites >= requisites.length;
  }

  revealNext.addEventListener("click", () => {
    revealedRequisites = Math.min(requisites.length, revealedRequisites + 1);
    updateRequisites();
  });

  document.querySelectorAll(".step-card").forEach(card => {
    card.addEventListener("click", () => {
      const expanded = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!expanded));
    });
  });

  document.querySelectorAll(".case-reveal").forEach(button => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
    });
  });

  const evidence = [
    {
      prompt: "När och hur föraren lämnade olycksplatsen",
      answer: "5",
      explanation: "Det hör främst till 5 §. Ett tidsatt händelseförlopp kan visa undandragandet och vad personen gjorde efter olyckan."
    },
    {
      prompt: "Tidigare domar för olovlig körning och rattfylleri",
      answer: "7",
      explanation: "Det hör till 7 §. Tidigare olovlig körning, rattfylleri och grovt rattfylleri ska beaktas särskilt i behovsbedömningen."
    },
    {
      prompt: "Faktisk ägare, finansiering och tredje mans anspråk",
      answer: "7",
      explanation: "Det hör till 7 §. Underlaget behövs för att avgöra vem ett förverkande kan riktas mot och för skälighetsbedömningen."
    },
    {
      prompt: "Vad personen uppfattade och förstod om sammanstötningen",
      answer: "5",
      explanation: "Det hör främst till 5 §. Uppgiften kan belysa om personen hade uppsåt till att undandra sig sina skyldigheter."
    },
    {
      prompt: "Skadorna på fordonet och hur det användes vid den aktuella händelsen",
      answer: "both",
      explanation: "Det kan få betydelse för båda. Skadorna kan styrka trafikolyckan enligt 5 §, medan användningen och kopplingen till ett TBL-brott är central enligt 7 §."
    },
    {
      prompt: "Vilka identitetsuppgifter som efterfrågades och vad föraren erbjöd",
      answer: "5",
      explanation: "Det hör till 5 §. Uppgifterna visar om personen undandrog sig skyldigheten att uppge namn och hemvist eller lämna upplysningar."
    },
    {
      prompt: "Tillgång till alternativa fordon och hushållets legitima behov",
      answer: "7",
      explanation: "Det hör till 7 §. Sådana omständigheter kan ingå i bedömningen av om ett förverkande skulle vara uppenbart oskäligt."
    }
  ];

  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  const evidencePrompt = document.getElementById("evidencePrompt");
  const quizProgress = document.getElementById("quizProgress");
  const quizScoreElement = document.getElementById("quizScore");
  const quizFeedback = document.getElementById("quizFeedback");
  const quizNext = document.getElementById("quizNext");
  const quizAnswers = Array.from(document.querySelectorAll(".quiz-answer"));

  function renderQuiz() {
    const item = evidence[quizIndex];
    evidencePrompt.textContent = item.prompt;
    quizProgress.textContent = `${quizIndex + 1} av ${evidence.length}`;
    quizScoreElement.textContent = `${quizScore} rätt`;
    quizFeedback.hidden = true;
    quizFeedback.className = "quiz-feedback";
    quizFeedback.textContent = "";
    quizNext.hidden = true;
    quizNext.textContent = quizIndex === evidence.length - 1 ? "Visa resultat" : "Nästa uppgift";
    quizAnswers.forEach(answer => {
      answer.disabled = false;
      answer.classList.remove("is-correct", "is-wrong");
    });
    quizAnswered = false;
  }

  function answerQuiz(button) {
    if (quizAnswered) return;
    quizAnswered = true;
    const item = evidence[quizIndex];
    const correct = button.dataset.value === item.answer;
    if (correct) quizScore += 1;

    quizAnswers.forEach(answer => {
      answer.disabled = true;
      if (answer.dataset.value === item.answer) answer.classList.add("is-correct");
    });
    if (!correct) button.classList.add("is-wrong");

    quizScoreElement.textContent = `${quizScore} rätt`;
    quizFeedback.classList.add(correct ? "correct" : "wrong");
    quizFeedback.innerHTML = `<strong>${correct ? "Rätt." : "Inte riktigt."}</strong> ${item.explanation}`;
    quizFeedback.hidden = false;
    quizNext.hidden = false;
  }

  quizAnswers.forEach(button => button.addEventListener("click", () => answerQuiz(button)));
  quizNext.addEventListener("click", () => {
    if (quizIndex < evidence.length - 1) {
      quizIndex += 1;
      renderQuiz();
      return;
    }
    evidencePrompt.textContent = `Klart: ${quizScore} av ${evidence.length} rätt`;
    quizProgress.textContent = "Genomfört";
    quizFeedback.className = "quiz-feedback correct";
    quizFeedback.textContent = "Bra underlag kräver att rekvisiten översätts till konkreta, dokumenterbara fakta.";
    quizFeedback.hidden = false;
    quizNext.hidden = true;
    quizAnswers.forEach(answer => { answer.disabled = true; answer.classList.remove("is-correct", "is-wrong"); });
  });

  function resetQuiz() {
    quizIndex = 0;
    quizScore = 0;
    renderQuiz();
  }

  function resetCurrentInteraction() {
    const slide = slides[currentSlide];
    resetPolls(slide);

    if (currentSlide === 3) {
      revealedRequisites = 1;
      updateRequisites();
    }
    if (currentSlide === 6) {
      slide.querySelectorAll(".step-card").forEach(card => card.setAttribute("aria-expanded", "false"));
    }
    if (currentSlide === 7) {
      slide.querySelectorAll(".case-reveal").forEach(button => button.setAttribute("aria-expanded", "false"));
    }
    if (currentSlide === 8) resetQuiz();
    showToast("Aktuell bild har återställts");
  }

  function resetAll(notify = true) {
    slides.forEach(resetPolls);
    revealedRequisites = 1;
    updateRequisites();
    document.querySelectorAll('.step-card, .case-reveal').forEach(item => item.setAttribute('aria-expanded', 'false'));
    resetQuiz();
    if (notify) {
      const message = { type: 'reset', sender: sessionId, time: Date.now() };
      channel?.postMessage(message);
      try { localStorage.setItem(`${syncKey}:command`, JSON.stringify(message)); } catch (_) {}
    }
    showToast('Alla svar och visningar är återställda');
  }
  document.getElementById('resetButton').addEventListener('click', () => resetAll());
  document.getElementById('presenterReset').addEventListener('click', () => resetAll());

  document.addEventListener("click", event => {
    const choice = event.target.closest(".choice");
    if (choice) handlePollChoice(choice);

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "next") move(1);
    if (action === "restart") { resetAll(); setSlide(0); }
  });

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

  document.getElementById("sourcesButton").addEventListener("click", () => sourceDialog.showModal());
  document.querySelector("[data-dialog-close]").addEventListener("click", () => sourceDialog.close());
  sourceDialog.addEventListener("click", event => {
    if (event.target === sourceDialog) sourceDialog.close();
  });

  document.getElementById("fullscreenButton").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      showToast("Helskärmsläget kunde inte startas i den här webbläsaren");
    }
  });

  document.getElementById("shareButton").addEventListener("click", async () => {
    if (window.location.protocol === "file:") {
      showToast("Dela-knappen blir aktiv när sidan är publicerad");
      return;
    }
    const shareData = { title: "TBL 5 § och 7 §", text: "Interaktiv presentation om trafikbrottslagen", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Länken har kopierats");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Länken kunde inte delas automatiskt");
    }
  });

  document.getElementById("presenterButton").addEventListener("click", () => {
    const presenterUrl = new URL(window.location.href);
    presenterUrl.searchParams.set("presenter", "1");
    presenterUrl.hash = "";
    window.open(presenterUrl, "tbl-presenter", "width=1050,height=760");
  });

  document.getElementById("printButton").addEventListener("click", () => window.print());

  function updatePresenterView() {
    if (!isPresenter) return;
    const current = slides[currentSlide];
    const next = slides[Math.min(currentSlide + 1, totalSlides - 1)];
    document.getElementById("presenterTitle").textContent = current.dataset.title;
    document.getElementById("presenterPosition").textContent = `${currentSlide + 1} / ${totalSlides}`;
    document.getElementById("presenterNextTitle").textContent = currentSlide === totalSlides - 1 ? "Presentationens slut" : next.dataset.title;
    const template = document.querySelector(`template[data-notes-for="${currentSlide}"]`);
    document.getElementById("presenterNotes").innerHTML = template ? template.innerHTML : "<p>Inget talmanus för bilden.</p>";
    const note = window.speakerNotes?.[currentSlide];
    if (note) document.getElementById('presenterNotes').innerHTML = `<p class="script-cue">Tid: ${note[0]}</p><h3>Säg ungefär så här</h3><p>${note[1]}</p><h3>Gör så här</h3><p class="script-cue">${note[2]}</p>`;
    document.getElementById("presenterPrevious").disabled = currentSlide === 0;
    document.getElementById("presenterNext").disabled = currentSlide === totalSlides - 1;
    document.title = `Talmanus: ${current.dataset.title}`;
  }

  function initializePresenterMode() {
    if (!isPresenter) return;
    document.querySelector(".topbar").hidden = true;
    document.querySelector(".deck").hidden = true;
    document.querySelector(".controls").hidden = true;
    document.getElementById("presenterDashboard").hidden = false;
    document.body.classList.add("presenter-mode");
    document.body.style.overflow = "auto";

    try {
      const saved = JSON.parse(localStorage.getItem(syncKey) || "null");
      if (Number.isInteger(saved?.index)) currentSlide = clampSlide(saved.index);
    } catch (_) {
      currentSlide = 0;
    }

    document.getElementById("presenterPrevious").addEventListener("click", () => move(-1));
    document.getElementById("presenterNext").addEventListener("click", () => move(1));
  }

  let timerSeconds = 0;
  let timerInterval = null;
  const timerDisplay = document.getElementById("timerDisplay");
  const timerToggle = document.getElementById("timerToggle");

  function renderTimer() {
    const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
    const seconds = (timerSeconds % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  timerToggle.addEventListener("click", () => {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
      timerToggle.textContent = "Fortsätt";
      return;
    }
    timerInterval = window.setInterval(() => { timerSeconds += 1; renderTimer(); }, 1000);
    timerToggle.textContent = "Pausa";
  });

  document.getElementById("timerReset").addEventListener("click", () => {
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    timerToggle.textContent = "Starta";
    renderTimer();
  });

  function receiveSync(message) {
    if (message?.sender !== sessionId && message?.type === 'reset') { resetAll(false); return; }
    if (message?.sender === sessionId || message?.type !== "navigate") return;
    setSlide(message.index, { fromSync: true, broadcast: false });
  }

  if (channel) channel.addEventListener("message", event => receiveSync(event.data));
  window.addEventListener("storage", event => {
    if (event.key === `${syncKey}:command` && event.newValue) {
      try { receiveSync(JSON.parse(event.newValue)); } catch (_) {}
      return;
    }
    if (event.key !== syncKey || !event.newValue) return;
    try { receiveSync({ ...JSON.parse(event.newValue), type: "navigate" }); } catch (_) { /* Ignorera trasigt lagringsvärde. */ }
  });

  window.addEventListener("hashchange", () => {
    if (!isPresenter) setSlide(readInitialSlide(), { broadcast: true });
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (sourceDialog.open) return;
    const interactive = event.target.closest("button, a, input, select, textarea");
    if (interactive && (event.key === " " || event.key === "Enter")) return;

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      move(1);
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      move(-1);
    }
    if (event.key.toLowerCase() === "f" && !isPresenter) document.getElementById("fullscreenButton").click();
    if (event.key.toLowerCase() === "s" && !isPresenter) sourceDialog.showModal();
    if (event.key.toLowerCase() === "r") resetAll();
  });

  initializePresenterMode();
  resetQuiz();
  updateRequisites();
  setSlide(isPresenter ? currentSlide : readInitialSlide(), { broadcast: !isPresenter });

  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
})();
