function aggiornaLimiti() {
  const prodotto = document.getElementById("prodotto").value;
  const importo = document.getElementById("importo");
  const importoNum = document.getElementById("importo-num");
  const durata = document.getElementById("durata");
  const durataNum = document.getElementById("durata-num");

  if (prodotto === "prestito") {
    importo.min = 1000;
    importo.max = 80000;
    durata.min = 1;
    durata.max = 10;
  } else {
    importo.min = 30000;
    importo.max = 500000;
    durata.min = 10;
    durata.max = 30;
  }

  if (importo.value < importo.min) importo.value = importo.min;
  if (importo.value > importo.max) importo.value = importo.max;
  if (durata.value < durata.min) durata.value = durata.min;
  if (durata.value > durata.max) durata.value = durata.max;

  importoNum.value = formatNumero(importo.value);
  durataNum.value = durata.value;
}

function aggiornaInput(id) {
  const value = document.getElementById(id).value;
  document.getElementById(`${id}-num`).value = formatNumero(value);
}

function aggiornaSlider(id) {
  const num = document.getElementById(`${id}-num`).value.replace(/\./g, "");
  document.getElementById(id).value = num;
}

function formatNumero(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const prodotto = document.getElementById("prodotto");
const tipoTassoContainer = document.getElementById("tipo-tasso-container");
const tipoTasso = document.getElementById("tipoTasso");

prodotto.addEventListener("change", () => {
  if (prodotto.value === "mutuo") {
    tipoTassoContainer.style.display = "block";
  } else {
    tipoTassoContainer.style.display = "none";
  }
});

function mostraAnimazione() {
  const risultato = document.getElementById("risultato");
  risultato.innerHTML = `
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Calcolo in corso...</span>
    </div>
    <p class="mt-2">Calcolo in corso, attendi un momento...</p>
  `;
}

function calcolaRata() {
  mostraAnimazione();

  setTimeout(() => {
    const importo = parseFloat(document.getElementById("importo-num").value.replace(/\./g, ""));
    const durataAnni = parseInt(document.getElementById("durata").value);
    const prodottoSelezionato = document.getElementById("prodotto").value;
    const tassoScelto = document.getElementById("tipoTasso").value;

    const tassi = {
      prestito: 8,
      consolidamento: 5.0,
      mutuo: {
        fisso: 3,
        variabile: 3.5
      }
    };

    let tassoAnnuo;
    if (prodottoSelezionato === "mutuo") {
      tassoAnnuo = tassi.mutuo[tassoScelto];
    } else {
      tassoAnnuo = tassi[prodottoSelezionato];
    }

    const tassoMensile = tassoAnnuo / 12 / 100;
    const numeroRate = durataAnni * 12;

    // Calcolo rata con formula francese
    const rata = importo * (tassoMensile / (1 - Math.pow(1 + tassoMensile, -numeroRate)));

    // Costi aggiuntivi (ipotetici)
    const costi = prodottoSelezionato === "mutuo" ? 1000 : 300;
    const importoErogato = importo - costi;

    // Calcolo TAEG iterativo (IRR mensile)
    const flussi = [-importoErogato];
    for (let i = 1; i <= numeroRate; i++) {
      flussi.push(rata);
    }

    const taegMensile = calcolaIRR(flussi);
    const taegAnnuo = Math.pow(1 + taegMensile, 12) - 1;

    document.getElementById("risultato").innerHTML = `
      <h4>Rata mensile: <span id="rata">€${rata.toFixed(2)}</span></h4>
      <h5>TAEG stimato: ${ (taegAnnuo * 100).toFixed(2).replace(".", ",") }%</h5>
    `;
  }, 1000);
}

// Funzione IRR iterativa (metodo di Newton-Raphson)
function calcolaIRR(flussi, guess = 0.01) {
  const maxIterazioni = 1000;
  const tolleranza = 1e-6;
  let rate = guess;

  for (let i = 0; i < maxIterazioni; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < flussi.length; t++) {
      npv += flussi[t] / Math.pow(1 + rate, t);
      dNpv += -t * flussi[t] / Math.pow(1 + rate, t + 1);
    }

    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < tolleranza) return newRate;
    rate = newRate;
  }

  return rate;
}

aggiornaLimiti();

let selectedGoal = "";

function openQuiz() {
  document.getElementById("quiz-popup").style.display = "block";
}

function closeQuiz() {
  document.getElementById("quiz-popup").style.display = "none";
}

function nextStep(step, goal) {
  selectedGoal = goal;
  document.getElementById("quiz-step-1").style.display = "none";
  document.getElementById("quiz-step-2").style.display = "block";
}

function showResult(incomeStatus) {
  let resultText = "";
  if (selectedGoal === "Casa") {
    resultText = incomeStatus === "stipendio" 
      ? "Potresti richiedere un mutuo prima casa." 
      : "Ti consiglio di parlare con un consulente per valutare soluzioni agevolate.";
  } else if (selectedGoal === "Auto") {
    resultText = incomeStatus === "stipendio" 
      ? "Un prestito personale potrebbe fare al caso tuo." 
      : "Potresti valutare un coobbligato o garanzie alternative.";
  } else if (selectedGoal === "Consolidamento") {
    resultText = incomeStatus === "stipendio" 
      ? "Il consolidamento debiti è la soluzione giusta!" 
      : "Parliamone: ci sono soluzioni anche per chi ha difficoltà reddituali.";
  }
  document.getElementById("quiz-step-2").style.display = "none";
  document.getElementById("quiz-result").style.display = "block";
  document.getElementById("quiz-result-text").textContent = resultText;
}
