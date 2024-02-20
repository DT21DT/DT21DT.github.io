// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  // updateDoc,
  // query,
  // where,
  // orderBy,
  // limit
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";;
import { v4 as uuidv4 } from "https://cdn.skypack.dev/uuid";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMUdM_ybn5boV-P8YGb_w19DGXg9wu_HM",
  authDomain: "binpackageexp.firebaseapp.com",
  projectId: "binpackageexp",
  storageBucket: "binpackageexp.appspot.com",
  messagingSenderId: "930509469425",
  appId: "1:930509469425:web:1a05fd62be8a9d559edb50",
  measurementId: "G-B12HM1LK3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Auth
const auth = getAuth();
const db = getFirestore();

const levelsDataRef = collection(db, 'levelsData');
const rankingRef = collection(db, 'ranking');

// Variabile per tenere traccia del livello corrente
let livelloCorrente = 1;
const ultimoLivello = 3;
let totalCost = 0;
const calcolaPunteggioButton = document.getElementById("calcolaPunteggio");
let playerName = ""; // Variabile globale per memorizzare il nome del giocatore
let storedPlayerName = "";

// Dichiarazione delle variabili per il punteggio e la classifica
let punteggio = 0;
let punteggioTotale = 0;
let classifica = [];
let timerInterval;
let timeLeft = 60; // Tempo in secondi per ogni livello
const maxTempo = 60;
const maxPunteggioTempo = 120;

let allItemsPlaced = false;
let lastLevelNumber = 1;
let playerRank = 0;

// Definizione dei suoni
const successSound = new Audio('success.mp3'); // Suono di completamento del livello
const errorSound = new Audio('error.mp3'); // Suono di errore
const failureSound = new Audio('failure.mp3'); // Suono di fine timer

// Funzione per generare un identificatore utente univoco utilizzando uuid
const generateUniqueId = () => {
    return 'user_' + uuidv4();
   };
// Funzione per impostare un cookie
const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}
// Funzione per ottenere il valore di un cookie
const getCookie = (name) => {
    const cookieName = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return '';
}
// Funzione per ottenere o generare un identificatore utente persistente
const getOrGenerateUserId = () => {
    let userId = getCookie('userId');

    if (!userId) {
        userId = generateUniqueId();
        setCookie('userId', userId, 365); // Memorizza il cookie per 365 giorni
        setCookie('currentRound', '1', 365); // Imposta il numero del round iniziale
    }

    return userId;
}
   
function startTimer() {
    timerInterval = setInterval(() => {
        // Aggiorna l'elemento HTML del timer con il tempo rimanente
        document.getElementById('timer').innerText = formatTime(timeLeft);

        // Riduci il tempo rimanente di 1 secondo
        timeLeft--;

        // Controlla se il tempo è scaduto
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            // Esegui le azioni per gestire il tempo scaduto
            handleTimeUp();
            // Chiama la funzione showEndTimeMessage per mostrare il messaggio di finito timer
            showEndTimeMessage(livelloCorrente);
        }
    }, 1000); // Esegui ogni secondo
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function handleTimeUp() {
    // Aggiungi qui le azioni da eseguire quando il tempo scade
    // Ad esempio, mostra un messaggio di tempo scaduto e riavvia il livello
    console.log('Tempo scaduto!');
    // await aggiornaInterfacciaGrafica();
}

// Funzione per chiedere all'utente di inserire il proprio nome giocatore
const askPlayerName = () => {
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `Inserisci il tuo nome giocatore: <br>`;
    messageContainer.className = 'player-name-message';

    // Stili per rendere il messaggio più grande e con gli spigoli arrotondati
    // Imposta la larghezza al 100% della larghezza della finestra visualizzata (viewport width)
    messageContainer.style.width = '100vw';
    // Imposta l'altezza al 100% dell'altezza della finestra visualizzata (viewport height)
    messageContainer.style.height = '100vh';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.display = 'flex'; // Utilizzo del flexbox
    messageContainer.style.flexDirection = 'column'; // Imposta la direzione del flexbox su colonna
    messageContainer.style.justifyContent = 'center'; // Centra verticalmente
    messageContainer.style.alignItems = 'center'; // Centra orizzontalmente

    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.backgroundColor = '#E0E5E9'; // Light blue background (you can change the color)
    messageContainer.style.color = '#000'; // Black text
    messageContainer.style.padding = '20px'; // Padding

    messageContainer.style.textAlign = 'center';
    messageContainer.style.lineHeight = '1.5';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'playerNameInput';
    nameInput.placeholder = 'Inserisci il tuo nome';
    nameInput.style.marginBottom = '10px';
    // Aggiungi alcuni stili per l'input
    nameInput.style.width = '80%';
    nameInput.style.padding = '8px';
    nameInput.style.borderRadius = '5px';
    nameInput.style.border = 'none';
    nameInput.style.backgroundColor = '#f2f2f2'; // Background color for the input field

    messageContainer.appendChild(nameInput);

    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continua';
    continueButton.style.marginTop = '10px';
    // Aggiungi stili al pulsante "Continua"
    continueButton.style.padding = '10px 20px';
    continueButton.style.borderRadius = '5px';
    continueButton.style.border = 'none';
    continueButton.style.backgroundColor = '#008CBA'; // Background color for the button
    continueButton.style.color = 'white'; // Text color for the button

    continueButton.onclick = async () => {
        const playerNameInput = document.getElementById('playerNameInput').value;
        let thereIsAlready = false; // Utilizza let invece di const per poter modificare il valore
    
        if (playerNameInput) {
            // Ottieni i dati per il livello corrente dal database ranking
            const data = await getAllDataFromRanking(livelloCorrente);
    
            // Converti i dati in un array di coppie chiave-valore
            const playerEntries = Object.entries(data); 
    
            // Cicla attraverso i giocatori per controllare se esiste già un nome uguale
            playerEntries.forEach(([playerName, playerData], index) => {
                if (playerData.playerName === playerNameInput) {
                    thereIsAlready = true;
                }
            });
            
            if (thereIsAlready) {
                // Se esiste già un giocatore con lo stesso nome, mostra un avviso all'utente
                alert('Il nome inserito è già in uso. Si prega di sceglierne un altro.');
            } else {
                // Se il nome è unico, salvalo e procedi
                playerName = playerNameInput;
                storedPlayerName = playerNameInput;
                // Salva il nome giocatore nel cookie insieme all'ID utente
                setCookie('playerName', playerName, 365); // Memorizza il nome giocatore per 365 giorni
                startTimer();
                // Rimuovi il messaggio di benvenuto
                document.body.removeChild(messageContainer);
                console.log("Nome giocatore:", playerName);
            }
        } else {
            // Mostra un avviso se il campo del nome è vuoto
            alert('Inserisci il tuo nome giocatore prima di continuare.');
            console.log("Nome giocatore non valido");
        }
    };
    
    
    messageContainer.appendChild(continueButton);

    document.body.appendChild(messageContainer);
};

