// frontend/src/components/workers/WorkerCard.jsx
import React from 'react';
import { Card, Container, Button, Image, Row, Col } from 'react-bootstrap';
import { FaDownload, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function WorkerCard({ worker, onEmail, onBack }) {
  // 🧠 Convierte imagen a Base64 (sin tocar el servidor)
  const toDataURL = (url) => {
    return fetch(url)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  };

  // 📄 Generar PDF con html2canvas + jsPDF
  const handleDownload = async () => {
    const carnet = document.getElementById('carnet');

    // Reemplazar imagen por Base64 antes de capturar
    const img = carnet.querySelector('.worker-photo');
    if (img && img.src.startsWith('http')) {
      const base64 = await toDataURL(img.src);
      img.src = base64;
    }

    // Convertir el carnet a imagen y luego a PDF
    const canvas = await html2canvas(carnet, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 80;
    const pdfHeight = 120;

    pdf.addImage(imgData, 'PNG', (210 - pdfWidth) / 2, 30, pdfWidth, pdfHeight);
    pdf.save(`${worker.nombres}_${worker.apellidos}_Carnet.pdf`);
  };

  return (
    <Container
      className="d-flex flex-column justify-content-center align-items-center worker-card"
      style={{ minHeight: '90vh' }}
    >
      {/* Tarjeta del carnet */}
      <Card
        id="carnet"
        className="shadow-lg border-0 rounded-4 d-flex flex-column align-items-center"
        style={{
          width: '370px',
          height: '560px',
          background: 'linear-gradient(180deg, #0d9dfdff 30%, #f8f2f2ff 30%)',
          overflow: 'hidden',
        }}
      >
        {/* Encabezado */}
        <div
          className="text-center text-white py-2 fw-bold w-100"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            letterSpacing: '1px',
          }}
        >
          CONTROL DE ASISTENCIA
        </div>

        {/* Contenido del carnet */}
        <Card.Body className="text-center flex-grow-1">
          {/* Foto cuadrada */}
          <Image
            src={
              worker.foto
                ? `http://localhost:5000${worker.foto}`
                : 'https://via.placeholder.com/130?text=Foto'
            }
            alt="Foto del trabajador"
            width={130}
            height={130}
            className="worker-photo border border-3 border-white shadow-sm mt-3"
            style={{
              objectFit: 'cover',
              borderRadius: '10px',
            }}
            onError={(e) =>
              (e.target.src = 'https://via.placeholder.com/130?text=Foto')
            }
          />

          {/* Datos del trabajador */}
          <h5 className="mt-4 mb-2 fw-bold text-uppercase text-dark">
            {worker.nombres} {worker.apellidos}
          </h5>

          <p className="text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
            DNI: <strong>{worker.dni}</strong>
          </p>

          <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
            Área: <strong>{worker.area || worker.nombre_area}</strong>
          </p>

          {/* Código QR */}
          <div
            className="d-flex justify-content-center align-items-center bg-light border rounded mt-3 mx-auto"
            style={{
              width: '190px',
              height: '190px',
              boxShadow: '0 0 6px rgba(0,0,0,0.1)',
            }}
          >
            <Image
              src={worker.qrImage || 'https://via.placeholder.com/150?text=QR'}
              alt="Código QR"
              width={170}
              height={170}
              className="p-1 rounded"
            />
          </div>

          <small
            className="text-muted mt-3 d-block"
            style={{ fontSize: '0.85rem' }}
          >
            Escanee este código para registrar su asistencia
          </small>
        </Card.Body>
      </Card>

      {/* Botones de acción */}
      <Row className="mt-4 text-center">
        <Col>
          <Button variant="secondary" className="mx-2 px-3" onClick={onBack}>
            <FaArrowLeft className="me-1" /> Volver
          </Button>

          <Button
            variant="outline-primary"
            className="mx-2 px-3"
            onClick={handleDownload}
          >
            <FaDownload className="me-1" /> Descargar Carnet
          </Button>

          <Button variant="success" className="mx-2 px-3" onClick={onEmail}>
            <FaEnvelope className="me-1" /> Enviar Correo
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
