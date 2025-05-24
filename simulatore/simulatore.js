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
      prestito: 7.5,
      consolidamento: 9.0,
      mutuo: {
        fisso: 3.2,
        variabile: 2.1
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

    const rata = importo * (tassoMensile / (1 - Math.pow(1 + tassoMensile, -numeroRate)));

    // Visualizzo solo la rata, niente TAEG
    document.getElementById("risultato").innerHTML = `
      <h4>Rata mensile: <span id="rata">€${rata.toFixed(2)}</span></h4>
    `;
  }, 1000);
}

aggiornaLimiti();