// Funzione per ottenere l'ultimo round giocato
const getLastLevelNumberFromFirestore = async () => {
    try {
      const user = auth.currentUser;
      const participantId = user ? user.uid : getOrGenerateUserId();
  
      const participantDocRef = doc(levelsDataRef, participantId);
      const participantData = (await getDoc(participantDocRef)).data() || {};
  
      let lastLevelNumber = 0;
  
      // Itera su tutte le chiavi per trovare il round più alto
      Object.keys(participantData).forEach((levelKey) => {
        const levelNumber = parseInt(levelKey.replace('level', ''), 10);
        if (levelNumber > lastLevelNumber) {
            lastLevelNumber = levelNumber;
        }
      });
  
      return lastLevelNumber;
    } catch (error) {
      console.error('Error getting last level number from Firestore: ', error.message);
      return 1; // Ritorna il round 1 in caso di errore
    }
};
// Funzione per ottenere l'ultimo punteggio 
const getLastPointsFromFirestore = async () => {
    try {
      const user = auth.currentUser;
      const participantId = user ? user.uid : getOrGenerateUserId();
  
      const participantDocRef = doc(levelsDataRef, participantId);
      const participantData = (await getDoc(participantDocRef)).data() || {};
  
      let lastLevelNumber = 0;
  
      // Itera su tutte le chiavi per trovare il round più alto
      Object.keys(participantData).forEach((levelKey) => {
        const levelNumber = parseInt(levelKey.replace('level', ''), 10);
        if (levelNumber > lastLevelNumber) {
            lastLevelNumber = levelNumber;
        }
      });
  
      return lastLevelNumber;
    } catch (error) {
      console.error('Error getting last level number from Firestore: ', error.message);
      return 1; // Ritorna il round 1 in caso di errore
    }
};

// Funzione per caricare il livello corrente
function caricaLivello(livello) {
    // Reimposta il tempo rimanente a 60 secondi
    timeLeft = 60;
    
    // Resetta il punteggio all'inizio di ogni nuovo livello
    punteggio = 0;

    // Resetta il costo totale all'inizio di ogni nuovo livello
    totalCost = 0;    
    const binContainers = document.querySelectorAll('.container-bins');
    const itemContainers = document.querySelectorAll('.container-items');

    // Nascondi tutti i contenitori di bin e di item
    binContainers.forEach(container => {
        container.classList.add('hidden');
    });
    itemContainers.forEach(container => {
        container.classList.add('hidden');
    });

    // Mostra solo i contenitori corrispondenti al livello corrente
    const currentBinContainer = document.querySelector('.container-bins.level-' + livello);
    const currentItemContainer = document.querySelector('.container-items.level-' + livello);
    
    if (currentBinContainer && currentItemContainer) {
        currentBinContainer.classList.remove('hidden');
        currentItemContainer.classList.remove('hidden');
    } else {
        console.error("I contenitori del livello", livello, "non sono stati trovati.");
    }
}

// Funzione per riordinare gli item in base all'altezza (ordine decrescente) e all'ID (ordine crescente)
function sortItemsByHeight(level) {
    const container = document.querySelector('.container-items.level-' + level);
    const itemsArray = Array.from(container.children);
    itemsArray.sort((a, b) => {
        const heightA = parseInt(a.style.getPropertyValue("--height"));
        const heightB = parseInt(b.style.getPropertyValue("--height"));
        if (heightA === heightB) {
            return parseInt(a.id.slice(4)) - parseInt(b.id.slice(4)); // Ordine crescente per ID
        }
        return heightB - heightA; // Ordine decrescente per altezza
    });
    container.innerHTML = "";
    itemsArray.forEach(item => container.appendChild(item));
}


// Funzione per aggiornare la capacità rimanente nel bin
function updateCapacityLeft(bin) {
    const binCapacity = parseInt(bin.style.getPropertyValue("--capacity")); // Capacità totale del bin
    let totalItemHeight = 0; // Altezza totale degli item nel bin

    // Calcola l'altezza totale degli item nel bin
    Array.from(bin.children).forEach(child => {
        if (child.classList.contains("item")) {
            totalItemHeight += parseInt(child.style.getPropertyValue("--height"));
        }
    });

    // Calcola la capacità rimanente nel bin
    const capacityLeft = binCapacity - totalItemHeight;

    // Seleziona il paragrafo con la classe 'capacity-left' associato al bin
    const capacityLeftParagraph = bin.parentElement.querySelector(".capacity-left");

    // Aggiorna il testo del paragrafo con la capacità rimanente
    capacityLeftParagraph.textContent = "Capacity left: " + capacityLeft;
}




