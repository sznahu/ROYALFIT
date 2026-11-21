// ======================
// CONFIGURACIÓN
// ======================
const NUMERO_WHATSAPP = "5493644172141"; // Con código de país, sin + ni espacios.
const CLAVE_CARRITO = "carrito-royalfit";

// Carrito: { "1": { nombre, precio, cantidad }, ... }
let carrito = {};
let total = 0;
let productoModal = null;

// ======================
// ELEMENTOS
// ======================
const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
const formato = numero => Number(numero || 0).toLocaleString("es-AR");

const articulos = $$(".productos article");
const listaCarrito = $("#lista-carrito");
const totalCarrito = $("#total-carrito");
const resumenCompra = $("#resumen-compra");
const buscador = $("#buscador");
const filtroCategoria = $("#filtro-categoria");
const sinResultados = $("#sin-resultados");
const nombreCliente = $("#nombre-cliente");
const telefonoCliente = $("#telefono-cliente");
const direccionCliente = $("#direccion-cliente");

const modal = $("#modal-producto");
const cerrarModalBoton = $("#cerrar-modal");
const modalImagen = $("#modal-imagen-principal");
const modalMiniaturas = $("#modal-miniaturas");
const modalCategoria = $("#modal-categoria");
const modalNombre = $("#modal-nombre");
const modalDescripcion = $("#modal-descripcion");
const modalPrecio = $("#modal-precio");
const modalStock = $("#modal-stock");
const modalAgregar = $("#modal-agregar");
const modalComprar = $("#modal-comprar");

const menuLateral = $("#menu-lateral");
const fondoMenu = $("#fondo-menu");
const botonAbrirMenu = $("#abrir-menu");

// ======================
// UTILIDADES
// ======================
function crearEl(etiqueta, texto = "") {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

function crearBoton(texto, alHacerClic, clase = "") {
  const boton = crearEl("button", texto);
  boton.type = "button";
  if (clase) boton.className = clase;
  boton.addEventListener("click", alHacerClic);
  return boton;
}

function datosProducto(articulo) {
  const precioEl = $(".precio", articulo);
  const stockEl = $(".stock", articulo);
  const categoriaEl = $(".categoria", articulo);
  return {
    id: articulo.dataset.id,
    nombre: $(".nombre-producto", articulo).textContent.trim(),
    precio: Number(precioEl.dataset.precio),
    stock: Number(stockEl.dataset.stock),
    categoria: categoriaEl.dataset.categoria,
    categoriaTexto: categoriaEl.textContent.trim(),
    descripcion: $(".descripcion-producto", articulo).textContent.trim(),
    imagen: $(".imagen-producto", articulo).getAttribute("src"),
    fotos: (articulo.dataset.fotos || "").split(",").map(f => f.trim()).filter(Boolean)
  };
}

function porId(id) {
  return articulos.find(articulo => articulo.dataset.id === String(id));
}

function cantidadEn(id) {
  return carrito[id] ? carrito[id].cantidad : 0;
}

function stockRestante(datos) {
  return Math.max(0, datos.stock - cantidadEn(datos.id));
}

function idsEnCarrito() {
  return Object.keys(carrito).filter(id => carrito[id].cantidad > 0);
}

// ======================
// GUARDADO
// ======================
function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    carrito = guardado && typeof guardado === "object" ? guardado : {};
  } catch (error) {
    carrito = {};
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch (error) {
    alert("No se pudo guardar el carrito en este navegador.");
  }
}

// ======================
// ACTUALIZACIÓN DE LA PANTALLA
// ======================
function actualizarStock(articulo) {
  const datos = datosProducto(articulo);
  const restante = stockRestante(datos);
  $(".stock", articulo).textContent = restante > 0
    ? `Stock: ${restante} unidades`
    : "Sin stock disponible";
  $(".agregar-carrito", articulo).disabled = restante === 0;
  $(".comprar-directo", articulo).disabled = restante === 0;
}

function actualizarModalStock() {
  if (!productoModal) return;
  const restante = stockRestante(datosProducto(productoModal));
  modalStock.textContent = restante > 0
    ? `Stock disponible: ${restante} unidades`
    : "Sin stock disponible";
  modalAgregar.disabled = restante === 0;
  modalComprar.disabled = restante === 0;
}

