import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  estado: number;
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
  estado: number;
}

interface Archivo{
  id: number;
  grupo_Tarea_Id: number;
  nombreArchivo: string;
  ruta_Archivo: string;
  tipo_Imagen: string;
  contenidoBase64: string;
}

@Component({
  selector: 'app-actas',
  templateUrl: './actas.component.html',
  styleUrl: './actas.component.css'
})

export class ActasComponent implements OnInit {

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
  tareasDelGrupo: any[] = [];
  estadosTarea: EstadoTarea[] = [];
  userActas: UserActa[] = [];
  showModalActa = false;
  searchText: string = '';
  pagedActas: any[] = [];
  roles: Parametro[] = [];
  firmaGrupo: any[]=[];
  showConfirmationModal = false;  // Controla si el modal de confirmación está visible
  confirmationMessage = '';  // Mensaje a mostrar en el modal
  confirmationAction: (() => void) | null = null;  // Acción a ejecutar al confirmar
  showSuccessModal = false;  // Controla si el modal está visible
  successMessage = '';  // Mensaje a mostrar en el modal

  //adjuntar archivo
  archivos: Archivo[] = [];
  uploadedFiles: Archivo[] = [];
  archivosSeleccionados: any[] = [];
  grupos:any[] = [];
  archivosPorGrupoPaginados: Archivo[] = []; // Archivos mostrados en la página actual
  paginaActualArchivos: number = 1; // Página actual de los archivos
  tamanoPaginaArchivos: number = 5; // Número de archivos por página
  showFileModal: boolean = false; // Controlar la visibilidad del modal de archivos
  archivosPorGrupo: Archivo[] = []; // Lista de archivos para el grupo seleccionado
  archivosEnBase64: { fileName: string, base64: string }[] = [];



  private grupoId: any;


