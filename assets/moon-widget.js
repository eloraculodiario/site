if (ageEl) ageEl.textContent = '--';
const signEl = document.getElementById('moon-sign');
if (signEl) signEl.textContent = '--';
    }
}

// Cargar al iniciar la página
document.addEventListener('DOMContentLoaded', cargarFaseLunar);
