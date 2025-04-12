let equipoActual = 0;
let tiempoPorEquipoMin = 0;
let tiempoRestante = 0;
let timer;
let horaInicio = null;
let equiposIniciales = 0;
let objetivoGlobal = 0;
let duracionTurno = 0;

const endpoint = "https://charming-hen-19295.upstash.io";
const token = "AUtfAAIjcDFiMDViMjEyN2MyZjM0YjNmYmVlM2I0MGY1MjViMzAxZnAxMA";

// Función para leer el valor
async function getContador() {
  const res = await fetch(`${endpoint}/get/contador`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return parseInt(data.result || "0");
}

async function guardarEstadoGlobal(equipoInicial, tiempoPorEquipo,objetivoGlobal,duracionTurno,tiempoPorEquipoMin) {
  const estado = {
    inicio: Date.now(),
    equipoInicial: equipoInicial,
    tiempoPorEquipo: tiempoPorEquipo,
    objetivoGlobal: objetivoGlobal,
    duracionTurno: duracionTurno,
    tiempoPorEquipoMin: tiempoPorEquipoMin
  };
  await fetch(`${endpoint}/set/estadoProduccion/${encodeURIComponent(JSON.stringify(estado))}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function cargarYActualizarTemporizador() {
  const res = await fetch(`${endpoint}/get/estadoProduccion`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  if (data && data.result) {
    try {
      const estado = JSON.parse(data.result);
      const { inicio, equipoInicial, tiempoPorEquipo, objetivoGlobal, duracionTurno, tiempoPorEquipoMin } = estado;

      setInterval(() => {
        const ahora = Date.now();
        const tiempoPasado = Math.floor((ahora - inicio) / 1000); // en segundos
        const equiposPasados = Math.floor(tiempoPasado / tiempoPorEquipo);
        const tiempoRestante = tiempoPorEquipo - (tiempoPasado % tiempoPorEquipo);

        const equipoActual = equipoInicial + equiposPasados;
        document.getElementById("equipoActualDisplay").textContent = equipoActual;
        document.getElementById("temporizador").textContent = formatTime(tiempoRestante);
        document.getElementById("infoProduccion").style.display = "block";
        document.getElementById("resetBtn").style.display = "inline-block";
      }, 1000);
      mostrarResumenTurno(new Date(inicio).toLocaleTimeString(), duracionTurno, objetivoGlobal, equipoInicial + objetivoGlobal - 1);
      document.getElementById("tiempoPorEquipo").innerText = tiempoPorEquipoMin;
    } catch (err) {
      console.error("Error al parsear estado:", err);
    }
  }
}


function pedirContraseña() {
  const clave = prompt("Ingrese la contraseña:");
  if (clave === "FC") {
    document.getElementById("configuracion").style.display = "block";
  } else {
    alert("Contraseña incorrecta.");
  }
}

function iniciarProduccion() {
  equiposIniciales = parseInt(document.getElementById("equipoInicial").value);
  objetivoGlobal = parseInt(document.getElementById("objetivoDiario").value);
  duracionTurno = parseInt(document.getElementById("duracionTurno").value);

  tiempoPorEquipoMin = duracionTurno / objetivoGlobal;
  const tiempoPorEquipoSeg = tiempoPorEquipoMin * 60;

  guardarEstadoGlobal(equiposIniciales, tiempoPorEquipoSeg,objetivoGlobal,duracionTurno,tiempoPorEquipoMin);

  document.getElementById("tiempoPorEquipo").textContent = tiempoPorEquipoMin.toFixed(2);
  mostrarResumenTurno();
  cargarYActualizarTemporizador(); // empiezo a mostrarlo en pantalla
  document.getElementById("configuracion").style.display = "none";
}



function iniciarTemporizador() {
  clearInterval(timer);

  try{
    timer = setInterval(() => {
      if (tiempoRestante <= 0) {
        avanzarEquipo();
        lanzarConfetti();
        tiempoRestante = tiempoPorEquipoMin * 60;
      } else {
        finalizarProduccion();
        tiempoRestante--;
      }
    
      // Mostrar en pantalla
      document.getElementById("temporizador").textContent = formatTime(tiempoRestante);
      document.getElementById("equipoActualDisplay").textContent = equipoActual;
    
      // Guardar estado actual
      guardarEstado();
    }, 1000);
        
  } catch(err){
    console.error("Error en el temporizador:", err);
  }
}

function finalizarProduccion() {
  clearInterval(timer);
  setContador(0);
  setContador("estado", ""); // Borra el estado
}

function avanzarEquipo() {
  equipoActual++;
  document.getElementById("equipoActualDisplay").textContent = equipoActual;
}

function formatTime(segundos) {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function lanzarConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

async function resetearProduccion() {
  const confirmacion = confirm("¿Estás seguro de que querés reiniciar la producción?");
  if (!confirmacion) return;

  await fetch(`${endpoint}/del/estadoProduccion`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  location.reload();
}


function mostrarResumenTurno(hora,duracionTurno,objetivoGlobal,equipoFinalEsperado) {

  const resumenHTML = `
    <p><strong>Hora de inicio:</strong> ${hora}</p>
    <p><strong>Duración del turno:</strong> ${(duracionTurno / 60)} horas</p>
    <p><strong>Objetivo:</strong> ${objetivoGlobal} equipos</p>
    <p><strong>Debés llegar hasta el equipo:</strong> ${equipoFinalEsperado}</p>
  `;
  document.getElementById("resumenTurno").innerHTML = resumenHTML;
}

window.addEventListener("DOMContentLoaded", () => {
  cargarYActualizarTemporizador(); // Carga automáticamente si ya hay algo
});
