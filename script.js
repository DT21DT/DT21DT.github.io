document.addEventListener('DOMContentLoaded', function() {
    const bins = document.querySelectorAll('.bins-container');
    const items = document.querySelectorAll('.item');
    
    bins.forEach(bin => {
        bin.currentCapacity = 0;
        bin.totalCost = 0;
        bin.addEventListener('dragover', dragOver);
        bin.addEventListener('drop', drop);
    });

    items.forEach(item => {
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragend', dragEnd);
    });

    function dragStart(event) {
        event.dataTransfer.setData('text/plain', event.target.id);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event) {
        event.preventDefault();
        const itemId = event.dataTransfer.getData('text/plain');
        const item = document.getElementById(itemId);
        const itemHeight = parseInt(item.dataset.height);
        const currentBin = event.target;

        // Verifica se l'elemento è stato rilasciato dentro al bin
        if (currentBin.classList.contains('bins-container')) {
            if (currentBin.currentCapacity + itemHeight <= parseInt(currentBin.dataset.capacity)) {
                currentBin.appendChild(item);
                currentBin.currentCapacity += itemHeight;
                currentBin.totalCost += parseInt(currentBin.dataset.cost);
                console.log("Capacità attuale del contenitore:", currentBin.currentCapacity);
                console.log("Costo totale:", currentBin.totalCost);
            } else {
                console.log("Il contenitore è pieno! Non è possibile aggiungere questo elemento.");
            }
        }
    }

    function dragEnd(event) {
        const itemId = event.target.id;
        const originalContainer = document.getElementById('items-container');
        originalContainer.appendChild(document.getElementById(itemId));
    }
});



