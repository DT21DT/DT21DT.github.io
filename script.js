document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.item');
    const bins = document.getElementById('bins-container');

    items.forEach(item => {
        item.addEventListener('dragstart', dragStart);
    });

    bins.addEventListener('dragover', dragOver);
    bins.addEventListener('drop', drop);

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

        // Determine the actual target container
        const targetContainer = event.target.closest('.bin');

        // Check if a valid target container was found
        if (targetContainer) {
            targetContainer.appendChild(item);
        }
    }
});
