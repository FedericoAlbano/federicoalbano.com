window.onload = function () {
    setTimeout(function () {
      const popup = document.getElementById('popup-guida');
      if (popup) {
        popup.style.display = 'block';
        setTimeout(() => popup.classList.add('show'), 50);
      }
    }, 5000);
  };