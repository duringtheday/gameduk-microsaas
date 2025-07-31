import React, { useState, useRef } from 'react'
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
  const signatureFileRef = useRef(null)
  const signatureTextRef = useRef(null)
  // referencia al certificado
  const certificateRef = useRef();

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

  const handleSignatureFile = e => {
    const file = e.target.files[0]
    if (file) setSignatureFileUrl(URL.createObjectURL(file))
  }


  // ─── Manejador genérico de archivos ───────────────────────────────────────
  const handleFile = (e, setter) => {
    const file = e.target.files[0]
    if (file) setter(URL.createObjectURL(file))
  }


  // ─── Limpiar campo ─────────────────────────────────────────────────────────
  const clear = setter => () => setter('')



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
      {/* ─── Formulario ───────────────────────────────────────────────────────── */}
      <aside className="form-section">
        <h2>Construye tu Certificado</h2>

        {/* ─── Logo del curso con drag & drop + preview ───────────────────── */}
        <div
          className="form-group drop-zone"
          onDragOver={e => {
            e.preventDefault()
            e.currentTarget.classList.add('drag-over')
          }}
          onDragLeave={e =>
            e.currentTarget.classList.remove('drag-over')
          }
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) {
              const url = URL.createObjectURL(file)
              setLogoUrl(url)
            }
          }}
        >
          <label htmlFor="logo" className="file-label">
            <input
              ref={logoInputRef}
              type="file"
              id="logo"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0]
                if (file) setLogoUrl(URL.createObjectURL(file))
              }}
              style={{ display: 'none' }}
            />
            Arrastra o haz clic para subir tu logo
          </label>

          {logoUrl && (
            <>
              {/* preview del logo justo aquí */}
              <img
                src={logoUrl}
                alt="Logo cargado"
                className="cert-logo"
              />
              {/* botón para borrar el logo */}
              <button
                type="button"
                className="btn-clear"
                onClick={() => setLogoUrl(null)}
              >
                🗑️ Borrar logo
              </button>
            </>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="issuer">Emitido por (texto):</label>
          <input
            type="text"
            id="issuer"
            className="issuer-input"
            value={issuer}
            onChange={e => setIssuer(e.target.value)}
          />
          <button type="button" className="btn-edit" onClick={() => issuerInputRef.current.focus()}>
            ✏️ Editar
          </button>
          <button type="button" className="btn-clear" onClick={clear(setIssuer)}>
            🗑️ Borrar
          </button>
        </div>

        {/* ─── Logo de la institución con drag & drop + preview ───────────────── */}
        <div
          className="form-group drop-zone"
          onDragOver={e => {
            e.preventDefault()
            e.currentTarget.classList.add('drag-over')
          }}
          onDragLeave={e => {
            e.currentTarget.classList.remove('drag-over')
          }}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) {
              setIssuerLogoUrl(URL.createObjectURL(file))
            }
          }}
        >
          <label htmlFor="issuerLogo" className="file-label">
            {/* input oculto pero clicable */}
            <input
              ref={issuerLogoInputRef}
              type="file"
              id="issuerLogo"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0]
                if (file) setIssuerLogoUrl(URL.createObjectURL(file))
              }}
              style={{ display: 'none' }}
            />
            Arrastra o haz clic para subir logo de institución
          </label>

          {issuerLogoUrl && (
            <>
              {/* preview del logo */}
              <img
                src={issuerLogoUrl}
                alt="Logo de institución cargado"
                className="issuer-logo-img"
              />
              {/* botón borrar */}
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

        {/* ─── Sello de verificación con drag & drop + preview ───────────────── */}
        <div
          className="form-group drop-zone"
          onDragOver={e => {
            e.preventDefault()
            e.currentTarget.classList.add('drag-over')
          }}
          onDragLeave={e =>
            e.currentTarget.classList.remove('drag-over')
          }
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) {
              const url = URL.createObjectURL(file)
              setSealUrl(url)
            }
          }}
        >
          <label htmlFor="sealFile" className="file-label">
            {/* input oculto pero clicable */}
            <input
              ref={sealInputRef}
              type="file"
              id="sealFile"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0]
                if (file) setSealUrl(URL.createObjectURL(file))
              }}
              style={{ display: 'none' }}
            />
            Arrastra o haz clic para subir tu sello
          </label>

          {sealUrl && (
            <>
              {/* preview del sello justo aquí */}
              <img
                src={sealUrl}
                alt="Sello cargado"
                className="signature-img"
              />
              {/* botón para borrar el sello */}
              <button
                type="button"
                className="btn-clear"
                onClick={() => setSealUrl(null)}
              >
                🗑️ Borrar sello
              </button>
            </>
          )}
        </div>


        <div className="form-group">
          <label htmlFor="userName">Tu Nombre Completo:</label>
          <input
            type="text"
            id="userName"
            className="issuer-input"
            value={userName}
            onChange={e => setUserName(e.target.value)}
          />
          <button type="button" className="btn-edit" onClick={() => userNameRef.current.focus()}>
            ✏️ Editar
          </button>
          <button type="button" className="btn-clear" onClick={clear(setUserName)}>
            🗑️ Borrar
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="issueDate">Fecha de emisión:</label>
          <input
            ref={issueDateRef}
            type="date"
            id="issueDate"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
          />
          <button type="button" className="btn-clear" onClick={clear(setIssueDate)}>
            🗑️ Borrar
          </button>
        </div>

        {/* ─── Firma electrónica con drag & drop + preview ──────────────────────── */}
        <div
          className="form-group drop-zone"
          onDragOver={e => {
            e.preventDefault()
            e.currentTarget.classList.add('drag-over')
          }}
          onDragLeave={e =>
            e.currentTarget.classList.remove('drag-over')
          }
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) {
              // crea URL y guarda en estado
              setSignatureFileUrl(URL.createObjectURL(file))
            }
          }}
        >
          <label htmlFor="signatureFile" className="file-label">
            <input
              type="file"
              id="signatureFile"
              accept="image/*"
              onChange={e => handleFile(e, setSignatureFileUrl)}
              style={{ display: 'none' }}
            />
            Arrastra o haz clic para subir tu firma
          </label>
        </div>

        {signatureFileUrl && (
          <>
            {/* muestra mini‑preview de la firma */}
            <img
              src={signatureFileUrl}
              alt="Firma cargada"
              className="signature-img"
            />
            {/* botón borrar firma */}
            <button
              type="button"
              className="btn-clear"
              onClick={() => setSignatureFileUrl(null)}
            >
              🗑️ Borrar
            </button>
          </>
        )}

        <div className="form-group">
          <label htmlFor="signatureText">O escribe tu firma:</label>
          <input
            type="text"
            id="signatureText"
            className="issuer-input"
            value={signatureText}
            onChange={e => setSignatureText(e.target.value)}
          />
          <button type="button" className="btn-edit" onClick={() => signatureTextRef.current.focus()}>
            ✏️ Editar
          </button>
          <button type="button" className="btn-clear" onClick={clear(setSignatureText)}>
            🗑️ Borrar
          </button>
        </div>

        <h3>Guía rápida</h3>
        <ul className="guidelines">
          <li>Logo del curso: PNG/JPG, máximo 200×200 px</li>
          <li>Emitido por: nombre de tu organización</li>
          <li>Logo de institución: PNG/JPG, máximo 100×100 px</li>
          <li>Tu Nombre: hasta 50 caracteres</li>
          <li>Fecha de emisión: selecciona la fecha correcta</li>
          <li>Firma electrónica o texto de firma</li>
        </ul>
      </aside >

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
      </section >
    </div >
  )
}