  // Variables para manejo de errores
  showErrorModal = false;
  errorMessage: { message: string, isError: boolean } = { message: '', isError: true };

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
  private apiUrlArchivo = 'https://localhost:7125/api/Archivo';
  

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

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
    this.http.get<any>('https://localhost:7125/api/Acta/user-actas').subscribe({
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

  // Cargar TODOS los grupos de tareas
  loadGruposTareas(actaId?: number): void {
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

  // // Modificar el método openModalActa para usar el nuevo filtrado
  // openModalActa(acta?: Acta): void {
  //   this.currentActa = acta ? { ...acta } : this.getEmptyActa();
    
  //   if (acta && acta.id) {
  //     this.filtrarTareasPorActa(acta.id);
  //   }
    
  //   this.showModalActa = true;
  //   document.body.classList.add('modal-open');
  // }

  openModalActa(acta: any): void {
    
    // Buscar el grupo correspondiente al acta seleccionada
    const grupoTarea = this.userActas.find((item: any) => item.acta === acta.id)?.grupo;
    this.grupoId=grupoTarea;
    if (grupoTarea) {
      // Filtrar las tareas asociadas al grupo
      const tareasDelGrupo = this.userActas.filter((item: any) => item.grupo === grupoTarea);
      console.log("aca va el id del grupo", grupoTarea)
      // Procesar las tareas para mostrarlas en el modal
      this.tareasDelGrupo = tareasDelGrupo.map((tarea: any) => ({
        id: tarea.tarea, // ID de la tarea
        nombre: this.getTareaNombre(tarea.tarea), // Opcional: método para obtener el nombre de la tarea
        estado: tarea.estado, // Inicializar con estado nulo si no viene en el JSON
        grupoTareaId: grupoTarea
      }));
  
      this.showModalActa = true;
    } else {
      console.error(`No se encontró un grupo de tareas para el acta con ID: ${acta.id}`);
      this.showError('No se encontraron tareas para este acta.', true);
    }
  }

  // Función para cerrar el modal
  closeModalActa(): void {
    this.loadUserActas();
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

  getTareaNombre(id: number): string {
    //console.log('ID recibido proveed:', id); // Ver qué ID llega
    ////console.log('Lista de tipos:', this.tipoParametros); // Ver qué tipos tenemos disponibles
    
    const tarea = this.tareas.find(elemento => {
        ////console.log('Comparando:aaaaa', elemento.id, 'con aaaa', id); // Ver las comparaciones
        return elemento.id === id;
    });
    
    if (!tarea) {
        ////console.log(`No se encontró proveedor para ID: ${id}`);
        return `Tipo ${id}`;
    }
    
    return tarea.nombre; 
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
    //grupoTareaId: tarea.grupoTareaId, // Ajusta estos campos según tu modelo
    //tareaId: tarea.id,
    estado: tarea.estado,
  };

  this.http.put(`${this.apiUrlGrupoTarea}/ActualizarEstadoTarea/${tarea.grupoTareaId}/${tarea.id}`, payload).subscribe({
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

  // Modificar las funciones de firmar y rechazar grupo de tareas para mostrar el modal
  firmarGrupoTarea(): void {
    this.openConfirmationModal(
      '¿Está seguro de que desea firmar el acta?',
      () => {
        const payload = { estado: 1 };
        const grupoTarea = this.grupoId;

        this.http.put(`${this.apiUrlGrupoTarea}/ActualizarEstadoFirma/${grupoTarea}`, payload).subscribe({
          next: response => {
            console.log(`El acta ha sido firmada exitosamente.${grupoTarea}:`, response);
            this.showSuccess('El grupo de tarea ha sido firmada exitosamente.');
          },
          error: error => {
            console.error(`Error al actualizar el estado del grupo ${grupoTarea}:`, error);
            alert('Ocurrió un error al actualizar el estado.');
          }
        });
      }
    );
  }

  rechazarGrupoTarea(): void {
    this.openConfirmationModal(
      '¿Está seguro de que desea rechazar el grupo de tareas?',
      () => {
        const payload = { estado: 0 };
        const grupoTarea = this.grupoId;

        this.http.put(`${this.apiUrlGrupoTarea}/ActualizarEstadoFirma/${grupoTarea}`, payload).subscribe({
          next: response => {
            console.log(`El grupo de tarea ha sido rechazada. ${grupoTarea}:`, response);
            this.showSuccess('El grupo de tarea ha sido rechazada exitosamente.');
          },
          error: error => {
            console.error(`Error al actualizar el estado del grupo ${grupoTarea}:`, error);
            alert('Ocurrió un error al actualizar el estado.');
          }
        });
      }
    );
  }

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    this.archivosSeleccionados = Array.from(input.files); // Almacena archivos seleccionados
    this.archivosEnBase64 = []; // Reinicia la lista de archivos en base64

    // Convertir archivos a base64
    this.archivosSeleccionados.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        this.archivosEnBase64.push({
          base64: base64String.split(',')[1], // Quitar prefijo "data:image/png;base64,"
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

uploadFiles(): void {
  if (this.archivosSeleccionados.length === 0) {
    this.showError('No hay archivos seleccionados para subir.', true);  // Usar showError para mensajes de error
    return;
  }
  // Procesar cada archivo
  this.archivosEnBase64.forEach(archivo => {
    const archivoData = {
      grupo_Tarea_Id: this.grupoId,
      nombre_Archivo: archivo.fileName,
      ruta_Archivo: 'string',
      tipo_Imagen: 'string',
      contenidoBase64: archivo.base64,
    };

    this.http.post(`${this.apiUrlArchivo}/add`, archivoData).subscribe({
      next: (response: any) => {
        if (response.estado.ack) {
          this.showError('Archivo subido exitosamente.', false);  // Mensaje de éxito
        } else {
          this.showError(`Error al subir el archivo: ${response.estado.errDes}`, true);  // Mensaje de error
        }
      },
      error: (err) => {
        console.error('Error al subir archivo:', err);
        this.showError('Hubo un error al subir el archivo.', true);  // Mensaje de error
      },
    });
  });

  // Limpia los archivos seleccionados después de subirlos
  this.archivosSeleccionados = [];
}

cancelUpload(): void {
  this.archivosSeleccionados = [];
  this.archivosEnBase64 = [];

  // Restablece el valor del input de archivos
  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = ''; // Esto limpia la selección del input
  }

  console.log('Selección de archivos cancelada.');
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


// Abrir el modal para mostrar archivos por grupo
openFileModal(): void {
  this.http.get<any>(`${this.apiUrlArchivo}/ObtenerArchivosPorGrupo/${this.grupoId}`).subscribe({
    next: response => {
      if (response.estado?.ack) {
        // Mapear los archivos obtenidos
        this.archivosPorGrupo = response.body.response.map((archivo: any) => ({
          id: archivo.id,
          grupo_Tarea_Id: archivo.grupo_Tarea_Id,
          nombreArchivo: archivo.nombreArchivo || 'Archivo sin nombre',
          ruta_Archivo: archivo.ruta_Archivo || 'Sin ruta',
          tipo_Imagen: archivo.tipo_Imagen || 'Desconocido',
          contenidoBase64: archivo.contenidoBase64 || '',
        }));

        // Verificar si hay archivos
        if (this.archivosPorGrupo.length === 0) {
          this.showError('No hay archivos disponibles.', false); // Mostrar mensaje amigable
          return;
        }

        // Resetear y actualizar la lista paginada
        this.paginaActualArchivos = 1;
        this.actualizarArchivosPaginados();
        this.showFileModal = true; // Abrir el modal si hay archivos
      } else {
        this.showError(`Error al obtener archivos: ${response.estado.errDes}`, true);
      }
    },
    error: error => {
      if (error.status === 404) {
        this.showError('No hay archivos disponibles.', false); // Manejo específico para 404
      } else {
        console.error('Error al obtener los archivos:', error);
        this.showError('Ocurrió un error al obtener los archivos.', true);
      }
    }
  });
}




// Cerrar el modal de archivos
closeFileModal(): void {
  this.showFileModal = false;
}

// Descargar un archivo
downloadFile(archivo: Archivo, event?: Event): void {
  if (event) {
    event.preventDefault(); 
    event.stopPropagation(); 
  }

  if (!archivo.contenidoBase64) {
    this.showError('No hay contenido para este archivo.', true);
    return;
  }

  // Crear un enlace de descarga
  const link = document.createElement('a');
  link.href = `data:${archivo.tipo_Imagen || 'application/octet-stream'};base64,${archivo.contenidoBase64}`;
  link.download = archivo.nombreArchivo || 'archivo_sin_nombre';
  link.click();

  // Limpieza opcional
  link.remove();
}


// Eliminar un archivo
deleteFile(archivoId: number): void {
  if (!archivoId || isNaN(archivoId) || archivoId <= 0) {
    this.showError('El ID del archivo no es válido.', true);
    return;
  }

  this.openConfirmationModal('¿Está seguro de que desea eliminar este archivo?', () => {
    const url = `${this.apiUrlArchivo}/Eliminar/${archivoId}`; // Ajusta la ruta
    this.http.delete<any>(url).subscribe({
      next: response => {
        if (response?.estado?.ack) {
          // Eliminar el archivo de la lista principal
          this.archivosPorGrupo = this.archivosPorGrupo.filter(archivo => archivo.id !== archivoId);

          // Actualizar la lista paginada
          this.actualizarArchivosPaginados();

          this.showSuccess('Archivo eliminado exitosamente.');
        } else {
          this.showError(`Error al eliminar el archivo: ${response?.estado?.errDes || 'Error desconocido'}`, true);
        }
      },
      error: error => {
        console.error('Error al eliminar archivo:', error);
        this.showError('Ocurrió un error al eliminar el archivo.', true);
      }
    });
  });
}


// Actualizar la lista de archivos paginados según la página actual
actualizarArchivosPaginados(): void {
  const inicio = (this.paginaActualArchivos - 1) * this.tamanoPaginaArchivos;
  const fin = inicio + this.tamanoPaginaArchivos;
  this.archivosPorGrupoPaginados = this.archivosPorGrupo.slice(inicio, fin);
}

// Cambiar a una página específica
cambiarPaginaArchivos(pagina: number): void {
  const totalPaginas = this.obtenerTotalPaginasArchivos();
  if (pagina < 1 || pagina > totalPaginas) {
    return;
  }
  this.paginaActualArchivos = pagina;
  this.actualizarArchivosPaginados();
}

// Calcular el número total de páginas
obtenerTotalPaginasArchivos(): number {
  return Math.ceil(this.archivosPorGrupo.length / this.tamanoPaginaArchivos);
}



  /*se implementa la funcion para la descarga de actas en PDF*/
  downloadPDF(actaId: number): void {
    // Filtrar las tareas asociadas al acta seleccionada
    this.filtrarTareasPorActa(actaId);
  
    // Esperar a que las tareas estén listas
    setTimeout(() => {
      const acta = this.actas.find((a) => a.id === actaId);
      if (!acta) {
        alert('No se encontró el acta especificada.');
        return;
      }
  
      if (!this.tareasDelGrupo || this.tareasDelGrupo.length === 0) {
        alert('No hay tareas asociadas al acta.');
        return;
      }
  
      // Crear el documento PDF
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Reporte de Acta N° ${actaId}`, 14, 20);
  
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
        didParseCell: (data: any) => {
          if (data.row.raw && data.row.raw[0] === 'Observaciones') {
            data.cell.styles.cellWidth = 'wrap'; // Envuelve texto largo en Observaciones
          }
        },
      });
  
      // Información de las tareas asociadas
      const tareasInfo = this.tareasDelGrupo.map((tarea) => [
        tarea.id,
        tarea.nombre,
        tarea.estado === 1 ? 'SI' : tarea.estado === 0 ? 'NO' : 'P',
      ]);
  
      doc.text('Tareas Asociadas:', 14, (doc as any).lastAutoTable.finalY + 10);
  
      (doc as any).autoTable({
        head: [['ID Tarea', 'Nombre Tarea', 'Estado']],
        body: tareasInfo,
        startY: (doc as any).lastAutoTable.finalY + 20,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255 },
        bodyStyles: { valign: 'top', halign: 'left' },
      });
  
      // Guardar el PDF
      doc.save(`Acta_${actaId}_Reporte.pdf`);
    }, 1000);
  }
  

}