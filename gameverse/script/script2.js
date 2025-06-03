document.querySelectorAll('.scrollable').forEach(scrollable => {
    let isDown = false;
    let startY, scrollTop;
  
    // Przeciąganie myszką
    scrollable.addEventListener('mousedown', (e) => {
        if (e.target !== scrollable) return; // Pozwala używać scrollbara
        isDown = true;
        scrollable.classList.add('grabbing');
        startY = e.clientY;
        scrollTop = scrollable.scrollTop;
    });
  
    scrollable.addEventListener('mouseleave', () => {
        isDown = false;
        scrollable.classList.remove('grabbing');
    });
  
    scrollable.addEventListener('mouseup', () => {
        isDown = false;
        scrollable.classList.remove('grabbing');
    });
  
    scrollable.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const y = e.clientY;
        scrollable.scrollTop = scrollTop - (y - startY);
    });
  
    // Obsługa dotyku (dla telefonów)
    scrollable.addEventListener('touchstart', (e) => {
        isDown = true;
        startY = e.touches[0].clientY;
        scrollTop = scrollable.scrollTop;
    });
  
    scrollable.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const y = e.touches[0].clientY;
        scrollable.scrollTop = scrollTop - (y - startY);
    });
  
    scrollable.addEventListener('touchend', () => {
        isDown = false;
    });
  
    // Użycie scrolla - normalne przewijanie
    scrollable.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollable.scrollTop += e.deltaY; // Umożliwia przewijanie scrolla
    });
  });
  