// Funzione per aggiornare il punteggio e la classifica
async function aggiornaPunteggio() {
    // Estrai il valore numerico da totalCost e convertilo in un numero
    const costo = parseFloat(document.getElementById("totalCost").innerText.replace("Costo totale: £", ""));

    // Calcola il punteggio basato sul costo
    let punteggioCosto = 100 + Math.round(1000 / costo);
    
    // Calcola il tempo trascorso dall'inizio del livello
    const tempoTrascorso = maxTempo - timeLeft;

    // Calcola il punteggio basato sul tempo impiegato
    const punteggioTempo = Math.round(maxPunteggioTempo - (maxPunteggioTempo / maxTempo) * tempoTrascorso);

    // Calcola il punteggio totale sommando il punteggio basato sul costo e il punteggio basato sul tempo
    punteggio = punteggioCosto + punteggioTempo;
    punteggioTotale += punteggio;

    // // Aggiorna la classifica con il punteggio e il nome del giocatore
    // const indexGiocatore = classifica.findIndex(giocatore => giocatore.nome === playerName);

    // if (indexGiocatore !== -1) {
    //     // Se il giocatore è già presente, aggiorna il suo punteggio
    //     classifica[indexGiocatore].punteggio = punteggioTotale;
    // } else {
    //     // Se il giocatore non è presente, aggiungi una nuova riga nella classifica
    //     classifica.push({ nome: playerName, punteggio: punteggioTotale });
    // }

    // // Ordina la classifica in ordine decrescente di punteggio
    // classifica.sort((a, b) => b.punteggio - a.punteggio);

    // Aggiungi i dati del round a Firestore
    const totalCost = parseFloat(document.getElementById("totalCost").innerText.replace("Costo totale: £", ""));
    await addLevelDataToFirestore(livelloCorrente, totalCost, punteggioTotale, tempoTrascorso);

    // Chiamata per salvare il punteggio totale nel ranking
    await salvaPunteggioTotaleNelRanking(punteggioTotale);

    // Aggiorna l'interfaccia grafica con il nuovo punteggio e la classifica
    await aggiornaInterfacciaGrafica();

    // Chiama la funzione showOrderConfirmationMessage per mostrare il messaggio di completamento del livello
    showOrderConfirmationMessage(livelloCorrente, punteggio);

}


// Funzione per aggiornare l'interfaccia grafica con il punteggio e la classifica
async function aggiornaInterfacciaGrafica() {
    // Aggiorna il punteggio visualizzato
    document.getElementById("punteggio").innerText = "Punteggio: " + punteggio;

    try {
        // Ottieni i dati per il livello corrente dal database ranking
        const data = await getAllDataFromRanking(livelloCorrente);

        // Converti i dati in un array di coppie chiave-valore
        const playerEntries = Object.entries(data);

        // Ordina l'array in base al punteggio in ordine decrescente
        playerEntries.sort((a, b) => b[1].scoreForLevel - a[1].scoreForLevel);

        // Creazione di un array temporaneo per memorizzare gli elementi
        const listItems = [];
        let punteggiolev; // Dichiarazione di punteggiolev fuori dal blocco if

        playerEntries.forEach(([playerName, playerData], index) => {
            const listItem = document.createElement("li");
            if (playerData.scoreForLevel !== 0) {
                listItem.innerText = `${index + 1}. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                    playerRank = index + 1;
                    punteggiolev = playerData.scoreForLevel; 
                }
            } else {
                listItem.innerText = `${"N/C"}. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                    playerRank = "N/C";
                    punteggiolev = playerData.scoreForLevel; 
                }
            }
            // Aggiungi l'elemento alla lista temporanea
            listItems.push(listItem);
        });
        
        const topTenListItems = listItems.slice(0, 10);

        // Se il giocatore attuale non è tra i primi 10, aggiungi una riga aggiuntiva
        if (playerRank > 10 || playerRank === "N/C") {
            const additionalListItem = document.createElement("li");
            additionalListItem.innerText = `${playerRank}. ${storedPlayerName}: ${punteggiolev}`;
            additionalListItem.classList.add("highlighted");
            topTenListItems.push(additionalListItem); // Inserisci l'elemento dopo il 10°
        }

        // Una volta completato il ciclo, aggiungiamo tutti gli elementi <li> all'elemento classificaElement
        const classificaElement = document.getElementById("classifica");
        classificaElement.innerText = `<strong>Top ten dopo il livello ${livelloCorrente}</strong>`;
        classificaElement.innerHTML = "";
        topTenListItems.forEach(listItem => {
            classificaElement.appendChild(listItem);
        });
        

    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'interfaccia grafica:', error.message);
    }
}

