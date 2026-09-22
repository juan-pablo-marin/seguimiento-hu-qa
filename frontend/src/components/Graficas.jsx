import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { ESTADOS } from '../constantes.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Colores para el tema oscuro
const COLOR_TEXTO = '#cbd5e1';
const COLOR_GRID = 'rgba(148, 163, 184, 0.15)';
ChartJS.defaults.color = COLOR_TEXTO;

// Orden de datasets en las barras apiladas (coincide con dataBarras)
const ESTADO_POR_DATASET = ['TERMINADO', 'EN_PROGRESO', 'PENDIENTE'];

export default function Graficas({ estadisticas, filtro, onFiltrar }) {
  if (!estadisticas) return null;

  const { totales, porModulo } = estadisticas;
  const totalHU = totales.PENDIENTE + totales.EN_PROGRESO + totales.TERMINADO;

  // Toggle: si ya está filtrado exactamente igual (mismo estado y módulo), limpia.
  const aplicarFiltro = (estado, moduloId = null) => {
    if (!onFiltrar) return;
    const igual = filtro.estado === estado && filtro.moduloId === moduloId;
    onFiltrar(igual ? { estado: null, moduloId: null } : { estado, moduloId });
  };

  // Atenúa un color cuando hay un filtro de estado activo y no corresponde a ese estado
  const conFoco = (colorHex, estadoValor) => {
    if (!filtro.estado || filtro.estado === estadoValor) return colorHex;
    return colorHex + '40'; // ~25% de opacidad (hex alpha)
  };

  // Grafica de torta: distribucion global de estados (filtra solo por estado)
  const dataTorta = {
    labels: ESTADOS.map((e) => e.etiqueta),
    datasets: [
      {
        data: ESTADOS.map((e) => totales[e.valor]),
        backgroundColor: ESTADOS.map((e) => conFoco(e.color, e.valor)),
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  // Grafica de barras apiladas: HU por modulo segun estado (filtra por estado + módulo)
  const dataBarras = {
    labels: porModulo.map((m) => m.modulo),
    datasets: [
      { label: 'Terminado', data: porModulo.map((m) => m.terminado), backgroundColor: conFoco('#16a34a', 'TERMINADO') },
      { label: 'En progreso', data: porModulo.map((m) => m.en_progreso), backgroundColor: conFoco('#f59e0b', 'EN_PROGRESO') },
      { label: 'Pendiente', data: porModulo.map((m) => m.pendiente), backgroundColor: conFoco('#e11d48', 'PENDIENTE') },
    ],
  };

  const opcionesBarras = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: (evt, els) => {
      evt.native.target.style.cursor = els.length ? 'pointer' : 'default';
    },
    onClick: (_evt, elementos) => {
      if (!elementos.length) return;
      const el = elementos[0];
      const estado = ESTADO_POR_DATASET[el.datasetIndex];
      const modulo = porModulo[el.index];      // la barra clicada = un módulo
      if (estado && modulo) aplicarFiltro(estado, modulo.modulo_id);
    },
    plugins: { legend: { position: 'bottom', labels: { color: COLOR_TEXTO } } },
    scales: {
      x: { stacked: true, ticks: { color: COLOR_TEXTO }, grid: { color: COLOR_GRID } },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { precision: 0, color: COLOR_TEXTO },
        grid: { color: COLOR_GRID },
      },
    },
  };

  const opcionesTorta = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: (evt, els) => {
      evt.native.target.style.cursor = els.length ? 'pointer' : 'default';
    },
    onClick: (_evt, elementos) => {
      if (!elementos.length) return;
      const estado = ESTADOS[elementos[0].index]?.valor;
      if (estado) aplicarFiltro(estado, null);   // torta: global, sin módulo
    },
    plugins: { legend: { position: 'bottom', labels: { color: COLOR_TEXTO } } },
  };

  const pctTerminado = totalHU ? Math.round((totales.TERMINADO / totalHU) * 100) : 0;

  return (
    <section className="graficas">
      <div className="card resumen">
        <h3>Progreso general</h3>
        <div className="big-number">{pctTerminado}%</div>
        <p className="muted">{totales.TERMINADO} de {totalHU} HU terminadas</p>
        <div className="barra-progreso">
          <div className="barra-progreso-fill" style={{ width: `${pctTerminado}%` }} />
        </div>
        <div className="mini-stats">
          <span><b>{totales.PENDIENTE}</b> pendientes</span>
          <span><b>{totales.EN_PROGRESO}</b> en progreso</span>
          <span><b>{totales.TERMINADO}</b> terminadas</span>
        </div>
      </div>

      <div className="card grafica-card">
        <h3>Distribución de estados</h3>
        <p className="grafica-hint muted">Clic en un segmento: filtra ese estado en todos los módulos</p>
        <div className="chart-wrap">
          {totalHU > 0 ? <Pie data={dataTorta} options={opcionesTorta} /> : <p className="muted">Sin datos</p>}
        </div>
      </div>

      <div className="card grafica-card">
        <h3>HU por módulo</h3>
        <p className="grafica-hint muted">Clic en una franja: filtra ese estado solo en ese módulo</p>
        <div className="chart-wrap">
          {porModulo.length > 0 ? <Bar data={dataBarras} options={opcionesBarras} /> : <p className="muted">Sin datos</p>}
        </div>
      </div>
    </section>
  );
}