function mostrarCarrito() {
  listaCarrito.replaceChildren();
  total = 0;

  const ids = idsEnCarrito();
  if (ids.length === 0) {
    listaCarrito.appendChild(crearEl("p", "🛒 Tu carrito está vacío"));
  }

  ids.forEach(id => {
    const item = carrito[id];
    const articulo = porId(id);
    if (!articulo) return;
    const datos = datosProducto(articulo);
    total += item.precio * item.cantidad;

    const tarjeta = document.createElement("div");
    tarjeta.className = "producto-carrito";

    const imagen = document.createElement("img");
    imagen.src = datos.imagen;
    imagen.alt = item.nombre;

    const botonMenos = crearBoton("-", () => cambiarCantidad(id, -1));
    botonMenos.disabled = item.cantidad <= 1;
    const botonMas = crearBoton("+", () => cambiarCantidad(id, 1));
    botonMas.disabled = item.cantidad >= datos.stock;
    const botonEliminar = crearBoton("Eliminar", () => {
      delete carrito[id];
      guardarCarrito();
      actualizarTodo();
    }, "eliminar-producto");

    tarjeta.append(
      crearEl("h3", item.nombre),
      imagen,
      crearEl("p", `Precio: $${formato(item.precio)}`),
      crearEl("p", `Cantidad: ${item.cantidad}`),
      botonMenos,
      botonMas,
      botonEliminar
    );
    listaCarrito.appendChild(tarjeta);
  });

  totalCarrito.textContent = `Total: $${formato(total)}`;
}

function armarResumen() {
  const ids = idsEnCarrito();
  if (ids.length === 0) return "";

  const lineas = [
    "Nuevo pedido - ROYALFIT",
    "",
    "DATOS DEL CLIENTE",
    `Cliente: ${nombreCliente.value.trim()}`,
    `Teléfono: ${telefonoCliente.value.trim()}`,
    `Dirección: ${direccionCliente.value.trim()}`,
    "",
    "PRODUCTOS"
  ];

  ids.forEach(id => {
    const item = carrito[id];
    lineas.push(`${item.nombre} x${item.cantidad} - $${formato(item.precio * item.cantidad)}`);
  });

  lineas.push("", `TOTAL: $${formato(total)}`);
  return lineas.join("\n");
}

function actualizarTodo() {
  mostrarCarrito();
  resumenCompra.textContent = armarResumen();

  const cantidadTotal = idsEnCarrito().reduce((suma, id) => suma + carrito[id].cantidad, 0);
  $("#contador-carrito").textContent = cantidadTotal;
  $$(".contador-carrito-lateral").forEach(el => el.textContent = cantidadTotal);

  articulos.forEach(actualizarStock);
  actualizarModalStock();
}

// ======================
// CARRITO
// ======================
function agregarAlCarrito(articulo) {
  const datos = datosProducto(articulo);
  if (stockRestante(datos) <= 0) {
    alert("No hay más stock disponible de este producto.");
    return false;
  }

  const item = carrito[datos.id] || { nombre: datos.nombre, precio: datos.precio, cantidad: 0 };
  item.cantidad += 1;
  carrito[datos.id] = item;

  guardarCarrito();
  actualizarTodo();
  return true;
}

function cambiarCantidad(id, cambio) {
  const item = carrito[id];
  if (!item) return;

  const datos = datosProducto(porId(id));
  if (cambio > 0 && item.cantidad >= datos.stock) {
    alert("No hay más stock disponible.");
    return;
  }
  if (item.cantidad + cambio < 1) return;

  item.cantidad += cambio;
  guardarCarrito();
  actualizarTodo();
}

function comprarDirecto(articulo) {
  if (!agregarAlCarrito(articulo)) return;
  cerrarModal();
  $("#carrito").scrollIntoView({ behavior: "smooth", block: "start" });
  nombreCliente.focus({ preventScroll: true });
}

// ======================
// BUSCADOR Y CATEGORÍAS
// ======================
function filtrarProductos() {
  const texto = buscador.value.trim().toLocaleLowerCase("es");
  const categoria = filtroCategoria.value;
  let encontrados = 0;

  articulos.forEach(articulo => {
    const datos = datosProducto(articulo);
    const coincideTexto =
      datos.nombre.toLocaleLowerCase("es").includes(texto) ||
      datos.descripcion.toLocaleLowerCase("es").includes(texto);
    const coincide = coincideTexto && (categoria === "todas" || datos.categoria === categoria);

    articulo.hidden = !coincide;
    if (coincide) encontrados++;
  });

  sinResultados.textContent = encontrados === 0 ? "No se encontraron productos" : "";
}

