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


  // Descargar como PDF A4
  const handleGeneratePDF = async () => {
    if (!certificateRef.current) return;
    const el = certificateRef.current;

    // 1. Ocultar sólo los iconos de carga
    const icons = el.querySelectorAll(`
      .upload-icon,
      .folder-sign,
      .editable-logo.empty,
      .editable-seal.empty,
      .editable-issuer-logo.empty,
      .issuer-logo-img.empty,
      .signature-text-upload
  `);
    const prevDisplay = Array.from(icons).map(icon => icon.style.display);
    icons.forEach(icon => icon.style.display = 'none');

    // 2. Forzar fondo sólido con el primer color de bgColors
    const originalBgImage = el.style.backgroundImage;
    const originalBgColor = el.style.backgroundColor;
    el.style.backgroundImage = '';
    el.style.backgroundColor = bgColors[0];

    // 3. Capturar con html2canvas respetando degradados / colores
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: bgColors[0]
    });

    // 4. Restaurar fondo e iconos
    el.style.backgroundImage = originalBgImage;
    el.style.backgroundColor = originalBgColor;
    icons.forEach((icon, i) => icon.style.display = prevDisplay[i] || '');

    // 5. Generar PDF A4 landscape
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save('Certificado_A4.pdf');
  };

//  ---------- terminar bloque "generar pdf" -------------

