import { RouterLink } from "@angular/router";

export const navbarData = [
  {
    RouterLink: 'actas',
    icon: 'fa-solid fa-file',
    label: 'Actas'
  },

    //Vista de Mis Obras
    {
      RouterLink: 'mis-obras',
      icon: 'fa-solid fa-gear',
      label: 'Parámetros'
    },

  {
    RouterLink: 'logout',
    icon: 'fa-solid fa-sign-out-alt',
    label: 'Cerrar sesión',
    action: 'logout' // Acción personalizada para el logout
  }
];