// ======================
// VENTANA DE DETALLES
// ======================
function abrirModal(articulo) {
  productoModal = articulo;
  const datos = datosProducto(articulo);

  modalNombre.textContent = datos.nombre;
  modalCategoria.textContent = datos.categoriaTexto;
  modalDescripcion.textContent = datos.descripcion;
  modalPrecio.textContent = `ARS $${formato(datos.precio)}`;

  const fotos = [...new Set([datos.imagen, ...datos.fotos])];
  modalImagen.src = fotos[0];
  modalImagen.alt = datos.nombre;

  modalMiniaturas.replaceChildren();
  fotos.forEach((src, indice) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = indice === 0 ? "modal-miniatura activa" : "modal-miniatura";
    boton.setAttribute("aria-label", `Ver imagen ${indice + 1}`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    boton.appendChild(img);

    boton.addEventListener("click", () => {
      modalImagen.src = src;
      $$(".modal-miniatura", modalMiniaturas).forEach(mini => mini.classList.toggle("activa", mini === boton));
    });
    modalMiniaturas.appendChild(boton);
  });

  actualizarModalStock();
  modal.classList.add("abierto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-abierto");
}

function cerrarModal() {
  productoModal = null;
  modal.classList.remove("abierto");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-abierto");
}

// ======================
// MENÚ LATERAL
// ======================
function abrirMenu() {
  menuLateral.classList.add("abierto");
  menuLateral.setAttribute("aria-hidden", "false");
  botonAbrirMenu.setAttribute("aria-expanded", "true");
  fondoMenu.hidden = false;
}

function cerrarMenu() {
  menuLateral.classList.remove("abierto");
  menuLateral.setAttribute("aria-hidden", "true");
  botonAbrirMenu.setAttribute("aria-expanded", "false");
  fondoMenu.hidden = true;
}

// ======================
// EVENTOS
// ======================
articulos.forEach(articulo => {
  articulo.tabIndex = 0;
  articulo.addEventListener("click", () => abrirModal(articulo));
  articulo.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target === articulo) abrirModal(articulo);
  });

  $(".ver-detalles", articulo).addEventListener("click", event => {
    event.stopPropagation();
    abrirModal(articulo);
  });
  $(".agregar-carrito", articulo).addEventListener("click", event => {
    event.stopPropagation();
    agregarAlCarrito(articulo);
  });
  $(".comprar-directo", articulo).addEventListener("click", event => {
    event.stopPropagation();
    comprarDirecto(articulo);
  });
});

cerrarModalBoton.addEventListener("click", cerrarModal);
modal.addEventListener("click", event => {
  if (event.target === modal) cerrarModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    cerrarModal();
    cerrarMenu();
  }
});

modalAgregar.addEventListener("click", () => {
  const articulo = productoModal;
  if (articulo && agregarAlCarrito(articulo)) cerrarModal();
});
modalComprar.addEventListener("click", () => {
  if (productoModal) comprarDirecto(productoModal);
});

buscador.addEventListener("input", filtrarProductos);
filtroCategoria.addEventListener("change", filtrarProductos);

// Los enlaces de categoría del menú filtran la lista
$$(".menu-lateral a[data-categoria]").forEach(enlace => {
  enlace.addEventListener("click", () => {
    filtroCategoria.value = enlace.dataset.categoria;
    buscador.value = "";
    filtrarProductos();
  });
});

botonAbrirMenu.addEventListener("click", abrirMenu);
$("#cerrar-menu").addEventListener("click", cerrarMenu);
fondoMenu.addEventListener("click", cerrarMenu);
$$(".menu-lateral a").forEach(enlace => enlace.addEventListener("click", cerrarMenu));

[nombreCliente, telefonoCliente, direccionCliente].forEach(campo => {
  campo.addEventListener("input", () => {
    resumenCompra.textContent = armarResumen();
  });
});

$("#vaciar-carrito").addEventListener("click", () => {
  if (!confirm("¿Eliminar todos los productos del carrito?")) return;
  carrito = {};
  guardarCarrito();
  actualizarTodo();
});

$("#seguir-comprando").addEventListener("click", () => {
  $("#productos").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#enviar-whatsapp").addEventListener("click", () => {
  if (idsEnCarrito().length === 0) {
    alert("El carrito está vacío.");
    return;
  }
  if (!nombreCliente.value.trim()) {
    alert("Ingresá tu nombre.");
    nombreCliente.focus();
    return;
  }
  if (direccionCliente.value.trim().length < 5) {
    alert("Ingresá una dirección válida.");
    direccionCliente.focus();
    return;
  }
  if (!/^\d{8,}$/.test(telefonoCliente.value.trim())) {
    alert("Ingresá un teléfono válido con al menos 8 números, sin espacios ni símbolos.");
    telefonoCliente.focus();
    return;
  }

  for (const id of idsEnCarrito()) {
    const datos = datosProducto(porId(id));
    if (carrito[id].cantidad > datos.stock) {
      alert(`Stock insuficiente para ${datos.nombre}.`);
      return;
    }
  }

  const mensaje = armarResumen();
  window.location.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
});

// ======================
// INICIO
// ======================
cargarCarrito();
actualizarTodo();
filtrarProductos();