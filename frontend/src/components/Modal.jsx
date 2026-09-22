export default function Modal({ titulo, children, onCerrar }) {
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
