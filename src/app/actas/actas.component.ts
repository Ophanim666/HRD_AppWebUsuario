import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

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

@Component({
  selector: 'app-actas',
  templateUrl: './actas.component.html',
  styleUrl: './actas.component.css'
})

export class ActasComponent implements OnInit {

  // Variables de clase
  parametros: Parametro[] = [];
  actas: Acta[] = [];
  currentActa: Acta = this.getEmptyActa();
  tipoParametros: TipoParametro[] = [];
  proveedor: Proveedor[] = [];
  especialidad: Especialidad[] = [];
  usuario: Usuario[] = [];
  obra: Obra[] = [];

  showModalActa = false;
  searchText: string = '';
  pagedActas: any[] = [];
  
  // Nuevas variables para manejar tareas
  gruposTareas: GrupoTarea[] = [];
  tareas: Tarea[] = [];
  tareasDelGrupo: Tarea[] = [];
  estadosTarea: EstadoTarea[] = [];

  private apiUrlGrupoTarea = 'https://localhost:7125/api/GrupoTarea';
  private apiUrlTarea = 'https://localhost:7125/api/Tarea';

  // URLs de la API
  private apiUrl = 'https://localhost:7125/api/Parametro';
  private apiUrlTipoParametro = 'https://localhost:7125/api/TipoParametro';
  private apiUrlProveedor = 'https://localhost:7125/api/Proveedor';
  private apiUrlEspecialidad = 'https://localhost:7125/api/Especialidad';
  private apiUrlUsuarios = 'https://localhost:7125/api/Usuarios';
  private apiUrlActas = 'https://localhost:7125/api/Acta';
  private apiUrlObras = 'https://localhost:7125/api/Obra';

  // Variables para manejo de errores
  showErrorModal = false;
  errorMessage: { message: string, isError: boolean } = { message: '', isError: true };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Carga inicial de parámetros y tipos de parámetros
    this.loadActas()
    this.loadTipoParametros();
    //this.loadParametros();
    this.loadProveedores();
    this.loadEspecialidades();
    this.loadUsuarios();
    this.loadObras();
    this.loadTareas();
    this.loadGruposTareas();
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

  // Cargar TODOS los grupos de tareas
  loadGruposTareas(): void {
    this.http.get<any>(`${this.apiUrlGrupoTarea}/Listado`).subscribe({
      next: response => {
        if (response.estado?.ack) {
          this.gruposTareas = response.body.response;
          console.log('Todos los grupos de tareas cargados:', this.gruposTareas);
        } else {
          this.showError(`Error al cargar los grupos de tareas: ${response.estado?.errDes}`, true);
        }
      },
      error: error => {
        console.error('Error al cargar los grupos de tareas:', error);
        this.showError('Error en la solicitud al cargar los grupos de tareas.', true);
      }
    });
  }

  // Filtrar y procesar las tareas para un acta específica
  filtrarTareasPorActa(actaId: number): void {
    // Filtrar los grupos de tareas que corresponden al acta seleccionada
    const gruposFiltrados = this.gruposTareas.filter(grupo => grupo.idActa === actaId);
    console.log('Grupos filtrados para acta:', actaId, gruposFiltrados);

    // Limpiar el array de tareas del grupo actual
    this.tareasDelGrupo = [];

    // Procesar cada grupo filtrado
    gruposFiltrados.forEach(grupo => {
      // Asumiendo que idTarea es un array en la respuesta de la API
      if (Array.isArray(grupo.idTarea)) {
        grupo.idTarea.forEach(tareaId => {
          const tarea = this.tareas.find(t => t.id === tareaId);
          if (tarea) {
            this.tareasDelGrupo.push(tarea);
          }
        });
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

  // Función para filtrar parámetros según el texto de búsqueda
  filteredActas() {
    return this.actas.filter(parametro =>
      parametro.observacion.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Función para actualizar la página de parámetros según la paginación
  updatePageActa(): void {
    const filtered = this.filteredActas();
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    this.pagedActas = filtered.slice(startIndex, endIndex);
    this.paginator.length = filtered.length;
  }

  // Función que se llama cuando cambia el texto de búsqueda
  onSearchChange(): void {
    this.paginator.firstPage();
    this.updatePageActa();
  }

  // Modificar el método openModalActa para usar el nuevo filtrado
  openModalActa(acta?: Acta): void {
    this.currentActa = acta ? { ...acta } : this.getEmptyActa();
    
    if (acta && acta.id) {
      this.filtrarTareasPorActa(acta.id);
    }
    
    this.showModalActa = true;
    document.body.classList.add('modal-open');
  }

  // // Función para manejar el cambio del estado del parámetro
  // onToggleChange(event: MatSlideToggleChange): void {
  //   this.currentParametro.estado = event.checked ? 1 : 0;
  // }

  // Función para cerrar el modal
  closeModalActa(): void {
    this.showModalActa = false;
    document.body.classList.remove('modal-open');
  }

  // Función para guardar el parámetro (crear o actualizar)
  // saveActa(): void {
  //   if (this.isEditMode) {
  //     this.updateActa();
  //   } else {
  //     this.createActa();
  //   }
  // }
  
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

  // Funciones para obtener datos en base a su ID
  getProveedorNombre(id: number): string {
    console.log('ID recibido proveed:', id); // Ver qué ID llega
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
    console.log('ID recibido obra:', id); // Ver qué ID llega
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
    console.log('ID recibido:', id); // Ver qué ID llega
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
    //console.log('ID recibido:', id); // Ver qué ID llega
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
    //console.log('ID recibido:', id); // Ver qué ID llega
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
}
