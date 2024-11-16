import { RouterLink } from "@angular/router";

export const navbarData = [
  {
    RouterLink: 'actas',
    icon: 'fa-solid fa-file',
    label: 'Actas'
  },

  {
    RouterLink: 'logout',
    icon: 'fa-solid fa-sign-out-alt',
    label: 'Cerrar sesión',
    action: 'logout' // Acción personalizada para el logout
  },

  {
    RouterLink: 'pagina-de-prueba-eliminar',
    icon: 'fa-solid fa-trash',
    label: 'Prueba',
  }
];

