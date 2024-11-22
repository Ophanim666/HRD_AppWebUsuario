import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

interface UserActa {
  grupo: number;
  acta: number;
  rol: number;
  encargado: number;
  tarea: number;
}

interface Archivo{
  id: string;
  grupo_Tarea_Id: number;
  nombre_Archivo: string;
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
  tareasDelGrupo: Tarea[] = [];
  estadosTarea: EstadoTarea[] = [];
  userActas: UserActa[] = [];

  showModalActa = false;
  searchText: string = '';
  pagedActas: any[] = [];

  archivos: Archivo[] = [];
  uploadedFiles: Archivo[] = [];
  archivosSeleccionados: any[] = [];

  //
  archivosEnBase64: { fileName: string, base64: string }[] = [];


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
    this.listFiles();
  }

// ................................................................................................



// // Maneja la selección de archivo
// onFileSelected(event: Event): void {
//   const input = event.target as HTMLInputElement;
//   if (input.files && input.files.length > 0) {
//     const file = input.files[0];
//     this.uploadFile(file);
//   }
// }

// // Llama al endpoint para agregar un archivo
// uploadFiles(): void {
//   if (!this.selectedFiles.length) {
//     alert('No hay archivos seleccionados.');
//     return;
//   }

//   this.selectedFiles.forEach((file) => {
//     this.uploadFile(file);
//     console.log('Consola:', File);
//   });

//   this.selectedFiles = []; // Limpia la selección después de cargar
// }

// uploadFile(file: File): void {
//   console.log('Consola:', this.archivos);
//   const formData = new FormData();
//   formData.append('file', file);
//   console.log('Consola:', formData);
//   this.http.post(`${this.apiUrlArchivo}/add`, formData).subscribe({
//     next: (response) => {
//       console.log('Archivo subido exitosamente:', response);
//       alert('Archivo subido exitosamente');
//       this.listFiles(); // Actualiza la lista
//     },
//     error: (err) => {
//       console.error(`Error al subir el archivo "${file.name}":`, err);
//       alert('Hubo un error al subir el archivo.');
//     },
//   });
// }

// Función que se llama cuando el usuario selecciona archivos
onFileSelected(event: any): void {
  const files: FileList = event.target.files;
  if (files) {
    this.archivosSeleccionados = Array.from(files);
    this.archivosEnBase64 = [];

    this.archivosSeleccionados.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        this.archivosEnBase64.push({
          base64: base64String.split(',')[1], // Remover el prefijo "data:image/png;base64,"
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  }
}


uploadFiles(): void {
  // Enviar cada archivo en base64 al servidor
  this.archivosEnBase64.forEach(archivo => {
    const archivoData = {
      grupo_Tarea_Id: 9,           // El ID del grupo de tarea
      nombre_Archivo: archivo.fileName,  // Nombre del archivo
      ruta_Archivo: 'string',      // Ruta del archivo (si es necesario)
      tipo_Imagen: 'string',       // Tipo de la imagen (si es necesario)
      contenidoBase64: archivo.base64  // Contenido del archivo en base64
    };

    // Hacer la solicitud HTTP para subir el archivo
    this.http.post(`${this.apiUrlArchivo}/add`, archivoData).subscribe({
      next: (response: any) => {
        console.log('Archivo subido con éxito:', response);
      },
      error: (error) => {
        console.error('Error al subir el archivo:', error);
      }
    });
  });
}


// ..................................................................................................


// ...............................................................................................................
// Llama al endpoint para listar archivos
listFiles(): void {
  this.http.get<any[]>(`${this.apiUrlArchivo}/ListarArchivos`).subscribe({
    next: (response) => {
      this.uploadedFiles = response;
    },
    error: (err) => {
      console.error('Error al listar archivos:', err);
      alert('Hubo un error al obtener la lista de archivos.');
    }
  });
}

// Llama al endpoint para eliminar un archivo por su ID
deleteFile(fileId: number): void {
  this.http.delete(`${this.apiUrlArchivo}/${fileId}`).subscribe({
    next: () => {
      alert('Archivo eliminado exitosamente');
      this.listFiles(); // Actualiza la lista
    },
    error: (err) => {
      console.error('Error al eliminar archivo:', err);
      alert('Hubo un error al eliminar el archivo.');
    }
  });
}

// Llama al endpoint para actualizar un archivo
updateFile(fileId: number, updatedData: any): void {
  this.http.put(`${this.apiUrlArchivo}/${fileId}`, updatedData).subscribe({
    next: () => {
      alert('Archivo actualizado exitosamente');
      this.listFiles(); // Actualiza la lista
    },
    error: (err) => {
      console.error('Error al actualizar archivo:', err);
      alert('Hubo un error al actualizar el archivo.');
    }
  });
}



// .....................................................................................................

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

  // Modificar el método openModalActa para usar el nuevo filtrado
  openModalActa(acta?: Acta): void {
    this.currentActa = acta ? { ...acta } : this.getEmptyActa();

    if (acta && acta.id) {
      this.filtrarTareasPorActa(acta.id);
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
}
