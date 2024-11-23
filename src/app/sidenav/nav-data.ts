import { RouterLink } from "@angular/router";

export const navbarData = [
  {
    RouterLink: 'actas',
    icon: 'fa-solid fa-tasks',
    label: 'Mis tareas'
  },

    //Vista de Mis Obras
    {
      RouterLink: 'mis-obras',
      icon: 'fa-solid fa-file',
      label: 'Mis actas'
    },

  {
    RouterLink: 'logout',
    icon: 'fa-solid fa-sign-out-alt',
    label: 'Cerrar sesión',
    action: 'logout' // Acción personalizada para el logout
  }
];

