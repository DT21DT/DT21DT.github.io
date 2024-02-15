// Definisci una funzione per inviare una richiesta POST alla tua funzione Cloud
function sendRequest() {
    var numbers = [1, 2, 3];  // Esempio di dati da inviare

    // Crea un oggetto con i dati da inviare
    var requestData = {
        numbers: numbers
    };

    // Effettua una richiesta POST alla tua funzione Cloud
    fetch('https://europe-west2-binpacking-414323.cloudfunctions.net/hello_http', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        // Gestisci la risposta dalla tua funzione Cloud
        console.log(data);
    })
    .catch(error => {
        console.error('Errore durante la richiesta:', error);
    });
}

// Chiamare la funzione sendRequest quando si verifica un evento, ad esempio al clic di un pulsante
document.getElementById('call-cloud-function').addEventListener('click', sendRequest);


document.addEventListener("DOMContentLoaded", function() {
    const bins = document.querySelectorAll(".bin");
    const items = document.querySelectorAll(".item");
    let totalCost = 0;
    let binsUsed = {}; // Oggetto per tenere traccia dei bin utilizzati e del numero di item al loro interno

    function handleDragStart(event) {
        event.dataTransfer.setData("text/plain", event.target.id);
    }

    items.forEach(item => {
        item.setAttribute("draggable", "true");
        item.addEventListener("dragstart", handleDragStart);
    
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
                // Controlla se il numero di item nel bin è diventato zero e aggiorna il costo totale se necessario
                if (binsUsed[bin.id] === 0) {
                    const cost = parseInt(bin.dataset.cost);
                    totalCost -= cost;
                    document.getElementById("totalCost").innerText = "Costo totale: $" + totalCost.toFixed(2);
                }
            }
            console.log("Numero di item associati ai bin:", binsUsed);
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
                    document.getElementById("totalCost").innerText = "Costo totale: $" + totalCost.toFixed(2);
                } else {
                    // Aggiorna il numero di item nel bin
                    binsUsed[bin.id]++;
                }
            } else {
                alert("Superata la capacità del bin!");
            }
    
            console.log("Numero di item associati ai bin:", binsUsed);
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
