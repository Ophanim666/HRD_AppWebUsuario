import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

/*se importa el pkg de JSPDF */
import jsPDF from 'jspdf';
import 'jspdf-autotable';


interface TipoParametro {
  id: number;
  tipO_PARAMETRO: string;
  estado: number;
}

interface Proveedor {
  iDproveedor: number;
  nombreProveedor: string;
}

interface Obra {
  id: number;
  nombre: string;
}

interface Especialidad {
  id: number;
  nombre: string;
}

interface Usuario {
  id: number;
  primer_nombre: string;
}

interface Parametro {
  id?: number;
  parametro: string;
  valor: string;
  iD_TIPO_PARAMETRO: number; // Cambiado para coincidir con la API
  estado: number;
}

interface Acta {
  id?: number;
  obrA_ID: number;
  proveedoR_ID: number;
  especialidaD_ID: number; // Cambiado para coincidir con la API
  estadO_ID: number;
  fechA_APROBACION: Date | null;
  observacion: string;
  revisoR_ID: number;
}

interface GrupoTarea {
  idGrupoTarea: number;
  idActa: number;
  idRol: number;
  idEncargado: number;
  usuarioCreacion: string | null;
  fechaCreacion: string;
  idTarea: number[];
}

interface Tarea {
  id: number;
  nombre: string;
  estado: number;
  usuarioCreacion: string | null;
  fechaCreacion: string;
}

interface EstadoTarea {
  id: number;
  nombre: string;
}

interface UserActa {
  grupo: number;
  acta: number;
  rol: number;
  encargado: number;
  tarea: number;
}

@Component({
  selector: 'app-actas',
  templateUrl: './mis-obras.component.html',
  styleUrl: './mis-obras.component.css'
})

export class MisObrasComponent implements OnInit {

  // Variables de clase
  actas: Acta[] = [];
  parametros: Parametro[] = [];
  currentActa: Acta = this.getEmptyActa();
  tipoParametros: TipoParametro[] = [];
  proveedor: Proveedor[] = [];
  especialidad: Especialidad[] = [];
  usuario: Usuario[] = [];
  obra: Obra[] = [];
  gruposTareas: GrupoTarea[] = [];
  tareas: Tarea[] = [];
  tareasDelGrupo: Tarea[] = [];
  estadosTarea: EstadoTarea[] = [];
  userActas: UserActa[] = [];
  showModalActa = false;
  searchText: string = '';
  pagedActas: any[] = [];
  roles: Parametro[] = [];
  grupos: any[] = [];
  showConfirmationModal = false;  // Controla si el modal de confirmación está visible
  confirmationMessage = '';  // Mensaje a mostrar en el modal
  confirmationAction: (() => void) | null = null;  // Acción a ejecutar al confirmar
  showSuccessModal = false;  // Controla si el modal está visible
  successMessage = '';  // Mensaje a mostrar en el modal

  // Variables para manejo de errores
  showErrorModal = false;
  errorMessage: { message: string, isError: boolean } = { message: '', isError: true };

  private actaId: any;
  private parametroFirmada: any;
  private parametroRechazada: any;
  

  // URLs de la API
  private apiUrl = 'https://localhost:7125/api/Parametro';
  private apiUrlTipoParametro = 'https://localhost:7125/api/TipoParametro';
  private apiUrlProveedor = 'https://localhost:7125/api/Proveedor';
  private apiUrlEspecialidad = 'https://localhost:7125/api/Especialidad';
  private apiUrlUsuarios = 'https://localhost:7125/api/Usuarios';
  private apiUrlActas = 'https://localhost:7125/api/Acta';
  private apiUrlObras = 'https://localhost:7125/api/Obra';
  private apiUrlGrupoTarea = 'https://localhost:7125/api/GrupoTarea';
  private apiUrlTarea = 'https://localhost:7125/api/Tarea';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserActas();
    this.loadTipoParametros();
    //this.loadParametros();
    this.loadProveedores();
    this.loadEspecialidades();
    this.loadUsuarios();
    this.loadObras();
    this.loadTareas();
    this.loadGruposTareas();
    this.loadParametrosRoles();

