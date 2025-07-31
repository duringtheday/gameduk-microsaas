import React, { useState, useRef, useEffect } from 'react';
import '../styles/CertificateForm.css'
// import seal from '../assets/logo-academia-x.webp'
import badge from '../assets/images-verified-2.png'
import { useReactToPrint } from 'react-to-print';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CertificateForm() {
  // Estado para el sello de “Aprendizaje Verificado”
  const [sealUrl, setSealUrl] = useState(null)

  const handleSealFile = e => {
    const file = e.target.files[0]
    if (file) setSealUrl(URL.createObjectURL(file))
  }
  const [logoUrl, setLogoUrl] = useState(null)
  const [issuer, setIssuer] = useState('Responsable')
  const [issuerLogoUrl, setIssuerLogoUrl] = useState(null)
  const [userName, setUserName] = useState('Tu Nombre Aquí')
  const [issueDate, setIssueDate] = useState('') // YYYY-MM-DD

  // Nuevos estados para firma
  const [signatureFileUrl, setSignatureFileUrl] = useState(null)
  const [signatureText, setSignatureText] = useState('Nombre Firmante')

  // — FLAGS para “Emitido por” —
  // showIssuerText = true si el usuario ingresó texto en el input "issuer"
  const showIssuerText = issuer.trim() !== ''
  // showIssuerLogo = true si hay una URL de logo cargada
  const showIssuerLogo = Boolean(issuerLogoUrl)

  // ─── Refs para enfocar campos al editar ────────────────────────────────────
  const logoInputRef = useRef(null)
  const issuerInputRef = useRef(null)
  const issuerLogoInputRef = useRef(null)
  const sealInputRef = useRef(null)
  const userNameRef = useRef(null)
  const issueDateRef = useRef(null)
  const signatureFileRef = useRef(null);
  const signatureTextRef = useRef(null)
  // referencia al certificado
  const certificateRef = useRef();

  const signatureCanvasRef = useRef(null);
  const clearCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // ─── Estado para el slide del formulario ────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'logo',           // Subir Logo
    'issuerText',     // Emitido por (texto)
    'issuerLogo',     // Emitido por (imagen)
    'userName',       // Nombre completo
    'issueDate',      // Fecha emisión
    'signature'       // Firma
  ];


  // // función de impresión
  // const handlePrint = useReactToPrint({
  //   content: () => certificateRef.current,
  //   documentTitle: 'Certificado',
  //   // pageStyle: `
  //   //   @page { size: A4 landscape; margin: 0; }
  //   //   body { margin: 0; }
  //   // `,
  // })

  const handlePrint = () => {
    window.print();
  };

  const handleLogo = e => {
    const file = e.target.files[0]
    if (file) setLogoUrl(URL.createObjectURL(file))
  }

  const handleIssuerLogo = e => {
    const file = e.target.files[0]
    if (file) setIssuerLogoUrl(URL.createObjectURL(file))
  }

  // DESPUÉS
  const handleSignatureFile = e => {
    e.preventDefault();
    let file;
    if (e.dataTransfer && e.dataTransfer.files.length) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files && e.target.files.length) {
      file = e.target.files[0];
    }
    if (file) setSignatureFileUrl(URL.createObjectURL(file));
  };



  // ─── Manejador genérico de archivos ───────────────────────────────────────
  const handleFile = (e, setter) => {
    const file = e.target.files[0]
    if (file) setter(URL.createObjectURL(file))
  }




  // HOOKS FIRMA
  const [brushColor, setBrushColor] = useState('#1446A9');
  const [brushSize, setBrushSize] = useState(2);
  const [showSignatureTools, setShowSignatureTools] = useState(false);
  // Qué tipo de firma está activa: 'image' | 'text' | 'draw'
  const [signatureMethod, setSignatureMethod] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);


  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getXY = e => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handlePointerDown = e => {
      e.preventDefault();
      const { x, y } = getXY(e);
      drawing = true;
      lastX = x;
      lastY = y;
      // establece color y grosor actuales
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    };
    const handlePointerMove = e => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getXY(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
    };
    const handlePointerUp = e => {
      drawing = false;
    };

    // Pointer events cubren mouse, touch y stylus
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [brushColor, brushSize]);


  // Captura el contenido del canvas y lo guarda como imagen
  const handleAcceptSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureFileUrl(dataUrl);
    setShowSignatureTools(false);
  };


  // ─── Limpiar campo ─────────────────────────────────────────────────────────
  const clear = setter => () => setter('')

  // const clearCanvas = () => {
  //   const canvas = signatureCanvasRef.current;
  //   if (canvas) {
  //     const ctx = canvas.getContext('2d');
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   }
  // };



  // IMPRIMIR/DESCARGAR EN "PDF"
  // const handleGeneratePDF = async () => {
  //   const certificateElement = document.querySelector(".certificate");

  //   // Ocultar botón de imprimir
  //   const printButton = certificateElement.querySelector(".print-btn");
  //   if (printButton) printButton.style.display = "none";

  //   // Capturamos el certificado
  //   const canvas = await html2canvas(certificateElement, {
  //     scale: 4,
  //     useCORS: true,
  //     backgroundColor: "#3B0F91",
  //   });

  //   // Restauramos el botón
  //   if (printButton) printButton.style.display = "";

  //   const imgData = canvas.toDataURL("image/png");

  //   // Creamos el PDF a tamaño A4
  //   const pdf = new jsPDF({
  //     orientation: "landscape",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   // Ancho y alto del PDF (milímetros)
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = pdf.internal.pageSize.getHeight();

  //   // Aquí rellenamos TODA la hoja A4 (aunque estire un poco)
  //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  //   pdf.save("Certificado.pdf");
  // };




  // CONFIGURAMOS react-to-print:
  // const handlePrint = () => {
  //     // 1) Clonamos el HTML del certificado
  //     const certificateHtml = certificateRef.current.outerHTML;

  //     // 2) Abrimos ventana de impresión
  //     const printWindow = window.open("", "_blank", "width=1200,height=800");
  //     printWindow.document.write(`
  //       <html>
  //         <head>
  //           <link rel="stylesheet" href="/print.css" />
  //           <!-- si necesitas otros estilos, inclúyelos aquí -->
  //         </head>
  //         <body>
  //           ${certificateHtml}
  //         </body>
  //       </html>
  //     `);
  //     printWindow.document.close();

  //     // 3) Esperamos a que cargue todo
  //     printWindow.focus();
  //     printWindow.onload = () => {
  //       printWindow.print();
  //       printWindow.close();
  //     };
  //   };



  return (
    <div className="certificate-form-container">
      {/* ─── Vista Previa del Certificado ──────────────────────────────────────── */}
      <section className="preview-section" >
        <div className="certificate" ref={certificateRef}>
          {/* LOGO DEL CURSO */}
          <div className="certificate-header-block">
            {logoUrl ? (
              <img
                src={logoUrl}
                className="cert-logo editable-logo"
                onClick={() => logoInputRef.current.click()}
              />
            ) : (
              <div
                className="cert-logo editable-logo empty"
                onClick={() => logoInputRef.current.click()}
              />
            )}
            {/* TÍTULO */}
            <h1 className="cert-header editable-text" contentEditable suppressContentEditableWarning>
              Certificado de Finalización
            </h1>
          </div>
          <div className="certificate-body-block">
            {/* cinta y sello */}
            <div className="ribbon" />
            {/* SELLO */}
            {sealUrl ? (
              <img
                src={sealUrl}
                className="verified-stamp editable-seal"
                onClick={() => sealInputRef.current.click()}
              />
            ) : (
              <div
                className="verified-stamp editable-seal empty"
                onClick={() => sealInputRef.current.click()}
              />
            )}

            <input
              ref={sealInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) setSealUrl(URL.createObjectURL(file))
              }}
            />



            {/* SUBTÍTULO */}
            <p
              className="cert-validate editable-text"
              contentEditable
              suppressContentEditableWarning
            >
              Este certificado valida que
            </p>

            {/* NOMBRE DEL USUARIO */}
            <h2
              className="cert-name editable-text"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setUserName(e.target.innerText)}
            >
              {userName}
            </h2>

            {/* TEXTO INTERMEDIO */}
            <p
              className="cert-complete editable-text"
              contentEditable
              suppressContentEditableWarning
            >
              ha completado exitosamente el reto
            </p>

            {/* CURSO */}
            <h3
              className="cert-course editable-text"
              contentEditable
              suppressContentEditableWarning
            >
              Desafío de Storytelling con Datos
            </h3>


            {/* fechas, emisor y firma en una sola fila */}
            <div className="cert-details">
              {/* 1) Emitido el */}
              {/* FECHA */}
              <div className="detail-item date-container">
                <span className="detail-label">Emitido el:</span>

                <span
                  className="detail-value editable-date"
                  onClick={() => issueDateRef.current.showPicker()}
                >
                  {issueDate
                    ? new Date(issueDate).toLocaleDateString('es-ES', {
                      day: 'numeric',

                      month: 'long',
                      year: 'numeric'
                    })
                    : 'Haz clic para elegir fecha'}
                </span>

                <input
                  ref={issueDateRef}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="date-hidden-input"
                />
              </div>




              {/* 2) Emitido por */}
              {/* EMISOR */}
              <div
                className={
                  `detail-item issuer-item` +
                  (issuer.trim() ? ' has-text' : '') +
                  (issuerLogoUrl ? ' has-logo' : '')
                }
              >
                <span className="detail-label">Emitido por:</span>

                {/* Texto editable */}
                <span
                  className="detail-value editable-issuer-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setIssuer(e.target.innerText)}
                >
                  {issuer}
                </span>

                {/* Logo editable */}
                {issuerLogoUrl ? (
                  <img
                    src={issuerLogoUrl}
                    className="issuer-logo-img editable-issuer-logo"
                    onClick={() => issuerLogoInputRef.current.click()}
                  />
                ) : (
                  <div
                    className="issuer-logo-img editable-issuer-logo empty"
                    onClick={() => issuerLogoInputRef.current.click()}
                  />
                )}

                <input
                  ref={issuerLogoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) setIssuerLogoUrl(URL.createObjectURL(file))
                  }}
                />
              </div>


              {/* 3) Firma */}
              {/* FIRMA */}
              <div className="detail-item signature-item">
                <div className="signature-box">
                  {signatureFileUrl ? (
                    <img
                      src={signatureFileUrl}
                      alt="Firma cargada"
                      className="signature-img editable-signature"
                      onClick={() => signatureFileRef.current.click()}
                    />
                  ) : (
                    <span
                      className="signature-name editable-signature-text"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => setSignatureText(e.target.innerText)}
                      onClick={() => signatureFileRef.current.click()}
                    >
                      {signatureText}
                    </span>
                  )}
                  <input
                    ref={signatureFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden-input"
                    onChange={e => handleFile(e, setSignatureFileUrl)}
                  />
                  <span className="signature-role">Cargo Firmante</span>
                </div>
              </div>

            </div>

            {/* verificación blockchain */}
            {/* FOOTER */}
            <div className="cert-footer">
              <img src={badge} alt="Blockchain Badge" className="badge-icon" />
              <span
                className="verify-text editable-footer-text"
                contentEditable
                suppressContentEditableWarning
              >
                Verificar en: gameduk.com/verify/ID_UNICO_BLOCKCHAIN
              </span>
            </div>

            {/* botón imprimir */}
            <button
              type="button"
              className="print-btn"
              onClick={handlePrint}
            >
              {/* <button
            onClick={() => window.print()}
            className="print-btn no-capture"
          > */}
              {/* Descargar/Imprimir */}
              Imprimir
            </button>

          </div>
        </div>
        {/* ─── Formulario ───────────────────────────────────────────────────────── */}

        <aside className="form-section form-slider">
          <button
            className="slider-arrow left"
            onClick={() => setCurrentStep(s => Math.max(s - 1, 0))}
          >‹</button>

          <div
            className="slides"
            // desplazamiento = paso × (100 / númeroDePasos)%
            style={{
              transform: `translateX(-${currentStep * (100 / steps.length)}%)`
            }}
            onKeyDown={e => { if (e.key === 'Enter') setCurrentStep(s => Math.min(s + 1, steps.length - 1)); }}
            tabIndex={0}
          >
            {/* ▶️ Paso: Subir Logo (logo input) */}
            <div className="slide">
              <div
                className="form-group drop-zone"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const file = e.dataTransfer.files[0];
                  if (file) setLogoUrl(URL.createObjectURL(file));
                }}
              >
                <label htmlFor="logo" className="file-label">
                  <input
                    ref={logoInputRef}
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogo}
                    style={{ display: 'none' }}
                  />
                  Arrastra o haz clic para subir tu logo
                </label>
                {logoUrl && (
                  <>
                    <img src={logoUrl} alt="Logo cargado" className="cert-logo" />
                    <button type="button" className="btn-clear" onClick={() => setLogoUrl(null)}>
                      🗑️ Borrar logo
                    </button>
                  </>
                )}
              </div>

            </div>
            {/* ▶️ Paso: Emitido por (texto) */}
            <div className="slide">

              <div className="form-group">
                <label htmlFor="issuerText">Emitido por (texto):</label>
                <input
                  type="text"
                  id="issuerText"
                  className="issuer-input"
                  value={issuer}
                  onChange={e => setIssuer(e.target.value)}
                  ref={issuerInputRef}
                />
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => issuerInputRef.current.focus()}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={clear(setIssuer)}
                >
                  🗑️ Borrar
                </button>

              </div>

            </div>

            {/* ▶️ Paso: Emitido por (imagen) */}
            <div className="slide">
              <div
                className="form-group drop-zone"
                onDragOver={e => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const file = e.dataTransfer.files[0];
                  if (file) handleIssuerLogo(e);
                }}
              >
                <label htmlFor="issuerLogo" className="file-label">
                  <input
                    ref={issuerLogoInputRef}
                    type="file"
                    id="issuerLogo"
                    accept="image/*"
                    onChange={e => handleIssuerLogo(e)}
                    style={{ display: 'none' }}
                  />
                  Arrastra o haz clic para subir logo de institución
                </label>
                {issuerLogoUrl && (
                  <>
                    <img
                      src={issuerLogoUrl}
                      alt="Logo de institución"
                      className="issuer-logo-img"
                    />
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => setIssuerLogoUrl(null)}
                    >
                      🗑️ Borrar logo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ▶️ Paso: Nombre Completo */}
            <div className="slide">
              <div className="form-group">
                <label htmlFor="userName">Tu Nombre Completo:</label>
                <input
                  type="text"
                  id="userName"
                  className="issuer-input"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  ref={userNameRef}
                />
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => userNameRef.current.focus()}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={clear(setUserName)}
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>

            {/* ▶️ Paso: Fecha Emisión */}
            <div className="slide">
              <div className="form-group">
                <label htmlFor="issueDate">Fecha de emisión:</label>
                <input
                  ref={issueDateRef}
                  type="date"
                  id="issueDate"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-clear"
                  onClick={clear(setIssueDate)}
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>


            {/* ▶️ Paso 6: Firma (imagen, texto o boceto) */}
            <div className="slide">
              <div className="accordion">

                <div className={`accordion-item ${signatureMethod === 'image' ? 'active' : ''}`}>
                  <div
                    className="accordion-header"
                    onClick={() => setSignatureMethod(signatureMethod === 'image' ? '' : 'image')}
                  >
                    🖼️ Subir imagen de firma
                  </div>
                  {signatureMethod === 'image' && (
                    <div className="accordion-content">
                      <div
                        className="form-group drop-zone"
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                        onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                        onDrop={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('drag-over');
                          handleFile(e, setSignatureFileUrl);
                        }}
                      >
                        <label htmlFor="signatureFile" className="file-label">
                          <input
                            ref={signatureFileRef}
                            type="file"
                            id="signatureFile"
                            accept="image/*"
                            onChange={e => handleFile(e, setSignatureFileUrl)}
                            style={{ display: 'none' }}
                          />
                          Arrastra o haz clic para subir tu firma
                        </label>
                        {signatureFileUrl && (
                          <>
                            <img src={signatureFileUrl} alt="Firma cargada" className="signature-img" />
                            <button type="button" className="btn-clear" onClick={() => setSignatureFileUrl(null)}>
                              🗑️ Borrar firma
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`accordion-item ${signatureMethod === 'text' ? 'active' : ''}`}>
                  <div
                    className="accordion-header"
                    onClick={() => setSignatureMethod(signatureMethod === 'text' ? '' : 'text')}
                  >
                    📝 Escribir firma como texto
                  </div>
                  {signatureMethod === 'text' && (
                    <div className="accordion-content">
                      <div className="form-group">
                        <label htmlFor="signatureText">O escribe tu firma:</label>
                        <input
                          ref={signatureTextRef}
                          id="signatureText"
                          type="text"
                          className="issuer-input"
                          value={signatureText}
                          onChange={e => setSignatureText(e.target.value)}
                        />
                        <button type="button" className="btn-clear" onClick={clear(setSignatureText)}>
                          🗑️ Borrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* --- BLOQUE DRAW --- */}
                {/* ▶️ Paso Boceto de firma */}
                <div className={`accordion-item ${signatureMethod === 'draw' ? 'active' : ''}`}>
                  <div
                    className="accordion-header"
                    onClick={() => setSignatureMethod(signatureMethod === 'draw' ? '' : 'draw')}
                  >
                    ✍️ Boceto de firma
                  </div>
                  {signatureMethod === 'draw' && (
                    <div className="accordion-content">
                      <div className="form-group">
                        {/* botón que abre el modal */}
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => setShowSignatureModal(true)}
                        >
                          Bocetar firma
                        </button>

                        {/* botón inline para borrar firma existente */}
                        {signatureFileUrl && (
                          <button
                            type="button"
                            className="btn-clear"
                            onClick={() => {
                              setSignatureFileUrl(null);
                              clearCanvas();
                            }}
                          >
                            🗑️ Borrar firma
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </div>

          </div>

          <button
            className="slider-arrow right"
            onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))}
          >›</button>
        </aside>

      </section >

      {showSignatureModal && (
        <div className="signature-modal-overlay">
          <div className="signature-modal">
            <canvas
              ref={signatureCanvasRef}
              width={600}
              height={200}
              className="signature-canvas"
            />
            <div className="signature-tools">
              <label>
                Color: <input
                  type="color"
                  value={brushColor}
                  onChange={e => setBrushColor(e.target.value)}
                />
              </label>
              <label>
                Grosor: <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={e => setBrushSize(+e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-clear"
                onClick={clearCanvas}
              >
                🗑️ Borrar boceto
              </button>
              <button
                type="button"
                className="btn-edit"
                onClick={() => {
                  // guardar firma y cerrar modal
                  const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
                  setSignatureFileUrl(dataUrl);
                  setShowSignatureModal(false);
                  clearCanvas();
                }}
              >
                ✔️ Aceptar
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  // descartar y cerrar
                  clearCanvas();
                  setShowSignatureModal(false);
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


    </div >
  )
}