// Funzione per aggiornare l'interfaccia grafica con il punteggio e la classifica
async function aggiornaInterfacciaGraficaPrec() {
    // Aggiorna il punteggio visualizzato
    document.getElementById("punteggio").innerText = "Punteggio: " + punteggio;

    try {
        // Ottieni i dati per il livello corrente dal database ranking
        const data = await getAllDataFromRanking(lastLevelNumber);

        // Converti i dati in un array di coppie chiave-valore
        const playerEntries = Object.entries(data);
        // Ordina l'array in base al punteggio in ordine decrescente
        playerEntries.sort((a, b) => b[1].scoreForLevel - a[1].scoreForLevel);

        // Creazione di un array temporaneo per memorizzare gli elementi
        const listItems = [];
        let punteggiolev; // Dichiarazione di punteggiolev fuori dal blocco if

        playerEntries.forEach(([playerName, playerData], index) => {
            const listItem = document.createElement("li");
            if (playerData.scoreForLevel !== 0) {
                listItem.innerText = `${index + 1}. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                    playerRank = index + 1;
                    punteggiolev = playerData.scoreForLevel; 
                }
            } else {
                listItem.innerText = `${"N/C"}. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                    playerRank = "N/C";
                    punteggiolev = playerData.scoreForLevel; 
                }
            }
            // Aggiungi l'elemento alla lista temporanea
            listItems.push(listItem);
        });
        
        const topTenListItems = listItems.slice(0, 10);

        // Se il giocatore attuale non è tra i primi 10, aggiungi una riga aggiuntiva
        if (playerRank > 10 || playerRank === "N/C") {
            const additionalListItem = document.createElement("li");
            additionalListItem.innerText = `${playerRank}. ${storedPlayerName}: ${punteggiolev}`;
            additionalListItem.classList.add("highlighted");
            topTenListItems.push(additionalListItem); // Inserisci l'elemento dopo il 10°
        }


        // Una volta completato il ciclo, aggiungiamo tutti gli elementi <li> all'elemento classificaElement
        const classificaElement = document.getElementById("classifica");
        classificaElement.innerText = `<strong>Top ten dopo il livello ${livelloCorrente}</strong>`;
        classificaElement.innerHTML = "";
        topTenListItems.forEach(listItem => {
            classificaElement.appendChild(listItem);
        });


    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'interfaccia grafica:', error.message);
    }
}

// Funzione per aggiungere i dati del round a Firestore e sommare i punteggi totali
const addLevelDataToFirestore = async (levelNumber, totalCost, points, tempoTrascorso) => {
    try {
        // Ottenere l'ID del partecipante anonimo (se presente)
        const user = auth.currentUser;
        const participantId = user ? user.uid : getOrGenerateUserId();

        // Ottieni o crea un riferimento al documento del partecipante
        const participantDocRef = doc(levelsDataRef, participantId);

        // Ottieni i dati del partecipante
        const participantData = (await getDoc(participantDocRef)).data() || {};
        
        // Aggiungi i dati del round al documento del partecipante
        participantData[`level${levelNumber}`] = {
            totalCost,
            points,
            tempoTrascorso,
        };

        // Somma i punteggi totali
        const totalPoints = Object.values(participantData).reduce((accumulator, currentValue) => {
            if (currentValue.points) {
                return accumulator + currentValue.points;
            }
            return accumulator;
        }, 0);

        // Aggiungi il punteggio totale al documento del partecipante
        participantData.totalPoints = totalPoints;

        // Aggiorna il documento del partecipante con i nuovi dati
        await setDoc(participantDocRef, participantData);

        console.log('Round added for participant', participantId, 'for round', levelNumber);
        
    } catch (error) {
        console.error('Error adding round to Firestore: ', error.message);
        
    }
};

const salvaPunteggioTotaleNelRanking = async (punteggioTotale) => {
    try {
        // Ottieni o crea un riferimento al documento del partecipante
        const rankingDocRef = doc(rankingRef, playerName);
    
        // Ottieni i dati del partecipante
        const rankingData = (await getDoc(rankingDocRef)).data() || {};
        
        // Aggiungi i dati del round al documento del partecipante
        rankingData[`level${livelloCorrente}`] = punteggioTotale;
        console.log(rankingData);
    
        // Aggiorna il documento del partecipante con i nuovi dati
        await setDoc(rankingDocRef, rankingData);

        console.log('Total score saved in ranking for player', playerName, 'for level', livelloCorrente);
    } catch (error) {
        console.error('Error saving total score in ranking: ', error.message);
    }
};
  
const getAllDataFromRanking = async (livelloCorrente) => {
    try {
        const snapshot = await getDocs(rankingRef);
        const dataForLevel = [];
        snapshot.forEach(doc => {
            const playerName = doc.id;
            const playerData = doc.data();
            const scoreForLevel = playerData[`level${livelloCorrente}`] || 0; // Assume 0 se il livello non ha dati
            dataForLevel.push({ playerName, scoreForLevel });
        });
        return dataForLevel;
    } catch (error) {
        console.error('Errore nel recupero dei dati dal database rankingRef: ', error.message);
        return [];
    }
};




// Funzione per ottenere tutti i dati dei punti da Firestore e sommarli
const getAllPointsDataFromFirestore = async () => {
    try {
        const user = auth.currentUser;
        const participantId = user ? user.uid : getOrGenerateUserId();

        const participantDocRef = doc(levelsDataRef, participantId);
        const participantData = (await getDoc(participantDocRef)).data() || {};

        // Estrai i dati dei round e ordina in base al numero di round
        const levels = Object.entries(participantData)
            .filter(([key]) => key.startsWith('level'))
            .sort((a, b) => parseInt(a[0].replace('level', '')) - parseInt(b[0].replace('level', '')))
            .map(([key, value]) => value);

        // Somma i valori del punteggio
        const totalPoints = levels.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.points;
        }, 0);

        return totalPoints;

    } catch (error) {
        console.error('Error getting points data from Firestore: ', error.message);
        return null;
    }
};