    // Llamada a la función para obtener el id del parámetro
    const parametroId = this.getParametroIdByTipoParametroAndValor();
    console.log("parametro id",parametroId);
  }

  // Función para obtener un objeto Parametro vacío
  getEmptyActa(): Acta {
    return {
      obrA_ID: 0,
      proveedoR_ID: 0,
      especialidaD_ID: 0, // valor por defecto
      estadO_ID: 0,
      fechA_APROBACION: null,
      observacion: '',
      revisoR_ID: 0
    };
  }

  // Nueva función para cargar las actas del usuario
  loadUserActas(): void {
    this.http.get<any>(`${this.apiUrlActas}/revisor-actas`).subscribe({
      next: response => {
        if (response.body?.response) {
          this.userActas = response.body.response;
          // Cargar solo las actas que corresponden al usuario
          this.loadActasFiltered();
        } else {
          this.showError('Error al cargar las actas del usuario', true);
        }
      },
      error: error => {
        console.error('Error al cargar las actas del usuario:', error);
        this.showError('Error en la solicitud al cargar las actas del usuario.', true);
      }
    });
  }

  // Nueva función para cargar las actas filtradas
  loadActasFiltered(): void {
    // Obtener los IDs únicos de las actas del usuario
    const actaIds = [...new Set(this.userActas.map(ua => ua.acta))];
    
    this.http.get<any>(`${this.apiUrlActas}/Listar`).subscribe({
      next: response => {
        if (response.estado.ack) {
          // Filtrar solo las actas que están en userActas
          this.actas = response.body.response.filter((acta: Acta) => 
            actaIds.includes(acta.id!)
          );
          this.updatePageActa();
        } else {
          this.showError(`Error al cargar las actas: ${response.estado.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar las actas:', error);
        this.showError('Error en la solicitud al cargar las actas.', true);
      }
    });
  }

  filtrarTareasPorActa(actaId: number): void {
    // Obtener las tareas correspondientes a esta acta desde userActas
    const tareasIds = this.userActas
      .filter(ua => ua.acta === actaId)
      .map(ua => ua.tarea);

    // Limpiar el array de tareas del grupo actual
    this.tareasDelGrupo = [];

    // Añadir solo las tareas que corresponden al usuario
    tareasIds.forEach(tareaId => {
      const tarea = this.tareas.find(t => t.id === tareaId);
      if (tarea) {
        this.tareasDelGrupo.push(tarea);
      }
    });

    console.log('Tareas procesadas para el acta:', this.tareasDelGrupo);
  }

  // Procesar y obtener las tareas específicas de los grupos
  procesarTareasDelGrupo(): void {
    this.tareasDelGrupo = [];
    this.gruposTareas.forEach(grupo => {
      grupo.idTarea.forEach(tareaId => {
        const tarea = this.tareas.find(t => t.id === tareaId);
        if (tarea) {
          this.tareasDelGrupo.push(tarea);
        }
      });
    });
  }

  // Cargar todas las tareas disponibles
  loadTareas(): void {
    this.http.get<any>(`${this.apiUrlTarea}/ListarTareas`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.tareas = response.body.response;
          console.log('Tareas cargadas:', this.tareas);
        } else {
          this.showError(`Error al cargar las tareas: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar las tareas:', error);
        this.showError('Error en la solicitud al cargar las tareas.', true);
      }
    });
  }

  loadParametrosRoles(): void {
  this.http.get<any>(`${this.apiUrl}/Listar`).subscribe({
    next: response => {
      if (response.estado.ack) {
        // Encuentra el tipo "Roles" en los tipos de parámetros
        const tipoRoles = this.tipoParametros.find(
          tipo => tipo.tipO_PARAMETRO === "Roles"
        );

        if (tipoRoles) {
          // Filtra los parámetros que pertenecen al tipo "Roles"
          this.roles = response.body.response.filter(
            (parametro: Parametro) => parametro.iD_TIPO_PARAMETRO === tipoRoles.id
          );
          console.log('Roles cargados:', this.roles);
        } else {
          console.warn('No se encontró el tipo de parámetro "Roles".');
        }
      } else {
        console.error('Error al cargar los roles:', response.estado.errDes);
      }
    },
    error: error => {
      console.error('Error al cargar los roles:', error);
    }
  });
}


  // Cargar TODOS los grupos de tareas
  loadGruposTareas(actaId?: number): void {
    this.http.get(`${this.apiUrlGrupoTarea}/Listado`).subscribe({
      next: (response: any) => {
        // Filtra los grupos de tareas por idActa si se pasa el actaId
          if (actaId) {
            this.grupos = response.body.response.filter((grupo: any) => grupo.idActa === actaId);
          } else {
            this.grupos = response.body.response || [];
          }
        
          // console.log('currentGrupo:', this.grupos);
      },
      error: error => {
        console.error('Error al cargar grupos de tareas:', error);
        this.showError('Error al cargar los grupos de tareas.', true);
      }
    });
  }

  
  //Función para cargar tipos de parámetros desde la API
  loadTipoParametros(): void {
    this.http.get<any>(`${this.apiUrlTipoParametro}/LstTipoParametros`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.tipoParametros = response.body.response;
          console.log('Tipos de parámetros cargados:', this.tipoParametros);

          this.loadParametros();
        } else {
          this.showError(`Error al cargar los tipos de parámetros: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los tipos de parámetros:', error);
        this.showError('Error en la solicitud al cargar los tipos de parámetros.', true);
      }
    });
  }

  loadProveedores(): void {
    this.http.get<any>(`${this.apiUrlProveedor}/Listado`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.proveedor = response.body.response;
          console.log('Proveedores cargados:', this.proveedor);
        } else {
          this.showError(`Error al cargar los proveedores: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los proveedores:', error);
        this.showError('Error en la solicitud al cargar los proveedores.', true);
      }
    });
  }

  loadObras(): void {
    this.http.get<any>(`${this.apiUrlObras}/ObtenerObras`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.obra = response.body.response;
          console.log('Obras cargados:', this.obra);
        } else {
          this.showError(`Error al cargar las Obras: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los obras:', error);
        this.showError('Error en la solicitud al cargar los obras.', true);
      }
    });
  }

  loadEspecialidades(): void {
    this.http.get<any>(`${this.apiUrlEspecialidad}/ListadoDeespecialidadesSimple`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.especialidad = response.body.response;
          console.log('Especialidades cargadas:', this.especialidad);
        } else {
          this.showError(`Error al cargar las especialidades: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar las especialidades:', error);
        this.showError('Error en la solicitud al cargar las especialidades.', true);
      }
    });
  }

  loadUsuarios(): void {
    this.http.get<any>(`${this.apiUrlUsuarios}/ListarUsuarios`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.usuario = response.body.response;
          console.log('Usuarios cargadas:', this.usuario);
        } else {
          this.showError(`Error al cargar los Usuarios: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los Usuarios:', error);
        this.showError('Error en la solicitud al cargar los Usuarios.', true);
      }
    });
  }

  //Función para cargar parámetros desde la API
  loadParametros(): void {
    this.http.get<any>(`${this.apiUrl}/Listar`).subscribe({
      next: response => {
        if (response.estado.ack) {
          // Busca el ID del tipo de parámetro cuyo nombre es "Estado Acta"
          const tipoEstadoActa = this.tipoParametros.find(
            tipo => tipo.tipO_PARAMETRO === "Estado Acta"
          );
  
          // Si encontramos el ID, filtramos los parámetros
          if (tipoEstadoActa) {
            this.parametros = response.body.response.filter(
              (parametro: Parametro) => parametro.iD_TIPO_PARAMETRO === tipoEstadoActa.id
            );
          } else {
            console.warn('No se encontró el tipo de parámetro "Estado Acta".');
            this.parametros = [];
          }
  
          this.updatePageActa();
        } else {
          this.showError(`Error al cargar los Parámetros: ${response.estado.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los datos:', error);
        this.showError('Error en la solicitud al cargar los datos.', true);
      }
    });
  }

  // Función para cargar parámetros desde la API
  loadActas(): void {
    this.http.get<any>(`${this.apiUrlActas}/Listar`).subscribe({
      next: response => {
        if (response.estado.ack) {
          this.actas = response.body.response;
          this.updatePageActa();
        } else {
          this.showError(`Error al cargar las actas: ${response.estado.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar las actas:', error);
        this.showError('Error en la solicitud al cargar las actas.', true);
      }
    });
  }

    // Función que se llama cuando cambia el texto de búsqueda
  onSearchChange(): void {
    this.paginator.firstPage();
    this.updatePageActa();
  }

  // Función para filtrar actas según el texto de búsqueda
  filteredActas() {
    return this.actas.filter(parametro =>
      parametro.observacion.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Función para actualizar la página según la paginación
  updatePageActa(): void {
    const filtered = this.filteredActas();
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    this.pagedActas = filtered.slice(startIndex, endIndex);
    this.paginator.length = filtered.length;
  }

    getNombreTarea(tareaId: number): string {
    const tarea = this.tareas.find(t => t.id === tareaId);
    return tarea ? tarea.nombre : 'Tarea desconocida';
  }
  
  getEstadoTexto(tareaId: number): string {
    const tarea = this.tareas.find(t => t.id === tareaId);
    if (tarea) {
      return tarea.estado === 1 ? 'SI' : tarea.estado === 0 ? 'NO' : 'PENDIENTE';
    }
    return 'N/A';
  }
  
  getEstadoClase(tareaId: number): any {
    const tarea = this.tareas.find(t => t.id === tareaId);
    if (tarea) {
      return {
        'estado-si': tarea.estado === 1,
        'estado-no': tarea.estado === 0,
        'estado-pendiente': tarea.estado === null,
      };
    }
    return {};
  }
  

    // Modificar el método openModalActa para usar el nuevo filtrado
    openModalActa(acta?: Acta): void {
      this.currentActa = acta ? { ...acta } : this.getEmptyActa();
    
      if (acta && acta.id) {
        this.actaId = acta.id;
    
        // Mantener lógica de firmas
        this.parametroFirmada = this.getParametroIdByTipoParametroAndValor();
        this.parametroRechazada = this.getParametroIdByTipoParametroAndValorRechazada();
    
        console.log("Id parámetro firmado: ", this.parametroFirmada);
        console.log("Id parámetro rechazado: ", this.parametroRechazada);
    
        // Cargar los grupos asociados al acta
        this.http.get<any>(`${this.apiUrlGrupoTarea}/Listado`).subscribe({
          next: response => {
            if (response.body?.response) {
              // Filtrar y mapear los grupos para agregar el administrador
              this.grupos = response.body.response
                .filter((grupo: any) => grupo.idActa === acta.id)
                .map((grupo: any) => ({
                  ...grupo,
                  administradorNombre: this.getUsuarioNombre(grupo.idEncargado || acta.revisoR_ID) // Priorizar idEncargado, si no usar revisoR_ID
                }));
              console.log('Grupos procesados:', this.grupos);
            } else {
              console.warn('No se encontraron grupos para esta acta.');
              this.grupos = [];
            }
          },
          error: error => {
            console.error('Error al cargar los grupos de tareas:', error);
            this.showError('Error al cargar los grupos de tareas.', true);
          }
        });
      }
    
      this.showModalActa = true;
      document.body.classList.add('modal-open');
    }
    

  // Función para cerrar el modal
  closeModalActa(): void {
    this.showModalActa = false;
    document.body.classList.remove('modal-open');
  }

  // Función para mostrar mensajes de error
  showError(message: string, isError: boolean): void {
    this.errorMessage = { message, isError };
    this.showErrorModal = true;
  }

  // Función para cerrar el modal de error
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = { message: '', isError: true };
  }

  // Función que se llama cuando cambia la página en la paginación
  onPageChange(event: PageEvent) {
    this.updatePageActa();
  }

  // Obtención de datos a través de su ID

  getProveedorNombre(id: number): string {
    // console.log('ID recibido proveedor:', id); // Ver qué ID llega
    //console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles
    
    const proveedor = this.proveedor.find(elemento => {
        //console.log('Comparando:aaaaa', elemento.id, 'con aaaa', id); // Ver las comparaciones
        return elemento.iDproveedor === id;
    });
    
    if (!proveedor) {
        //console.log(`No se encontró proveedor para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return proveedor.nombreProveedor; 
  }

  getObraNombre(id: number): string {
    // console.log('ID recibido obra:', id); // Ver qué ID llega
    //console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles
    
    const obra = this.obra.find(elemento => {
        //console.log('Comparando:aaaaa', elemento.id, 'con aaaa', id); // Ver las comparaciones
        return elemento.id === id;
    });
    
    if (!obra) {
        //console.log(`No se encontró proveedor para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return obra.nombre; 
  }

  getEspecialidadNombre(id: number): string {
    // console.log('ID recibido:', id); // Ver qué ID llega
    //console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles
    
    const especialidad = this.especialidad.find(elemento => {
       // console.log('Comparando:', elemento.id, 'con', id); // Ver las comparaciones
        return elemento.id === id;
    });
    
    if (!especialidad) {
        //console.log(`No se encontró especialidad para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return especialidad.nombre; 
  }

  getUsuarioNombre(id: number): string {
    // console.log('ID recibido:', id); // Ver qué ID llega
    //console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles
    
    const usuario = this.usuario.find(elemento => {
        //console.log('Comparando:', elemento.id, 'con', id); // Ver las comparaciones
        return elemento.id === id;
    });
    
    if (!usuario) {
        //console.log(`No se encontró usuario para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return usuario.primer_nombre; 
  }

  getEstadoNombre(id: number): string {
    // console.log('ID recibido:', id); // Ver qué ID llega
    //console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles

    const estado = this.parametros.find(elemento => {
        //console.log('Comparando:', elemento.id, 'con', id); // Ver las comparaciones
        return elemento.id === id;
    });
    
    if (!estado) {
        //console.log(`No se encontró usuario para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return estado.parametro; 
  }

  guardarEstados(): void {
  const tareasConEstado = this.tareasDelGrupo.map(tarea => ({
    id: tarea.id,
    estado: tarea.estado
  }));

  this.http.post(`${this.apiUrlTarea}/GuardarEstados`, tareasConEstado).subscribe({
    next: response => {
      console.log('Estados guardados con éxito:', response);
      this.closeModalActa();
    },
    error: error => {
      console.error('Error al guardar los estados:', error);
      this.showError('No se pudieron guardar los estados.', true);
    }
  });
}

actualizarEstado(tarea: any): void {
  const payload = {
    grupoTareaId: tarea.grupoTareaId, 
    tareaId: tarea.id,
    estado: tarea.estado,
  };

  this.http.post('http://localhost:5000/api/grupoTareas/actualizarEstadoTareaEnGrupo', payload).subscribe({
    next: response => {
      console.log(`Estado actualizado correctamente para la tarea ${tarea.id}:`, response);
    },
    error: error => {
      console.error(`Error al actualizar el estado de la tarea ${tarea.id}:`, error);
      alert('Ocurrió un error al actualizar el estado.');
    }
  });
}

// Abrir el modal de confirmación
openConfirmationModal(message: string, action: () => void): void {
  this.confirmationMessage = message;
  this.confirmationAction = action;
  this.showConfirmationModal = true;
}

// Cerrar el modal de confirmación
closeConfirmationModal(): void {
  this.showConfirmationModal = false;
  this.confirmationMessage = '';
  this.confirmationAction = null;
}

// Ejecutar la acción confirmada
executeConfirmationAction(): void {
  if (this.confirmationAction) {
    this.confirmationAction();
  }
  this.closeConfirmationModal();
}

  // Mostrar el modal de éxito
  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;

    // Cerrar el modal automáticamente después de 3 segundos
    setTimeout(() => {
      this.closeSuccessModal();
    }, 3000);
  }

  // Cerrar el modal de éxito
  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }


// firmarTareas(): void {
//   this.tareasDelGrupo.forEach(tarea => {
//     tarea.estado = 1; // Cambiar a "SI"
//     this.actualizarEstado(tarea); // Guardar el cambio automáticamente
//   });
// }
firmarActa(): void {
  // Mostrar el modal de confirmación antes de proceder
  this.openConfirmationModal(
    '¿Está seguro de que desea firmar esta acta?', // Mensaje para el modal
    () => {
      // Acción a ejecutar si el usuario confirma
      const payload = {
        idEstado: this.parametroFirmada, // Estado "firmada" obtenido previamente
      };
      const actaId = this.actaId; // ID de la acta actual

      console.log("Estado del firmar:", payload); // Log para depuración
      console.log("Id de acta:", actaId); // Log para depuración

      // Llamada a la API para actualizar el estado del acta
      this.http.put(`${this.apiUrlActas}/ActualizarActaFirma/${actaId}`, payload).subscribe({
        next: response => {
          // Si la llamada es exitosa
          console.log(`Estado actualizado correctamente para la acta ${actaId}:`, response);

          // Encuentra la acta actual en el array `actas` y actualiza su estado localmente
          const updatedActa = this.actas.find(acta => acta.id === actaId);
          if (updatedActa) {
            updatedActa.estadO_ID = this.parametroFirmada; // Actualizar el estado a "Firmada"
          }

          // Actualizar la tabla sin recargar la página
          this.updatePageActa();

          // Mostrar el modal de éxito con un mensaje adecuado
          this.showSuccess('Acta firmada correctamente.');
        },
        error: error => {
          // Si ocurre un error, mostrar un mensaje de error en la consola y al usuario
          console.error(`Error al actualizar el estado de la acta ${actaId}:`, error);
          alert('Ocurrió un error al actualizar el estado de la acta.');
        }
      });
    }
  );
}

rechazarActa(): void {
  // Mostrar el modal de confirmación antes de proceder
  this.openConfirmationModal(
    '¿Está seguro de que desea rechazar esta acta?', // Mensaje para el modal
    () => {
      // Acción a ejecutar si el usuario confirma
      const payload = {
        idEstado: this.parametroRechazada, // Estado "rechazada" obtenido previamente
      };
      const actaId = this.actaId; // ID de la acta actual

      console.log("Estado del rechazar:", payload); // Log para depuración
      console.log("Id de acta:", actaId); // Log para depuración

      // Llamada a la API para actualizar el estado del acta
      this.http.put(`${this.apiUrlActas}/ActualizarActaFirma/${actaId}`, payload).subscribe({
        next: response => {
          // Si la llamada es exitosa
          console.log(`Estado actualizado correctamente para la acta ${actaId}:`, response);

          // Encuentra la acta actual en el array `actas` y actualiza su estado localmente
          const updatedActa = this.actas.find(acta => acta.id === actaId);
          if (updatedActa) {
            updatedActa.estadO_ID = this.parametroRechazada; // Actualizar el estado a "Rechazada"
          }

          // Actualizar la tabla sin recargar la página
          this.updatePageActa();

          // Mostrar el modal de éxito con un mensaje adecuado
          this.showSuccess('Acta rechazada correctamente.');
        },
        error: error => {
          // Si ocurre un error, mostrar un mensaje de error en la consola y al usuario
          console.error(`Error al actualizar el estado de la acta ${actaId}:`, error);
          alert('Ocurrió un error al actualizar el estado de la acta.');
        }
      });
    }
  );
}



// Función para verificar si todas las tareas están en estado "SI"
todasLasTareasFirmadas(): boolean {
  return this.tareasDelGrupo.every(tarea => tarea.estado === 1); // Verifica si todas están en estado "SI"
}

// Función para verificar si todas las tareas están en estado "SI"
todasLasTareasRechazadas(): boolean {
  return this.tareasDelGrupo.every(tarea => tarea.estado === 0); // Verifica si todas están en estado "NO"
}



rechazarTareas(): void {
  this.tareasDelGrupo.forEach(tarea => {
    tarea.estado = 0; // Cambiar a "NO"
    this.actualizarEstado(tarea); // Guardar el cambio automáticamente
  });
}

getRolNombre(id: number): string {
  // Confirmar que los datos están cargados
  if (!this.roles || this.roles.length === 0) {
    console.warn('La lista de roles está vacía.');
    return `Rol desconocido (ID: ${id})`;
  }

  // Buscar el rol
  const rol = this.roles.find((rol) => rol.id === id);

  // Validar el resultado
  if (!rol) {
    console.warn(`No se encontró un rol con el ID: ${id}`);
    return `Rol desconocido (ID: ${id})`;
  }

  return rol.parametro;
}




// Función para obtener el id del parámetro cuyo valor es 'Firmada' y el tipo de parámetro es 'Estado Acta'
getParametroIdByTipoParametroAndValor(): number | undefined {
  // Buscar el tipo de parámetro cuyo nombre coincida con 'Estado Acta'
  const tipoParametro = this.tipoParametros.find(tipo => tipo.tipO_PARAMETRO === "Estado Acta");

  // Si encontramos el tipo de parámetro, buscamos el parámetro correspondiente
  if (tipoParametro) {
    // Buscar el parámetro cuyo 'parametro' sea 'Firmada' y cuyo 'iD_TIPO_PARAMETRO' coincida con el id del tipo de parámetro encontrado
    const parametro = this.parametros.find(param => param.parametro === "Firmada" && param.iD_TIPO_PARAMETRO === tipoParametro.id);

    // Si encontramos el parámetro, devolver su id
    return parametro ? parametro.id : undefined;
  }

  // Si no se encuentra el tipo de parámetro, devolver undefined
  return undefined;
}

// Función para obtener el id del parámetro cuyo valor es 'Firmada' y el tipo de parámetro es 'Estado Acta'
getParametroIdByTipoParametroAndValorRechazada(): number | undefined {
  // Buscar el tipo de parámetro cuyo nombre coincida con 'Estado Acta'
  const tipoParametro = this.tipoParametros.find(tipo => tipo.tipO_PARAMETRO === "Estado Acta");

  // Si encontramos el tipo de parámetro, buscamos el parámetro correspondiente
  if (tipoParametro) {
    // Buscar el parámetro cuyo 'parametro' sea 'Firmada' y cuyo 'iD_TIPO_PARAMETRO' coincida con el id del tipo de parámetro encontrado
    const parametro = this.parametros.find(param => param.parametro === "Rechazada" && param.iD_TIPO_PARAMETRO === tipoParametro.id);

    // Si encontramos el parámetro, devolver su id
    return parametro ? parametro.id : undefined;
  }

  // Si no se encuentra el tipo de parámetro, devolver undefined
  return undefined;
}




  /*se implementa la funcion para la descarga de actas en PDF*/
  downloadPDF(actaId: number): void {
    // Encuentra la acta seleccionada
    const acta = this.actas.find((a) => a.id === actaId);
    if (!acta) {
      alert('No se encontró el acta especificada.');
      return;
    }
  
    // Cargar los grupos asociados al acta y agregar el nombre del administrador
    this.http.get<any>(`${this.apiUrlGrupoTarea}/Listado`).subscribe({
      next: response => {
        if (response.body?.response) {
          const grupos = response.body.response
            .filter((grupo: any) => grupo.idActa === actaId)
            .map((grupo: any) => ({
              ...grupo,
              administradorNombre: this.getUsuarioNombre(acta.revisoR_ID || 0), // Agrega el administrador
            }));
  
          // Generar el PDF
          this.generatePDF(acta, grupos);
        } else {
          alert('No hay grupos de tareas asociados al acta.');
        }
      },
      error: error => {
        console.error('Error al cargar los grupos de tareas:', error);
        this.showError('Error al cargar los grupos de tareas.', true);
      }
    });
  }
  
  // Nueva función para generar el PDF con los datos ya cargados
  private generatePDF(acta: Acta, grupos: any[]): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Reporte de Acta N° ${acta.id}`, 14, 20);
  
    // Información del Acta
    const actaInfo = [
      ['Campo', 'Detalle'],
      ['ID', acta.id || 'Sin ID'],
      ['Obra', this.getObraNombre(acta.obrA_ID || 0)],
      ['Proveedor', this.getProveedorNombre(acta.proveedoR_ID || 0)],
      ['Especialidad', this.getEspecialidadNombre(acta.especialidaD_ID || 0)],
      ['Administrador', this.getUsuarioNombre(acta.revisoR_ID || 0)],
      ['Fecha de Creación', acta.fechA_APROBACION ? new Date(acta.fechA_APROBACION).toLocaleDateString() : 'Sin fecha'],
      ['Observaciones', acta.observacion || 'Sin observaciones'],
      ['Estado', this.getEstadoNombre(acta.estadO_ID || 0)],
    ];
  
    (doc as any).autoTable({
      head: [actaInfo[0]],
      body: actaInfo.slice(1),
      startY: 30,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      bodyStyles: { valign: 'top', halign: 'left' },
      columnStyles: {
        1: { cellWidth: 100 }, // Ajusta el ancho de la columna "Detalle"
      },
    });
  
    // Información de los grupos de tareas
    grupos.forEach((grupo, index) => {
      doc.setFontSize(14);
      doc.text(`Grupo ${index + 1} - Administrador: ${grupo.administradorNombre}`, 14, (doc as any).lastAutoTable.finalY + 10);
  
      const grupoInfo = [
        ['Rol', this.getRolNombre(grupo.idRol)],
        ['Encargado', this.getUsuarioNombre(grupo.idEncargado)],
      ];
  
      (doc as any).autoTable({
        head: [['Campo', 'Detalle']],
        body: grupoInfo,
        startY: (doc as any).lastAutoTable.finalY + 15,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      });
  
      // Agregar las tareas asociadas al grupo
      const tareasInfo = (grupo.idTarea || []).map((tareaId: number) => {
        const tarea = this.tareas.find((t) => t.id === tareaId);
        return tarea
          ? [tarea.id, tarea.nombre, tarea.estado === 1 ? 'SI' : tarea.estado === 0 ? 'NO' : 'P']
          : [`ID ${tareaId}`, 'Tarea desconocida', 'N/A'];
      });
  
      if (tareasInfo.length > 0) {
        doc.text('Tareas Asociadas:', 14, (doc as any).lastAutoTable.finalY + 15);
        (doc as any).autoTable({
          head: [['ID Tarea', 'Nombre Tarea', 'Estado']],
          body: tareasInfo,
          startY: (doc as any).lastAutoTable.finalY + 20,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [22, 160, 133], textColor: 255 },
        });
      }
    });
  
    // Guardar el PDF
    doc.save(`Acta_${acta.id}_Grupos_Tareas.pdf`);
  }
  
  
}
