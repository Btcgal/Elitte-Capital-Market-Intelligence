import html2pdf from 'html2pdf.js';

export const generateStandardPDF = async (elementId: string, filename: string) => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    console.error(`Elemento com ID ${elementId} não encontrado.`);
    return;
  }

  const offScreenContainer = document.createElement('div');
  offScreenContainer.style.position = 'absolute';
  offScreenContainer.style.left = '-9999px'; 
  offScreenContainer.style.top = '0';
  document.body.appendChild(offScreenContainer);

  const element = originalElement.cloneNode(true) as HTMLElement;
  
  // CORREÇÃO DE LARGURA: 800px exatos e sem limite de altura
  element.style.display = 'block'; 
  element.style.width = '800px';
  element.style.backgroundColor = '#ffffff'; 
  element.style.color = '#1a1a1a';
  element.classList.add('pdf-report-active');

  offScreenContainer.appendChild(element);

  await new Promise(resolve => setTimeout(resolve, 800));

  const opt = {
    margin: [15, 15, 20, 15],
    filename: filename,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      windowWidth: 800, // Sincronizado com o width do elemento
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Erro na geração do PDF:', error);
    alert('Erro ao gerar o documento.');
  } finally {
    if (document.body.contains(offScreenContainer)) {
      document.body.removeChild(offScreenContainer);
    }
  }
};