const showOrderConfirmationMessage = async (livello, punteggio) => {

    // Aggiorniamo il testo del costo totale visualizzato a schermo
    document.getElementById("totalCost").innerText = "Costo totale: £" + totalCost.toFixed(2);

    // Aggiorna l'interfaccia grafica
    await aggiornaInterfacciaGrafica();
    successSound.play();

    // Creare un elemento div per il messaggio
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `Livello ${livello} completato!<br>Punteggio ottenuto: ${punteggio}.<br>Posizione in classifica: ${playerRank}`;
    messageContainer.className = 'completion-message'; // Aggiungi una classe per lo stile CSS

    // Stili per rendere il messaggio più grande e con gli spigoli arrotondati
    // Imposta la larghezza al 100% della larghezza della finestra visualizzata (viewport width)
    messageContainer.style.width = '100vw';
    // Imposta l'altezza al 100% dell'altezza della finestra visualizzata (viewport height)
    messageContainer.style.height = '100vh';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.display = 'flex'; // Utilizzo del flexbox
    messageContainer.style.flexDirection = 'column'; // Imposta la direzione del flexbox su colonna
    messageContainer.style.justifyContent = 'center'; // Centra verticalmente
    messageContainer.style.alignItems = 'center'; // Centra orizzontalmente
    messageContainer.style.animation = 'fadeInOut 1s ease-in-out forwards';


    // Imposta stili per centrare il messaggio e posizionarlo al centro della pagina
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.backgroundColor = '#4CAF50'; // Sfondo verde (puoi cambiare il colore)
    messageContainer.style.color = '#fff'; // Testo bianco
    messageContainer.style.padding = '20px'; // Spaziatura interna

    // Stili per centrare verticalmente e far andare a capo il testo
    messageContainer.style.textAlign = 'center';
    messageContainer.style.lineHeight = '1.5';

    // Aggiungi un elemento di riga di distacco
    const lineBreak = document.createElement('br');
    messageContainer.appendChild(lineBreak);

    // Aggiungi il pulsante "Procedi al prossimo livello"
    const nextLevelButton = document.createElement('button');
    nextLevelButton.textContent = 'Procedi al prossimo livello';
    nextLevelButton.style.marginTop = '30px'; // Aggiungi uno spazio verticale sopra al pulsante
    // Aggiungi stili al pulsante "nextLevel"
    nextLevelButton.style.padding = '10px 20px';
    nextLevelButton.style.borderRadius = '5px';
    nextLevelButton.style.border = 'none';
    nextLevelButton.style.backgroundColor = '#008CBA'; // Background color for the button
    nextLevelButton.style.color = 'white'; // Text color for the button

    nextLevelButton.onclick = async () => {
        document.body.removeChild(messageContainer);
        if (livelloCorrente < ultimoLivello) {
            // Passa al livello successivo
            livelloCorrente++;

            // Nascondi gli elementi del livello precedente solo se esistono
            const livelloPrecedente = document.querySelector('.container-items.level-' + (livelloCorrente - 1));
            if (livelloPrecedente) {
                livelloPrecedente.classList.add('hidden');
            }

            // Mostra gli elementi del livello successivo
            document.querySelector('.container-items.level-' + livelloCorrente).classList.remove('hidden');

            // Resetta il punteggio all'inizio di ogni nuovo livello
            punteggio = 0;

            // Resetta il costo totale all'inizio di ogni nuovo livello
            totalCost = 0;
            // Aggiorniamo il testo del costo totale visualizzato a schermo
            document.getElementById("totalCost").innerText = "Costo totale: £" + totalCost.toFixed(2);
            // Aggiorna il punteggio visualizzato
            document.getElementById("punteggio").innerText = "Punteggio: " + punteggio;

            calcolaPunteggioButton.disabled = true;

            caricaLivello(livelloCorrente);
            startTimer();         
        } else {
            showEndGameMessage();
        };
    };
    // Aggiungi il pulsante al messaggio
    messageContainer.appendChild(nextLevelButton);

    // Aggiungi l'elemento al tuo corpo HTML o a un contenitore specifico
    document.body.appendChild(messageContainer);

};

