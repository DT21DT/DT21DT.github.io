document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.item');
    const bins = document.querySelectorAll('.bins-container');
    
    bins.forEach(bin => {
        bin.currentCapacity = 0;
        bin.totalCost = 0;
        bin.addEventListener('dragover', dragOver);
        bin.addEventListener('drop', drop);
    });

    items.forEach(item => {
        item.addEventListener('dragstart', dragStart);
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
});


