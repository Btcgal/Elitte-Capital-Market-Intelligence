import html2pdf from 'html2pdf.js';

export const generateStandardPDF = async (elementId: string, filename: string) => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.error(`Elemento com ID ${elementId} não encontrado.`);
    return;
  }

  const element = originalElement.cloneNode(true) as HTMLElement;
  
  // Forçamos estilos em linha no clone para a fotografia sair perfeita
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.width = '210mm';
  element.style.zIndex = '-9999';
  element.style.backgroundColor = '#ffffff'; 
  element.style.color = '#1a1a1a';
  element.style.height = 'auto';
  element.style.overflow = 'visible';
  element.style.display = 'block'; 
  
  element.classList.add('pdf-report-active');

  document.body.appendChild(element);

  // Delay para carregar fontes e renderizar gráficos
  await new Promise(resolve => setTimeout(resolve, 500));

  const opt = {
    margin: [15, 15, 20, 15] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 1 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      windowWidth: 1024,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    await html2pdf().from(element).set(opt).save();
  } catch (error) {
    console.error('Erro na geração do PDF:', error);
    throw error;
  } finally {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
  }
};