const showEndGameMessage = async () => {
    try {
        stopTimer();
        successSound.play();

        // Creare un elemento div per il messaggio
        const messageContainer = document.createElement('div');
        messageContainer.innerHTML = `Game completato!`;
        messageContainer.className = 'completion-message'; // Aggiungi una classe per lo stile CSS

        // Stili per rendere il messaggio più grande e con gli spigoli arrotondati
        // Imposta la larghezza al 100% della larghezza della finestra visualizzata (viewport width)
        messageContainer.style.width = '100vw';
        // Imposta l'altezza al 100% dell'altezza della finestra visualizzata (viewport height)
        messageContainer.style.height = '100vh';
        messageContainer.style.borderRadius = '10px';
        messageContainer.style.display = 'flex'; // Utilizzo del flexbox
        messageContainer.style.flexDirection = 'column'; // Imposta la direzione del flexbox su colonna
        messageContainer.style.justifyContent = 'center'; // Centra verticalmente
        messageContainer.style.alignItems = 'center'; // Centra orizzontalmente

        // Imposta stili per centrare il messaggio e posizionarlo al centro della pagina
        messageContainer.style.position = 'fixed';
        messageContainer.style.top = '50%';
        messageContainer.style.left = '50%';
        messageContainer.style.transform = 'translate(-50%, -50%)';
        messageContainer.style.backgroundColor = '#4CAF50'; // Sfondo verde (puoi cambiare il colore)
        messageContainer.style.color = '#fff'; // Testo bianco
        messageContainer.style.padding = '20px'; // Spaziatura interna

        // Stili per centrare verticalmente e far andare a capo il testo
        messageContainer.style.textAlign = 'center';
        messageContainer.style.lineHeight = '1.5';

        // Aggiungi un elemento di riga di distacco
        const lineBreak = document.createElement('br');
        messageContainer.appendChild(lineBreak);

        // Ottieni i dati per il livello corrente dal database ranking
        const data = await getAllDataFromRanking(ultimoLivello);

        // Converti i dati in un array di coppie chiave-valore
        const playerEntries = Object.entries(data);

        // Ordina l'array in base al punteggio in ordine decrescente
        playerEntries.sort((a, b) => b[1].scoreForLevel - a[1].scoreForLevel);

        // Creazione di un array temporaneo per memorizzare gli elementi
        const listContainer = document.createElement('div');

        playerEntries.forEach(([playerName, playerData], index) => {
            const listItem = document.createElement("li");
            if (playerData.scoreForLevel !== 0) {
                listItem.innerText = `${index + 1}. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                }
            } else {
                listItem.innerText = `N/C. ${playerData.playerName}: ${playerData.scoreForLevel}`;

                // Evidenzia la riga corrispondente al giocatore attuale
                if (playerData.playerName === storedPlayerName) {
                    listItem.classList.add("highlighted");
                    playerRank = "N/C";
                }
            }
            // Aggiungi l'elemento alla lista temporanea
            listContainer.appendChild(listItem);
        });

        
        // // Aggiorna la classifica visualizzata
        // const finalRankingElement = document.createElement('ol');
        // finalRankingElement.appendChild(listContainer);

        messageContainer.appendChild(listContainer);
    
        // Aggiungi il messaggio al corpo del documento
        document.body.appendChild(messageContainer);
        


    } catch (error) {
        console.error('Error showing end game message:', error.message);
        // Gestisci eventuali errori nel mostrare il messaggio di fine gioco
    }
};



const showEndTimeMessage = async (livello) => {
    failureSound.play();

    // Creare un elemento div per il messaggio
    const messageContainer = document.createElement('div');
    messageContainer.innerHTML = `Timer completato!<br>Punteggio ottenuto: 0`;
    messageContainer.className = 'completion-message'; // Aggiungi una classe per lo stile CSS

        // Stili per rendere il messaggio più grande e con gli spigoli arrotondati
    // Imposta la larghezza al 100% della larghezza della finestra visualizzata (viewport width)
    messageContainer.style.width = '100vw';
    // Imposta l'altezza al 100% dell'altezza della finestra visualizzata (viewport height)
    messageContainer.style.height = '100vh';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.display = 'flex'; // Utilizzo del flexbox
    messageContainer.style.flexDirection = 'column'; // Imposta la direzione del flexbox su colonna
    messageContainer.style.justifyContent = 'center'; // Centra verticalmente
    messageContainer.style.alignItems = 'center'; // Centra orizzontalmente

    // Imposta stili per centrare il messaggio e posizionarlo al centro della pagina
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.backgroundColor = '#4CAF50'; // Sfondo verde (puoi cambiare il colore)
    messageContainer.style.color = '#fff'; // Testo bianco
    messageContainer.style.padding = '20px'; // Spaziatura interna

    // Stili per centrare verticalmente e far andare a capo il testo
    messageContainer.style.textAlign = 'center';
    messageContainer.style.lineHeight = '1.5';

    // Aggiungi un elemento di riga di distacco
    const lineBreak = document.createElement('br');
    messageContainer.appendChild(lineBreak);

    // Aggiungi il pulsante "Procedi al prossimo livello"
    const nextLevelButton = document.createElement('button');
    nextLevelButton.textContent = 'Procedi al prossimo livello';
    nextLevelButton.style.marginTop = '30px'; // Aggiungi uno spazio verticale sopra al pulsante

    // Aggiungi stili al pulsante "Continua"
    nextLevelButton.style.padding = '10px 20px';
    nextLevelButton.style.borderRadius = '5px';
    nextLevelButton.style.border = 'none';
    nextLevelButton.style.backgroundColor = '#008CBA'; // Background color for the button
    nextLevelButton.style.color = 'white'; // Text color for the button

    
    nextLevelButton.onclick = () => {
        document.body.removeChild(messageContainer);
        // Verifica se siamo all'ultimo livello
        if (livelloCorrente < ultimoLivello) {
            // Passa al livello successivo
            livelloCorrente++;
    
            // Nascondi gli elementi del livello precedente solo se esistono
            const livelloPrecedente = document.querySelector('.container-items.level-' + (livelloCorrente - 1));
            if (livelloPrecedente) {
                livelloPrecedente.classList.add('hidden');
            }
    
            // Mostra gli elementi del livello successivo
            document.querySelector('.container-items.level-' + livelloCorrente).classList.remove('hidden');
    
            // Resetta il punteggio all'inizio di ogni nuovo livello
            punteggio = 0;
    
            // Resetta il costo totale all'inizio di ogni nuovo livello
            totalCost = 0;
            
            calcolaPunteggioButton.disabled = true;
    
            caricaLivello(livelloCorrente);
    
            startTimer();
        } else {
            // Se siamo all'ultimo livello, gestisci come preferisci l'azione del pulsante
            showEndGameMessage();
        }
    };
    
    // Aggiungi il pulsante al messaggio
    messageContainer.appendChild(nextLevelButton);

    // Aggiungi l'elemento al tuo corpo HTML o a un contenitore specifico
    document.body.appendChild(messageContainer);

    punteggio = 0;
    totalCost = parseFloat(document.getElementById("totalCost").innerText.replace("Costo totale: £", ""));
    
    // Calcola il tempo trascorso dall'inizio del livello
    const tempoTrascorso = maxTempo - timeLeft;

    // Chiamata per salvare il punteggio totale nel ranking
    await salvaPunteggioTotaleNelRanking(punteggioTotale);
    addLevelDataToFirestore(livelloCorrente, totalCost, punteggio, tempoTrascorso);

    // Aggiorna l'interfaccia grafica
    await aggiornaInterfacciaGrafica();
};

// Funzione per mostrare un messaggio di superamento della capacità del bin
const showCapacityExceededMessage = (bin) => {
    errorSound.play();

    // Creare un elemento div per il messaggio
    const messageContainer = document.createElement('div');
    messageContainer.textContent = `Superata la capacità del bin!`;
    messageContainer.className = 'capacity-exceeded-message'; // Aggiungi una classe per lo stile CSS

    // Imposta stili per centrare il messaggio e posizionarlo al centro del bin
    messageContainer.style.position = 'absolute';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)';
    messageContainer.style.backgroundColor = '#ff0000'; // Sfondo rosso (puoi cambiare il colore)
    messageContainer.style.color = '#fff'; // Testo bianco
    messageContainer.style.padding = '10px'; // Spaziatura interna

    // Aggiungi l'elemento al bin
    bin.appendChild(messageContainer);

    // Imposta un timeout per nascondere il messaggio dopo 2 secondi
    setTimeout(() => {
        // Rimuovi l'elemento dopo il timeout
        bin.removeChild(messageContainer);
    }, 1500); // Tempo in millisecondi (1,5 secondi nel nostro esempio)
};

// Funzione per verificare se tutti gli item del livello corrente sono stati posizionati
function checkAllItemsPlaced() {
    const allItems = document.querySelectorAll(".container-items.level-" + livelloCorrente + " .item");
    const allBins = document.querySelectorAll(".container-bins.level-" + livelloCorrente + " .bin");
    let placedItemsCount = 0;

    allItems.forEach(item => {
        if (item.parentNode.classList.contains("bin")) {
            placedItemsCount++;
        }
    });

    // Abilita il pulsante se tutti gli item del livello corrente sono stati posizionati
    if (placedItemsCount === allItems.length) {
        allItemsPlaced = true;
        calcolaPunteggioButton.disabled = false;
    } else {
        allItemsPlaced = false;
        calcolaPunteggioButton.disabled = true;
    }
}
  
// Al caricamento della pagina, esegui l'autenticazione anonima e ottieni o genera l'identificatore utente persistente
window.onload = async () => {
    try {
        await signInAnonymously(auth);
        const userId = getOrGenerateUserId();
        console.log("Authenticated anonymously with UID:", userId);
        
        // Controlla se hai già il nome giocatore associato all'ID utente
        storedPlayerName = getCookie('playerName');
        if (storedPlayerName) {
            playerName = storedPlayerName;
            console.log("Nome giocatore:", playerName);
            
            startTimer();
        } else {
            // Chiedi il nome giocatore solo se non è già stato memorizzato
            askPlayerName();
        }
        // Ottieni l'ultimo livello giocato dal Firestore
        lastLevelNumber = await getLastLevelNumberFromFirestore();
        livelloCorrente = lastLevelNumber+1;
        if (lastLevelNumber == ultimoLivello) {
            // Ottieni i dati per la classifica finale dal database ranking
            showEndGameMessage();
        } else {
            await caricaLivello(livelloCorrente);
            // Verifica se tutti gli item sono stati posizionati
            checkAllItemsPlaced();
            // Aggiorna l'interfaccia grafica dopo aver caricato il livello e verificato gli item posizionati
            await aggiornaInterfacciaGraficaPrec();

            // Dopo aver completato il primo livello, mostra l'elemento della classifica
            if (livelloCorrente > 1) {
                document.getElementById('classifica').style.display = 'block';
            }
            punteggioTotale = await getAllPointsDataFromFirestore();
        }
        // Ora puoi utilizzare userId e currentRound nelle tue operazioni Firebase
        } catch (error) {
        console.error("Error authenticating anonymously:", error);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    const bins = document.querySelectorAll(".bin");
    const items = document.querySelectorAll(".item");
    // Disabilita il pulsante all'inizio
    calcolaPunteggioButton.disabled = true;

    // Variabile per tenere traccia dello stato di tutti gli item posizionati
    allItemsPlaced = false;
    
    // Aggiunta dell'evento click al pulsante per calcolare il punteggio
    calcolaPunteggioButton.addEventListener("click", function() {
        // Ferma il timer
        stopTimer();
        // Aggiorna il punteggio
        aggiornaPunteggio();
        // Dopo aver caricato il primo livello, mostra l'elemento della classifica
        document.getElementById('classifica').style.display = 'block';
    });

    // Carica il primo livello all'avvio del gioco
    caricaLivello(livelloCorrente);

    // Inizializza la "Capacity left" per ogni bin
    bins.forEach(bin => {
        const capacity = parseInt(bin.style.getPropertyValue("--capacity"));
        const capacityLeftElement = bin.parentElement.querySelector('.capacity-left');
        capacityLeftElement.textContent = "Capacity left: " + capacity;
    });
    
    items.forEach(item => {
        const height = parseInt(item.style.getPropertyValue("--height"));
        item.classList.add('height-' + height);
    });
    totalCost = 0;
    let binsUsed = {}; // Oggetto per tenere traccia dei bin utilizzati e del numero di item al loro interno
    let initialPosition = {}; // Oggetto per memorizzare la posizione iniziale degli item

    function handleDragStart(event) {
        event.dataTransfer.setData("text/plain", event.target.id);
    }

    items.forEach(item => {
        item.setAttribute("draggable", "true");
        item.addEventListener("dragstart", handleDragStart);
        initialPosition[item.id] = item.parentNode; // Memorizza la posizione iniziale dell'item

    
        // Aggiungiamo un event listener per il click
        item.addEventListener("click", function(event) {
            // Trova il bin genitore dell'item
            const bin = item.closest(".bin");
            
            // Se l'item è dentro un bin...
            if (bin) {
                // ...rimuovilo dal bin e posizionalo al di fuori dei bins
                document.body.appendChild(item);
                // Aggiorna il numero di item nel bin
                binsUsed[bin.id]--;
                
                // Ottieni la capacità del bin
                const capacity = parseInt(bin.style.getPropertyValue("--capacity"));
                // Aggiorna la capacità rimanente nel bin
                updateCapacityLeft(bin);

                // Controlla se il numero di item nel bin è diventato zero e aggiorna il costo totale se necessario
                if (binsUsed[bin.id] === 0) {
                    const cost = parseInt(bin.dataset.cost);
                    totalCost -= cost;
                    document.getElementById("totalCost").innerText = "Costo totale: £" + totalCost.toFixed(2);
                    bin.classList.remove('in-use');
                    const infoParagraph = bin.parentElement.querySelector(".info");
                    infoParagraph.style.fontWeight = "normal";

                }
                
                console.log("Numero di item associati ai bin:", binsUsed);
                // Riposiziona l'elemento al suo genitore iniziale
                const initialParent = initialPosition[item.id];
                initialParent.appendChild(item);
                sortItemsByHeight(livelloCorrente); // Riordina gli item per altezza
                
                // Controlla se tutti gli item sono stati posizionati
                checkAllItemsPlaced();
            }
        });
    });
    
    bins.forEach(bin => {
        bin.addEventListener("dragover", function(event) {
            event.preventDefault();
        });

        bin.addEventListener("drop", function(event) {
            event.preventDefault();
            const itemID = event.dataTransfer.getData("text/plain");
            const item = document.getElementById(itemID);
            
            // Trova il bin genitore dell'elemento prima del drop
            const previousBin = item.closest(".bin");

            // Rimuovi l'elemento dal bin precedente solo se è stato trovato
            if (previousBin && item.parentNode === previousBin) {
                previousBin.removeChild(item);

                // Aggiorna i conteggi e la visualizzazione per il bin precedente
                binsUsed[previousBin.id]--;
                updateCapacityLeft(previousBin);
                checkAllItemsPlaced();

                // Rimuovi la classe CSS che evidenzia il bin se non ci sono più item al suo interno
                if (binsUsed[previousBin.id] === 0) {
                    const cost = parseInt(previousBin.dataset.cost);
                    totalCost -= cost;
                    document.getElementById("totalCost").innerText = "Costo totale: £" + totalCost.toFixed(2);
                    previousBin.classList.remove('in-use');
                    const infoParagraph = previousBin.parentElement.querySelector(".info");
                    infoParagraph.style.fontWeight = "normal"; // Rimuovi il testo in grassetto
                }
            }



            // Calcola la somma delle altezze degli item nel bin
            let totalHeight = Array.from(bin.children).reduce((acc, child) => {
                if (child.classList.contains("item")) {
                    return acc + parseInt(child.style.getPropertyValue("--height"));
                }
                return acc;
            }, 0);
    
            // Aggiungi l'altezza dell'item che stai spostando
            totalHeight += parseInt(item.style.getPropertyValue("--height"));
    
            // Ottieni la capacità del bin
            const capacity = parseInt(bin.style.getPropertyValue("--capacity"));

            // Confronta la somma delle altezze con la capacità del bin
            if (totalHeight <= capacity) {
                bin.appendChild(item);
                // Make items draggable within bins
                item.addEventListener("dragstart", handleDragStart);
    
                // Aggiungi il costo del bin al costo totale solo se il bin non è stato già utilizzato
                if (!binsUsed[bin.id]) {
                    const cost = parseInt(bin.dataset.cost);
                    totalCost += cost;
                    binsUsed[bin.id] = 1;
                    document.getElementById("totalCost").innerText = "Costo totale: £" + totalCost.toFixed(2);
                    bin.classList.add('in-use');
                    const infoParagraph = bin.parentElement.querySelector(".info");
                    infoParagraph.style.fontWeight = "bold"; // Imposta il testo in grassetto

                } else {
                    // Aggiorna il numero di item nel bin
                    binsUsed[bin.id]++;
                }
            
            // Aggiorna la capacità rimanente nel bin
            updateCapacityLeft(bin);
        
            } else {
                showCapacityExceededMessage(bin);
            }
            
            console.log("Numero di item associati ai bin:", binsUsed);
            // Controlla se tutti gli item sono stati posizionati
            checkAllItemsPlaced();
        });

        // Enable dragging items out of bins
        bin.addEventListener("dragstart", function(event) {
            if (event.target.classList.contains("item")) {
                event.dataTransfer.setData("text/plain", event.target.id);
            }
        });

        // Inizializza il contatore di item nel bin a zero
        binsUsed[bin.id] = 0;
    });

    // Settiamo un attributo data-item-id per ogni bin
    bins.forEach(bin => {
        bin.setAttribute("data-item-id", bin.id);
    });

});