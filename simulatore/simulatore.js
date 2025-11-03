function aggiornaLimiti() {
  const prodotto = document.getElementById("prodotto").value;
  const importo = document.getElementById("importo");
  const importoNum = document.getElementById("importo-num");
  const durata = document.getElementById("durata");
  const durataNum = document.getElementById("durata-num");

  if (prodotto === "prestito" || prodotto === "consolidamento") {
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

prodotto.addEventListener("change", () => {
  aggiornaLimiti();
  tipoTassoContainer.style.display = prodotto.value === "mutuo" ? "block" : "none";
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

function calcolaRata() {
  mostraAnimazione();

  setTimeout(() => {
    const importo = parseFloat(document.getElementById("importo-num").value.replace(/\./g, ""));
    const durataAnni = parseInt(document.getElementById("durata").value);
    const prodottoSelezionato = document.getElementById("prodotto").value;
    const tassoScelto = document.getElementById("tipoTasso").value;

    const tassi = {
      prestito: 8,
      consolidamento: 5,
      mutuo: {
        fisso: 3.5,
        variabile: 3.2
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

    const costi = prodottoSelezionato === "mutuo" ? importo * 0.02 : 0;
    const importoErogato = importo - costi;

    let rata = 0;
    let piano;

    if (prodottoSelezionato === "mutuo" && tassoScelto === "variabile") {
      piano = calcolaPianoVariabile(importo, tassoMensile, numeroRate);
      rata = piano[0].interesse + piano[0].capitale;
    } else {
      rata = importo * (tassoMensile / (1 - Math.pow(1 + tassoMensile, -numeroRate)));
      piano = calcolaPianoFisso(importo, tassoMensile, numeroRate);
    }

    const flussi = [-importoErogato];
    for (let i = 1; i <= numeroRate; i++) {
      flussi.push(rata);
    }

    const taegMensile = calcolaIRR(flussi);
    const taegAnnuo = Math.pow(1 + taegMensile, 12) - 1;

    document.getElementById("risultato").innerHTML = `
      <h4>Rata mensile: <span id="rata">€${rata.toFixed(2)}</span></h4>
      <h5>TAEG stimato: ${(taegAnnuo * 100).toFixed(2).replace(".", ",")}%</h5>
    `;

    aggiornaGrafico(piano);
  }, 1000);
}

function calcolaPianoFisso(importo, tassoMensile, numeroRate) {
  const piano = [];
  let capitaleResiduo = importo;
  const rata = importo * (tassoMensile / (1 - Math.pow(1 + tassoMensile, -numeroRate)));

  for (let i = 1; i <= numeroRate; i++) {
    const interesseMese = capitaleResiduo * tassoMensile;
    const quotaCapitale = rata - interesseMese;
    capitaleResiduo -= quotaCapitale;

    piano.push({
      mese: i,
      interesse: interesseMese,
      capitale: quotaCapitale,
      residuo: capitaleResiduo > 0 ? capitaleResiduo : 0
    });
  }
  return piano;
}

function calcolaPianoVariabile(importo, tassoMensile, numeroRate) {
  const piano = [];
  let capitaleResiduo = importo;
  const quotaCapitale = importo / numeroRate;

  for (let i = 1; i <= numeroRate; i++) {
    const interesse = capitaleResiduo * tassoMensile;
    capitaleResiduo -= quotaCapitale;

    piano.push({
      mese: i,
      interesse: interesse,
      capitale: quotaCapitale,
      residuo: capitaleResiduo > 0 ? capitaleResiduo : 0
    });
  }
  return piano;
}

let chart = null;

function aggiornaGrafico(piano) {
  const ctx = document.getElementById('grafico-interessi').getContext('2d');

  const labels = piano.map(mese => `Mese ${mese.mese}`);
  const interessi = piano.map(mese => mese.interesse.toFixed(2));
  const capitale = piano.map(mese => mese.capitale.toFixed(2));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Quota Interessi',
          data: interessi,
          backgroundColor: 'rgba(255, 99, 132, 0.7)'
        },
        {
          label: 'Quota Capitale',
          data: capitale,
          backgroundColor: 'rgba(54, 162, 235, 0.7)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
          ticks: {
            maxRotation: 90,
            minRotation: 45,
            maxTicksLimit: 12
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Euro (€)'
          }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: €${parseFloat(ctx.parsed.y).toLocaleString("it-IT", { minimumFractionDigits: 2 })}`
          }
        }
      }
    }
  });
}

// Quiz
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

aggiornaLimiti();