//  -----------------------------------------------------




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



  // --- CONTROL COLORS ---
  const [bgColors, setBgColors] = useState(['#1E0D6E', '#5D14A8']);
  const removeColorStop = i => {
    if (bgColors.length > 1) {
      const newCols = bgColors.filter((_, idx) => idx !== i);
      setBgColors(newCols);
    }
  };

  // función para calcular luminancia y poder ordenar colores
  function hexToLuminance(hex) {
    const c = hex.slice(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    // fórmula de luminancia relativa
    return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  }

  // --- RIBBON - extrae color más claro y más oscuro para la cinta
  const sorted = [...bgColors].sort((a, b) => hexToLuminance(a) - hexToLuminance(b));

  // const ribbonStops = [sorted[0], sorted[sorted.length - 1]];
  // Calculamos luminancia promedio para decidir un borde contrastante:
  const avgLuminance =
    bgColors.reduce((sum, c) => sum + hexToLuminance(c), 0) / bgColors.length;

  // **RIBBON**: si el fondo es claro (>0.5) usamos los 2 colores más oscuros,
  // si es oscuro, los 2 más claros
  let ribbonStops;
  if (avgLuminance > 0.5) {
    ribbonStops = sorted.slice(0, 2);       // dos más oscuros
  } else {
    ribbonStops = sorted.slice(-2);         // dos más claros
  }
  // --- BORDER - si el fondo en promedio es muy claro (>0.5), elige el más oscuro, sino el más claro:
  const borderColor = avgLuminance > 0.5 ? sorted[0] : sorted[sorted.length - 1];



  // ---- FONTS ----
  // Fuentes disponibles (asegúrate de importarlas o cargarlas vía Google Fonts/CSS)
  const fonts = [
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lora, serif',
    'Montserrat, sans-serif',
    'Pacifico, cursive',
    'Dancing Script, cursive',     // manuscrita elegante
    'Indie Flower, cursive',       // divertida y desenfadada
    'Sue Ellen Francisco, cursive' // estilo caligráfico
  ];
  const [fontFamily, setFontFamily] = useState(fonts[0]);



  // ------------ APPLY FONT (PERSONALIZED) ----------------------
  function applyFont(fontName) {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);

    // Intentamos envolver la selección con un <span>
    const span = document.createElement('span');
    span.style.fontFamily = fontName;
    try {
      range.surroundContents(span);
    } catch {
      // Fallback si la selección cruza nodos
      document.execCommand('fontName', false, fontName);
    }

    sel.removeAllRanges();
  }




  // ------------ GENERAR CERTIFICADO ----------------------
  // al inicio del componente, junto a los otros useState:
  const [showPreview, setShowPreview] = useState(false);

  // función para abrir/cerrar el modal
  const togglePreview = () => setShowPreview(v => !v);




  // eliminar editable del modal para previsualizar
  const getSanitizedHTML = () => {
    if (!certificateRef.current) return '';
    // 1. Eliminamos cualquier atributo contenteditable="..." y suppressContentEditableWarning
    // 2. También quitamos en línea cualquier input, botón de carpeta y drag-zones
    return certificateRef.current.innerHTML
      .replace(/contenteditable="[^"]*"/g, '')
      .replace(/suppressContentEditableWarning/g, '')
      .replace(/<input[\s\S]*?>/g, '')
      .replace(/<button[^>]*class="upload-icon"[\s\S]*?<\/button>/g, '');
  };




  return (
    <div className="certificate-form-container">
      {/* ─── Vista Previa del Certificado ──────────────────────────────────────── */}
      <section className="preview-section" >
        <div
          className="certificate"
          ref={certificateRef}
          style={{
            backgroundImage: `linear-gradient(to right, ${bgColors.join(',')})`,
            border: `5px solid ${borderColor}`,
            fontFamily: fontFamily,
          }}
        >
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
            <div className="ribbon"
              style={{
                background: `linear-gradient(to bottom, ${ribbonStops.join(',')})`
              }}
            />
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
                  onClick={() => {
                    // enfocamos el input y luego abrimos el picker
                    issueDateRef.current.focus();
                    issueDateRef.current.showPicker();
                  }}
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
                  onChange={e => setIssueDate(e.target.value)}
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
                    <div className="signature-text-upload">
                      <span
                        className="signature-name editable-signature-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => setSignatureText(e.target.innerText)}
                      >
                        {signatureText}
                      </span>
                      {/* icono de carpeta que abre el file picker */}
                      <button
                        type="button"
                        className="upload-icon"
                        onClick={() => signatureFileRef.current.click()}
                        title="Subir imagen de firma"
                      >
                        <small className='folder-sign'>📂</small>
                      </button>
                    </div>
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


          </div>
        </div>


        {/* -------- CERTIFICATE BAR (colors & fonts) ---------- */}
        <div className='certificate-bar'>

          {/* ─── BARRA DE SELECCIÓN DE FUENTE ─────────────────────────────────────── */}
          <div className="font-picker">
            <label htmlFor="fontPicker">Fuente:</label>
            <select id="fontPicker" onChange={e => applyFont(e.target.value)}>
              <option value="Segoe UI, sans-serif">Segoe UI</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Open Sans, sans-serif">Open Sans</option>
              <option value="Lora, serif">Lora</option>
              <option value="Montserrat, sans-serif">Montserrat</option>
              <option value="Pacifico, cursive">Pacifico</option>
              <option value="Dancing Script, cursive">Dancing Script</option>
              <option value="Indie Flower, cursive">Indie Flower</option>
              <option value="Sue Ellen Francisco, cursive">Sue Ellen Francisco</option>
            </select>
          </div>



          {/* ─── BARRA DE CONTROL DE FONDO ───────────────────────────────────────────────────────── */}
          <div className="color-control-bar">
            {bgColors.map((col, i) => (
              <div key={i} className="color-stop">
                <input
                  type="color"
                  value={col}
                  onChange={e => {
                    const newCols = [...bgColors];
                    newCols[i] = e.target.value;
                    setBgColors(newCols);
                  }}
                />
                {bgColors.length > 1 && (
                  <button
                    type="button"
                    className="remove-color-stop"
                    onClick={() => removeColorStop(i)}
                  >−</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-color-stop"
              onClick={() => setBgColors([...bgColors, '#ffffff'])}
            >＋</button>

          </div>

        </div>


        {/* ─── ASIDE FORM ───────────────────────────────────────────────────────── */}

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

        {/* botón Generar Certificado */}
        <div className="generate-btn-container">
          <button
            type="button"
            className="btn-generate"
            onClick={togglePreview}
          >
            Generar Certificado
          </button>
        </div>

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

      {showPreview && (
        <div className="preview-modal-overlay" onClick={togglePreview}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={togglePreview}>×</button>
            {/* clona o referencia el certificado */}
            <div className="preview-content">
              {/* puedes clonar con innerHTML o renderizar el mismo JSX */}
              <div
                className="certificate"
                contentEditable={false}
                dangerouslySetInnerHTML={{ __html: getSanitizedHTML() }}
                style={{
                  backgroundImage: `linear-gradient(to right, ${bgColors.join(',')})`,
                  border: `5px solid ${borderColor}`,
                  fontFamily: fontFamily,
                }}
              />
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

            {/* Botón Descargar */}
            <button
              type="button"
              className="print-btn"
              onClick={handleGeneratePDF}
            >
              Descargar PDF
            </button>
          </div>
        </div>
      )}


    </div >
  )
}







